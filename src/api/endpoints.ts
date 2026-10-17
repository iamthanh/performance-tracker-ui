// One function per API endpoint (see the backend's README for what each returns).

import { query, request } from "./http";
import type {
  ActivityDetail,
  ActivityRow,
  AnalysisResult,
  BestPower,
  BodyMeasurement,
  DailyMetric,
  EntryInput,
  Food,
  FoodInput,
  Fueling,
  Health,
  HeartRateDay,
  Insights,
  LoadDay,
  NutritionDay,
  NutritionEntry,
  Performance,
  PerformanceSettings,
  PerformanceWeights,
  SleepSession,
  Streams,
  Summary,
  ThresholdMetric,
  Thresholds,
  WeightTrend,
  WorkoutWeight,
} from "./types";

const enc = encodeURIComponent;

const json = (method: "POST" | "PUT", body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  health: () => request<Health>("/health"),
  activities: (p: { start_date?: string; end_date?: string; activity_type?: string; limit?: number } = {}) =>
    request<ActivityRow[]>(`/activities${query(p)}`),
  activity: (source: string, id: string) => request<ActivityDetail>(`/activities/${enc(source)}/${enc(id)}`),
  streams: (source: string, id: string, maxPoints = 2000) =>
    request<Streams>(`/activities/${enc(source)}/${enc(id)}/streams${query({ max_points: maxPoints })}`),
  summary: (p: { start_date: string; end_date: string; group_by?: "day" | "week" | "month" }) =>
    request<Summary>(`/summary${query(p)}`),
  trainingLoad: (p: { start_date?: string; end_date?: string } = {}) => request<LoadDay[]>(`/training-load${query(p)}`),
  powerCurve: (p: { start_date?: string; end_date?: string } = {}) => request<BestPower[]>(`/power-curve${query(p)}`),
  dailyMetrics: (p: { start_date?: string; end_date?: string; metric?: string[] } = {}) =>
    request<DailyMetric[]>(`/daily-metrics${query(p)}`),
  sleep: (p: { start_date?: string; end_date?: string } = {}) => request<SleepSession[]>(`/sleep${query(p)}`),
  body: (p: { start_date?: string; end_date?: string } = {}) => request<BodyMeasurement[]>(`/body${query(p)}`),
  heartRate: (day: string) => request<HeartRateDay>(`/heart-rate/${enc(day)}`),
  thresholds: (on?: string) => request<Thresholds>(`/thresholds${query({ on })}`),
  setThreshold: (body: { metric: ThresholdMetric; effective_date: string; value: number; note?: string }) =>
    request<AnalysisResult>("/thresholds", json("POST", body)),
  deleteThreshold: (metric: ThresholdMetric, effectiveDate: string) =>
    request<AnalysisResult>(`/thresholds/${enc(metric)}/${enc(effectiveDate)}`, { method: "DELETE" }),

  foods: (includeArchived = false) => request<Food[]>(`/nutrition/foods${query({ include_archived: includeArchived ? "true" : undefined })}`),
  createFood: (body: FoodInput) => request<Food>("/nutrition/foods", json("POST", body)),
  updateFood: (id: number, body: FoodInput) => request<Food>(`/nutrition/foods/${id}`, json("PUT", body)),
  deleteFood: (id: number) => request<void>(`/nutrition/foods/${id}`, { method: "DELETE" }),
  nutritionEntries: (p: { start_date?: string; end_date?: string; activity_source?: string; activity_source_id?: string }) =>
    request<NutritionEntry[]>(`/nutrition/entries${query(p)}`),
  createEntry: (body: EntryInput) => request<NutritionEntry>("/nutrition/entries", json("POST", body)),
  updateEntry: (id: number, body: EntryInput) => request<NutritionEntry>(`/nutrition/entries/${id}`, json("PUT", body)),
  deleteEntry: (id: number) => request<void>(`/nutrition/entries/${id}`, { method: "DELETE" }),
  nutritionDaily: (p: { start_date: string; end_date: string }) => request<NutritionDay[]>(`/nutrition/daily${query(p)}`),
  weight: (p: { start_date?: string; end_date?: string } = {}) => request<WeightTrend>(`/weight${query(p)}`),
  performance: (p: { start_date?: string; end_date?: string } = {}) => request<Performance>(`/performance${query(p)}`),
  performanceSettings: () => request<PerformanceSettings>("/performance/settings"),
  setPerformanceSettings: (body: { weights: PerformanceWeights; decay_per_week?: number }) =>
    request<PerformanceSettings>("/performance/settings", json("PUT", body)),
  insights: (source: string, id: string) => request<Insights>(`/activities/${enc(source)}/${enc(id)}/insights`),
  fueling: (source: string, id: string) => request<Fueling>(`/activities/${enc(source)}/${enc(id)}/fueling`),
  setWorkoutWeight: (source: string, id: string, body: { pre_kg: number | null; post_kg: number | null; note?: string | null }) =>
    request<WorkoutWeight>(`/activities/${enc(source)}/${enc(id)}/weight`, json("PUT", body)),
};
