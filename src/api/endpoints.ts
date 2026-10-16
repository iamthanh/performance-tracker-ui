// One function per API endpoint (see the backend's README for what each returns).

import { query, request } from "./http";
import type {
  ActivityDetail,
  ActivityRow,
  AnalysisResult,
  BestPower,
  BodyMeasurement,
  DailyMetric,
  Health,
  HeartRateDay,
  LoadDay,
  SleepSession,
  Streams,
  Summary,
  ThresholdMetric,
  Thresholds,
} from "./types";

const enc = encodeURIComponent;

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
    request<AnalysisResult>("/thresholds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  deleteThreshold: (metric: ThresholdMetric, effectiveDate: string) =>
    request<AnalysisResult>(`/thresholds/${enc(metric)}/${enc(effectiveDate)}`, { method: "DELETE" }),
};
