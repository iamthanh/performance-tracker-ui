// Response shapes of the fitness-hub read API (`fitness-hub serve-api`).
// Units: metres, seconds, watts, bpm; dates are YYYY-MM-DD on the athlete's local clock.

export type Sport =
  | "cycling"
  | "running"
  | "swimming"
  | "walking"
  | "hiking"
  | "rowing"
  | "strength"
  | "skiing"
  | "yoga"
  | (string & {});

export type TssMethod = "power" | "hr" | null;

export interface Health {
  status: "ok";
  version: string;
  schema_version: number;
  latest_activity_date: string | null;
  last_analysis_at: string | null;
}

export interface Activity {
  source: string;
  source_id: string;
  start_time: string;
  local_date: string;
  activity_type: string | null;
  name: string | null;
  duration_s: number | null;
  moving_s: number | null;
  distance_m: number | null;
  elevation_gain_m: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  avg_power_w: number | null;
  calories: number | null;
  sport: Sport;
}

export interface ActivityRow extends Activity {
  also_recorded_by: string[];
  has_streams: boolean;
  analysed: boolean;
  tss: number | null;
  tss_method: TssMethod;
  intensity_factor: number | null;
  normalized_power_w: number | null;
  work_kj: number | null;
  timer_s: number | null;
  variability_index: number | null;
  efficiency_factor: number | null;
  decoupling_pct: number | null;
  /** Energy burned: recorded calories (from any service's copy), else a ride's kJ of work. */
  kcal: number | null;
}

export interface Zone {
  zone: string;
  upper: number | null; // highest whole W / bpm in the zone; null for the open top zone
  seconds: number;
}

export interface CurvePoint {
  duration_s: number;
  watts: number;
}

export interface Analysis {
  source: string;
  source_id: string;
  timer_s: number | null;
  avg_power_w: number | null;
  max_power_w: number | null;
  normalized_power_w: number | null;
  work_kj: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  hr_20min_bpm: number | null;
  decoupling_pct: number | null;
  ftp_w: number | null;
  threshold_hr: number | null;
  intensity_factor: number | null;
  tss: number | null;
  tss_method: TssMethod;
  variability_index: number | null;
  efficiency_factor: number | null;
  power_zones: Zone[] | null;
  hr_zones: Zone[] | null;
  power_curve: CurvePoint[];
}

export interface Lap {
  start_time?: string;
  total_elapsed_time?: number;
  total_timer_time?: number;
  total_distance?: number;
  total_ascent?: number;
  avg_power?: number;
  max_power?: number;
  normalized_power?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  avg_cadence?: number;
  avg_speed?: number;
  lap_trigger?: string;
}

export interface ActivityDetail {
  activity: Activity & { updated_at: string };
  analysis: Analysis | null;
  streams: { sample_count: number; channels: string[] } | null;
  device: string | null;
  laps: Lap[];
}

export type Channel =
  | "time"
  | "power"
  | "heart_rate"
  | "cadence"
  | "speed"
  | "distance"
  | "altitude"
  | "lat"
  | "lng"
  | "temperature"
  /** W' left (J): derived for a ride with power and an FTP. */
  | "w_bal";

export type Streams = Partial<Record<Channel, (number | null)[]>> & { time: number[] };

// -- per-ride insights: per-kg, durability, W' balance, efforts ---------------------------------

/** Where a weight value comes from: a real weigh-in, or filled from the weigh-ins around it. */
export type WeightKind = "weigh_in" | "interpolated" | "estimated" | "carried";

export interface RideWeight {
  kg: number;
  /** Weighed for this ride, or the day's trend weight (see WeightDay). */
  origin: "pre_workout" | "trend";
  /** What `kg` is: the measured value (a pre-ride weight) or the smoothed trend (also on a weigh-in day). */
  value_is: "measured" | "trend";
  kind: WeightKind;
  /** The ride's day. */
  date: string;
  /** The raw weigh-in of that day, when there was one, and how many readings it averages. */
  weigh_in: number | null;
  weigh_ins: number;
  /** The gap the value was filled across (days since the last weigh-in, when carried). */
  gap_days: number;
  last_weigh_in: string;
}

/** A day of the trend weight: smoothed from the weigh-ins; between them filled, and labelled so. Raw weigh-ins
 *  are never changed. */
export interface WeightDay {
  date: string;
  /** The trend (kg). */
  kg: number;
  kind: WeightKind;
  /** That day's measured weight (kg, the mean of its readings when several), on a weigh-in day. */
  weigh_in: number | null;
  /** How many readings `weigh_in` averages (pre-ride weights included). */
  weigh_ins: number;
  gap_days: number;
  last_weigh_in: string;
}

export interface WeightTrend {
  days: WeightDay[];
  counts: Record<WeightKind, number>;
  interpolate_max_gap_days: number;
  carry_days: number;
}

export interface Durability {
  /** Accumulated work is in kJ (the UI adds kJ/kg when a body weight is known). */
  unit: "kJ";
  /** Work done before the effort may start: 0 (from the start), 100, 200 ... (coarser on very long rides) */
  steps: number[];
  total: number;
  /** Best watts per step, null when too little of the ride was left after it. */
  rows: { duration_s: number; watts: (number | null)[] }[];
  /** Elapsed time (s, the stream clock) when each step was reached. */
  step_times_s?: number[];
  /** Work done (kJ) by round elapsed times: a time axis under the kJ one. */
  time_marks?: { time_s: number; kj: number }[];
}

export interface WPrimeMatch {
  start_s: number;
  low_at_s: number;
  spent_j: number;
  low_j: number;
}

export interface WPrime {
  cp_w: number;
  w_prime_j: number;
  /** CP and W' from the critical-power fit of the year's best efforts, or the ride's FTP with a typical 20 kJ. */
  origin: "fit" | "ftp";
  min_j: number;
  min_at_s: number;
  matches: WPrimeMatch[];
}

export interface Effort {
  start_s: number;
  end_s: number;
  duration_s: number;
  avg_power_w: number;
  max_power_w: number;
  avg_hr: number | null;
  max_hr: number | null;
  avg_cadence: number | null;
  work_kj: number;
  pct_ftp: number;
  zone: string;
  w_prime_spent_j: number;
}

export interface Efforts {
  ftp_w: number;
  count: number;
  time_above_s: number;
  work_above_kj: number;
  items: Effort[];
}

/** The stretch with the highest average power for one duration, and the heart rate over it. */
export interface BestEffort {
  duration_s: number;
  avg_power_w: number;
  /** Elapsed time (s, the stream clock) the stretch starts and ends. */
  start_s: number;
  end_s: number;
  avg_hr: number | null;
  min_hr: number | null;
  max_hr: number | null;
}

export interface Insights {
  weight: RideWeight | null;
  /** 30 s to 60 min, then hourly, as long as the ride; null without cycling power. */
  best_efforts: BestEffort[] | null;
  durability: Durability | null;
  w_prime: WPrime | null;
  efforts: Efforts | null;
}

export interface Totals {
  count: number;
  distance_km: number;
  moving_hours: number;
  elevation_gain_m: number;
  tss: number;
  work_kj: number;
  /** kcal burned in the period's workouts. */
  kcal: number;
  unscored: number;
}

export interface SummaryPeriod {
  /** First day of the day/week/month. */
  period: string;
  total: Totals;
  by_sport: Record<string, Totals>;
}

export interface Summary {
  start_date: string;
  end_date: string;
  group_by: "day" | "week" | "month";
  periods: SummaryPeriod[];
}

export interface LoadDay {
  date: string;
  tss: number;
  ctl: number;
  atl: number;
  tsb: number;
  unscored: number;
}

export interface BestPower extends CurvePoint {
  source: string;
  source_id: string;
  local_date: string;
  name: string | null;
}

export interface DailyMetric {
  date: string;
  metric: string;
  source: string;
  value: number;
}

export interface SleepSession {
  source: string;
  source_id: string;
  local_date: string;
  start_time: string | null;
  end_time: string | null;
  minutes_asleep: number | null;
  minutes_awake: number | null;
  minutes_deep: number | null;
  minutes_light: number | null;
  minutes_rem: number | null;
  is_main: number | null;
}

export interface BodyMeasurement {
  ts: string;
  metric: "weight_kg" | "body_fat_pct" | (string & {});
  source: string;
  value: number;
}

export interface HeartRateDay {
  date: string;
  sources: Record<string, { time: number[]; heart_rate: number[] }>;
}

export type ThresholdMetric = "ftp_w" | "threshold_hr" | "max_hr" | "resting_hr";

export interface ThresholdValue {
  metric: ThresholdMetric;
  effective_date: string;
  origin: "manual" | "auto";
  value: number;
  note: string | null;
}

export interface Thresholds {
  values: ThresholdValue[];
  on: string | null;
  in_effect: Record<ThresholdMetric, number | null> | null;
}

export interface AnalysisResult {
  analysis: { analysed: number; rescored: number; ftp_changes: number; threshold_hr_changes: number };
}

// -- nutrition -------------------------------------------------------------------------------

export const NUTRIENT_KEYS = [
  "kcal",
  "carbs_g",
  "sugars_g",
  "protein_g",
  "fat_g",
  "fiber_g",
  "sodium_mg",
  "potassium_mg",
  "caffeine_mg",
  "fluid_ml",
] as const;
export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
/** Amounts; null = unknown. Per serving for a food, totals for an entry. */
export type Nutrients = Record<NutrientKey, number | null>;

export const MEALS = ["breakfast", "lunch", "dinner", "snack", "pre_workout", "during_workout", "post_workout"] as const;
export type Meal = (typeof MEALS)[number];

export interface Food extends Nutrients {
  id: number;
  name: string;
  brand: string | null;
  serving: string | null;
  note: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type FoodInput = Partial<Nutrients> & {
  name: string;
  brand?: string | null;
  serving?: string | null;
  note?: string | null;
  archived?: boolean;
};

export interface NutritionEntry extends Nutrients {
  id: number;
  source: string;
  source_id: string | null;
  local_date: string;
  consumed_at: string | null;
  meal: Meal;
  activity_source: string | null;
  activity_source_id: string | null;
  /** Seconds into the linked workout. */
  offset_s: number | null;
  food_id: number | null;
  name: string;
  /** Bottles, for a drink. */
  servings: number;
  note: string | null;
  kind: "food" | "drink";
  /** What one bottle holds, for a drink. */
  recipe: DrinkRecipe | null;
  created_at: string;
  updated_at: string;
}

export interface OtherIngredient {
  name: string;
  grams?: number | null;
  carbs_g?: number | null;
  sodium_mg?: number | null;
  caffeine_mg?: number | null;
}

/** One bottle of sports drink. */
export interface DrinkRecipe {
  water_ml: number | null;
  /** Table salt; 1 g is 393 mg of sodium. */
  salt_g: number | null;
  maltodextrin_g: number | null;
  sucrose_g: number | null;
  other: OtherIngredient[];
}

/** Nutrients not given are filled from the food (per serving x servings). */
export type EntryInput = Partial<Nutrients> & {
  local_date: string;
  meal: Meal;
  name?: string;
  food_id?: number;
  servings?: number;
  consumed_at?: string;
  activity_source?: string;
  activity_source_id?: string;
  offset_s?: number;
  note?: string;
  /** Bottles with a recipe instead of a food. */
  drink?: Partial<DrinkRecipe> & { bottles: number };
};

export interface NutritionDay {
  date: string;
  entries: number;
  intake: Nutrients;
  /** Workouts' recorded calories, else kJ of work for rides. */
  workout_kcal: number | null;
  /** The watch's total (BMR + active) and active calories, once synced. */
  total_kcal: number | null;
  active_kcal: number | null;
  /** Intake minus total, when both are known. */
  balance_kcal: number | null;
  /** Today: the day is not over, so its totals are still growing. */
  partial: boolean;
}

export interface Fueling {
  activity: { source: string; source_id: string; name: string | null; local_date: string; moving_s: number | null };
  entries: NutritionEntry[];
  /** Totals taken during the workout. */
  during: Nutrients;
  per_hour: Record<"kcal" | "carbs_g" | "fluid_ml" | "sodium_mg" | "caffeine_mg", number | null>;
  burned_kcal: number | null;
  intensity_factor: number | null;
  carb_share_estimate: number | null;
  carbs_burned_g_estimate: number | null;
  carbs_burned_g_per_h_estimate: number | null;
  /** Bottles drunk during the workout, by ingredient; null without any. */
  drinks: {
    bottles: number;
    water_ml: number;
    salt_g: number;
    maltodextrin_g: number;
    sucrose_g: number;
    other_carbs_g: number;
    glucose_g: number;
    fructose_g: number;
    fructose_per_glucose: number | null;
  } | null;
  weight: WorkoutWeight | null;
  /** From the weights: change, and sweat rate = (weight lost + fluid drunk) / elapsed hours. */
  sweat: { change_kg: number; change_pct: number; sweat_l: number; sweat_l_per_h: number | null } | null;
}

export interface WorkoutWeight {
  pre_kg: number | null;
  post_kg: number | null;
  note: string | null;
  updated_at?: string;
}

// -- importing a file ------------------------------------------------------------------------

export interface ImportResult {
  /** False when the same file was imported before (it was updated). */
  created: boolean;
  activity: {
    source: string;
    source_id: string;
    name: string;
    local_date: string;
    start_time: string;
    activity_type: string;
    sport: Sport;
    duration_s: number | null;
    moving_s: number | null;
    distance_m: number | null;
    samples: number;
    channels: string[];
    tss: number | null;
    tss_method: TssMethod;
    intensity_factor: number | null;
    normalized_power_w: number | null;
  };
  /** The same workout already stored from another service (the lists show it once). */
  also_stored_as: { source: string; source_id: string; name: string | null }[];
}

// -- performance index -----------------------------------------------------------------------------

export const PERFORMANCE_COMPONENTS = ["sprint", "anaerobic", "vo2max", "threshold", "endurance", "durability"] as const;
export type PerformanceComponent = (typeof PERFORMANCE_COMPONENTS)[number];
export type PerformanceWeights = Record<PerformanceComponent, number>;

export interface PerformanceSettings {
  weights: PerformanceWeights;
  /** How fast an untested component eases down, as a share per week (0.005 = 0.5 %). */
  decay_per_week: number;
  presets: Record<string, { label: string; weights: PerformanceWeights }>;
}

export interface PerformanceDay {
  date: string;
  /** Weighted geometric mean of the component indexes; 100 = your baseline. */
  score: number | null;
  components: Record<
    PerformanceComponent,
    {
      index: number | null;
      /** W/kg (durability: the share of fresh power kept). */
      value: number | null;
      tested: string | null;
      /** The value rests on a ride whose weight was estimated across a long gap without weigh-ins. */
      estimated_weight: boolean;
    }
  >;
  /** Median efficiency factor (NP ÷ HR) of steady rides over 42 days; not in the score. */
  efficiency: number | null;
}

/** A new best that raised a component. */
export interface PerformanceEvent {
  date: string;
  component: PerformanceComponent;
  from: number;
  to: number;
  index_change: number;
  ride: {
    source: string;
    source_id: string;
    name: string | null;
    date: string;
    /** The ride's weight and where it came from (pre_ride, weigh_in, interpolated, estimated, carried). */
    kg: number | null;
    weight_kind: string | null;
    /** Its key effort in watts (the threshold: the new FTP in watts at the ride's weight; not for durability). */
    watts?: number | null;
  } | null;
  /** How the new best came about against the ride the previous value rested on: the change in watts and in kg
   *  (< 0 = lighter), in %; (1 + power) / (1 + weight) is the W/kg change. */
  split: { power_pct: number; weight_pct: number } | null;
}

export interface Performance {
  weights: PerformanceWeights;
  decay_per_week: number;
  window_days: number;
  components: { key: PerformanceComponent; label: string; description: string; unit: "W/kg" | "share"; baseline: number | null }[];
  /** The first ride with power, and the day the index starts (once its first 90-day window is full). */
  first_ride: string | null;
  starts: string | null;
  days: PerformanceDay[];
  events: PerformanceEvent[];
}

// -- cardio index ----------------------------------------------------------------------------------

export const CARDIO_SCORED = ["aerobic", "resting_hr", "hr_recovery"] as const;
export type CardioScored = (typeof CARDIO_SCORED)[number];
export type CardioComponent = CardioScored | "drift";
export type CardioWeights = Record<CardioScored, number>;

export interface CardioSettings {
  /** null: automatic (the median power / heart rate of your steady riding). */
  reference_power_w: number | null;
  reference_hr_bpm: number | null;
  weights: CardioWeights;
}

/** What the index rests on: the reference, the slopes fitted within rides and the corrections. */
export interface CardioModel {
  reference: { power_w: number; hr_bpm: number; power_auto: boolean; hr_auto: boolean };
  slope_bpm_per_w: number;
  drift_bpm_per_1000kj: number;
  /** What each condition adds to heart rate: indoors (bpm), heat (bpm per °C above heat_from_c), form (bpm per
   *  point of TSB: below 0, tired, heart rate reads low). */
  corrections: { indoor_bpm: number; heat_bpm_per_c: number; heat_from_c: number; form_bpm_per_tsb: number };
  /** False where there were too few rides and a default was used. */
  fitted: Record<"slope" | "indoor" | "heat" | "form" | "recovery", boolean>;
  rides: number;
  blocks: number;
  /** Rides left out as sensor faults (far from the rides around them once corrected). */
  outliers: number;
}

export interface CardioDay {
  date: string;
  /** Weighted geometric mean of the scored component indexes; 100 = your baseline. */
  score: number | null;
  /** Median corrected heart rate at the reference power over the window (lower is fitter). */
  hr_at_ref: number | null;
  /** The same as power at the reference heart rate (higher is fitter). */
  power_at_ref: number | null;
  /** Rides in the window. */
  rides: number;
  tsb: number | null;
  vo2max: number | null;
  vo2max_basis: {
    resting: "measured" | "setting" | "assumed";
    resting_hr: number;
    max_hr: number | null;
    kg: number;
    weight_kind: string;
  } | null;
  components: Record<CardioComponent, { value: number | null; index: number | null }>;
}

/** One ride's heart rate at the reference power, raw and corrected to outdoors, cool and fresh. */
export interface CardioRide {
  source: string;
  source_id: string;
  name: string | null;
  date: string;
  indoor: boolean;
  temp_c: number | null;
  tsb: number;
  /** Steady blocks in its value. */
  blocks: number;
  raw_bpm: number | null;
  /** Far from the rides around it once corrected (a sensor problem): left out, `bpm` null. */
  outlier: boolean;
  bpm: number | null;
  power_w: number | null;
  /** What each condition added to its heart rate (bpm), taken out of `bpm`. */
  corrections: { indoor: number; heat: number; form: number };
  recovery_bpm: number | null;
  drift: number | null;
}

export interface Cardio {
  weights: CardioWeights;
  settings: CardioSettings;
  window_days: number;
  components: {
    key: CardioComponent;
    label: string;
    description: string;
    unit: string;
    scored: boolean;
    lower_is_better: boolean;
    baseline: number | null;
  }[];
  model: CardioModel | null;
  days: CardioDay[];
  rides: CardioRide[];
}

export interface RideCardio {
  model: CardioModel | null;
  /** `start_s` in riding time (pauses left out); `clock_s` on the stream charts' clock. */
  blocks: { start_s: number; clock_s: number | null; watts: number; bpm: number; temp_c: number | null; kj_before: number; used: boolean; warm_up: boolean }[];
  ride: CardioRide | null;
  /** The median of the other rides of the window up to this one; `bpm_at_conditions` puts it back to this ride's
   *  conditions (indoors, heat, form), to set against its own blocks. */
  normal: { bpm: number; power_w: number; rides: number; bpm_at_conditions: number; difference_bpm: number | null } | null;
  recoveries: { peak_bpm: number; drop_bpm: number; effort_w: number; recovery_w: number; counts: boolean }[];
}
