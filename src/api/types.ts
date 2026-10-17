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
  | "temperature";

export type Streams = Partial<Record<Channel, (number | null)[]>> & { time: number[] };

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
