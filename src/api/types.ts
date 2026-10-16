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
