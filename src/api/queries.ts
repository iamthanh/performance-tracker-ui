// TanStack Query hooks: the only way components read from or write to the API.

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./endpoints";
import type { ThresholdMetric } from "./types";

type Params<K extends keyof typeof api> = Parameters<(typeof api)[K]>[0];

/** Every query key in one place, so caching and invalidation stay consistent. */
export const queryKeys = {
  health: ["health"] as const,
  activities: (p: Params<"activities">) => ["activities", p] as const,
  activity: (source: string, id: string) => ["activity", source, id] as const,
  streams: (source: string, id: string, maxPoints: number) => ["streams", source, id, maxPoints] as const,
  summary: (p: Params<"summary">) => ["summary", p] as const,
  trainingLoad: (p: Params<"trainingLoad">) => ["training-load", p] as const,
  powerCurve: (p: Params<"powerCurve">) => ["power-curve", p] as const,
  dailyMetrics: (p: Params<"dailyMetrics">) => ["daily-metrics", p] as const,
  sleep: (p: Params<"sleep">) => ["sleep", p] as const,
  body: (p: Params<"body">) => ["body", p] as const,
  heartRate: (day: string) => ["heart-rate", day] as const,
  thresholds: (on?: string) => ["thresholds", on] as const,
};

// keepPreviousData: on a filter change charts keep their last render (dimmed) instead of flashing empty.
const keep = { placeholderData: keepPreviousData } as const;

export const useHealth = () => useQuery({ queryKey: queryKeys.health, queryFn: api.health, refetchInterval: 60_000 });

export const useActivities = (p: Params<"activities">) =>
  useQuery({ queryKey: queryKeys.activities(p), queryFn: () => api.activities(p), ...keep });

export const useActivity = (source: string, id: string) =>
  useQuery({ queryKey: queryKeys.activity(source, id), queryFn: () => api.activity(source, id) });

export const useStreams = (source: string, id: string, enabled: boolean, maxPoints = 2000) =>
  useQuery({
    queryKey: queryKeys.streams(source, id, maxPoints),
    queryFn: () => api.streams(source, id, maxPoints),
    enabled,
    staleTime: Infinity, // streams only change on a re-import
  });

export const useSummary = (p: Params<"summary">) =>
  useQuery({ queryKey: queryKeys.summary(p), queryFn: () => api.summary(p), ...keep });

export const useTrainingLoad = (p: Params<"trainingLoad">) =>
  useQuery({ queryKey: queryKeys.trainingLoad(p), queryFn: () => api.trainingLoad(p), ...keep });

/** `keepPrevious`: false where the previous result would be wrong to show meanwhile (another workout's best). */
export const usePowerCurve = (p: Params<"powerCurve">, enabled = true, keepPrevious = true) =>
  useQuery({
    queryKey: queryKeys.powerCurve(p),
    queryFn: () => api.powerCurve(p),
    enabled,
    ...(keepPrevious ? keep : {}),
  });

export const useDailyMetrics = (p: Params<"dailyMetrics">) =>
  useQuery({ queryKey: queryKeys.dailyMetrics(p), queryFn: () => api.dailyMetrics(p), ...keep });

export const useSleep = (p: Params<"sleep">) =>
  useQuery({ queryKey: queryKeys.sleep(p), queryFn: () => api.sleep(p), ...keep });

export const useBody = (p: Params<"body">) => useQuery({ queryKey: queryKeys.body(p), queryFn: () => api.body(p), ...keep });

export const useHeartRate = (day: string) =>
  useQuery({ queryKey: queryKeys.heartRate(day), queryFn: () => api.heartRate(day) });

export const useThresholds = (on?: string) =>
  useQuery({ queryKey: queryKeys.thresholds(on), queryFn: () => api.thresholds(on) });

/** Threshold writes re-score activities, so every derived query is invalidated afterwards. */
export function useThresholdMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries();
  const set = useMutation({ mutationFn: api.setThreshold, onSuccess: invalidate });
  const remove = useMutation({
    mutationFn: ({ metric, effectiveDate }: { metric: ThresholdMetric; effectiveDate: string }) =>
      api.deleteThreshold(metric, effectiveDate),
    onSuccess: invalidate,
  });
  return { set, remove };
}
