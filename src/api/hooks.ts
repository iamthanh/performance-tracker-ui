import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./client";
import type { ThresholdMetric } from "./types";

// keepPreviousData: on a filter change charts keep their last render (dimmed) instead of flashing empty.
const keep = { placeholderData: keepPreviousData } as const;

export const useHealth = () => useQuery({ queryKey: ["health"], queryFn: api.health, refetchInterval: 60_000 });

export const useActivities = (p: Parameters<typeof api.activities>[0]) =>
  useQuery({ queryKey: ["activities", p], queryFn: () => api.activities(p), ...keep });

export const useActivity = (source: string, id: string) =>
  useQuery({ queryKey: ["activity", source, id], queryFn: () => api.activity(source, id) });

export const useStreams = (source: string, id: string, enabled: boolean, maxPoints = 2000) =>
  useQuery({
    queryKey: ["streams", source, id, maxPoints],
    queryFn: () => api.streams(source, id, maxPoints),
    enabled,
    staleTime: Infinity, // streams only change on a re-import
  });

export const useSummary = (p: Parameters<typeof api.summary>[0]) =>
  useQuery({ queryKey: ["summary", p], queryFn: () => api.summary(p), ...keep });

export const useTrainingLoad = (p: Parameters<typeof api.trainingLoad>[0]) =>
  useQuery({ queryKey: ["training-load", p], queryFn: () => api.trainingLoad(p), ...keep });

/** `keepPrevious`: false where the previous result would be wrong to show meanwhile (another workout's best). */
export const usePowerCurve = (p: Parameters<typeof api.powerCurve>[0], enabled = true, keepPrevious = true) =>
  useQuery({
    queryKey: ["power-curve", p],
    queryFn: () => api.powerCurve(p),
    enabled,
    ...(keepPrevious ? keep : {}),
  });

export const useDailyMetrics = (p: Parameters<typeof api.dailyMetrics>[0]) =>
  useQuery({ queryKey: ["daily-metrics", p], queryFn: () => api.dailyMetrics(p), ...keep });

export const useSleep = (p: Parameters<typeof api.sleep>[0]) =>
  useQuery({ queryKey: ["sleep", p], queryFn: () => api.sleep(p), ...keep });

export const useBody = (p: Parameters<typeof api.body>[0]) =>
  useQuery({ queryKey: ["body", p], queryFn: () => api.body(p), ...keep });

export const useThresholds = (on?: string) =>
  useQuery({ queryKey: ["thresholds", on], queryFn: () => api.thresholds(on) });

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
