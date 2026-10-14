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

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** True when the API could not be reached at all (nothing listening, or the dev proxy failed). */
    readonly unreachable = false,
  ) {
    super(message);
  }
}

const UNREACHABLE = "Cannot reach the fitness-hub API. Is `fitness-hub serve-api` running?";

type Params = Record<string, string | number | string[] | undefined | null>;

function query(params: Params = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    for (const v of Array.isArray(value) ? value : [value]) search.append(key, String(v));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, UNREACHABLE, true);
  }
  if (!response.ok) {
    let detail = response.statusText;
    let fromApi = false; // the API always answers errors with a JSON {"detail": ...}
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") {
        detail = body.detail;
        fromApi = true;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail.map((d: { msg?: string }) => d.msg).join("; ");
        fromApi = true;
      }
    } catch {
      // not JSON: an error page from a proxy in front of the API
    }
    // Vite's dev proxy answers a refused connection with an empty 500; gateways use 502/504.
    const unreachable = !fromApi && [500, 502, 504].includes(response.status);
    throw new ApiError(response.status, unreachable ? UNREACHABLE : detail, unreachable);
  }
  return (await response.json()) as T;
}

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
