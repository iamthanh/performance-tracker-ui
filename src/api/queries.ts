// TanStack Query hooks: the only way components read from or write to the API.

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./endpoints";
import type { EntryInput, FoodInput, ThresholdMetric } from "./types";

type Params<K extends keyof typeof api> = Parameters<(typeof api)[K]>[0];

/** Every query key in one place, so caching and invalidation stay consistent. */
export const queryKeys = {
  health: ["health"] as const,
  activities: (p: Params<"activities">) => ["activities", p] as const,
  activity: (source: string, id: string) => ["activity", source, id] as const,
  streams: (source: string, id: string, maxPoints: number) => ["streams", source, id, maxPoints] as const,
  insights: (source: string, id: string) => ["insights", source, id] as const,
  weight: (p: Params<"weight">) => ["weight", p] as const,
  // Both under one prefix, so saving the weights refreshes the index.
  performance: (p: Params<"performance">) => ["performance", "index", p] as const,
  performanceSettings: ["performance", "settings"] as const,
  summary: (p: Params<"summary">) => ["summary", p] as const,
  trainingLoad: (p: Params<"trainingLoad">) => ["training-load", p] as const,
  powerCurve: (p: Params<"powerCurve">) => ["power-curve", p] as const,
  dailyMetrics: (p: Params<"dailyMetrics">) => ["daily-metrics", p] as const,
  sleep: (p: Params<"sleep">) => ["sleep", p] as const,
  body: (p: Params<"body">) => ["body", p] as const,
  heartRate: (day: string) => ["heart-rate", day] as const,
  thresholds: (on?: string) => ["thresholds", on] as const,
  // Everything nutrition shares one prefix, so a write refreshes all of it at once.
  nutrition: ["nutrition"] as const,
  foods: (includeArchived: boolean) => ["nutrition", "foods", includeArchived] as const,
  nutritionEntries: (p: Params<"nutritionEntries">) => ["nutrition", "entries", p] as const,
  nutritionDaily: (p: Params<"nutritionDaily">) => ["nutrition", "daily", p] as const,
  fueling: (source: string, id: string) => ["nutrition", "fueling", source, id] as const,
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

export const useFoods = (includeArchived = false) =>
  useQuery({ queryKey: queryKeys.foods(includeArchived), queryFn: () => api.foods(includeArchived) });

export const useNutritionEntries = (p: Params<"nutritionEntries">) =>
  useQuery({ queryKey: queryKeys.nutritionEntries(p), queryFn: () => api.nutritionEntries(p), ...keep });

export const useNutritionDaily = (p: Params<"nutritionDaily">) =>
  useQuery({ queryKey: queryKeys.nutritionDaily(p), queryFn: () => api.nutritionDaily(p), ...keep });

export const useWeight = (p: Params<"weight"> = {}) =>
  useQuery({ queryKey: queryKeys.weight(p), queryFn: () => api.weight(p) });

export const usePerformance = (p: Params<"performance">) =>
  useQuery({ queryKey: queryKeys.performance(p), queryFn: () => api.performance(p), ...keep });

export const usePerformanceSettings = () =>
  useQuery({ queryKey: queryKeys.performanceSettings, queryFn: api.performanceSettings });

/** Saving the weights or decay re-scores the whole index. */
export function useSetPerformanceSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.setPerformanceSettings,
    onSuccess: () => client.invalidateQueries({ queryKey: ["performance"] }),
  });
}

export const useInsights = (source: string, id: string) =>
  useQuery({ queryKey: queryKeys.insights(source, id), queryFn: () => api.insights(source, id) });

export const useFueling = (source: string, id: string) =>
  useQuery({ queryKey: queryKeys.fueling(source, id), queryFn: () => api.fueling(source, id) });

/** Food and entry writes; each refreshes every nutrition query (days, entries, fueling, foods). */
export function useNutritionMutations() {
  const client = useQueryClient();
  const onSuccess = () => client.invalidateQueries({ queryKey: queryKeys.nutrition });
  return {
    createFood: useMutation({ mutationFn: (body: FoodInput) => api.createFood(body), onSuccess }),
    updateFood: useMutation({ mutationFn: ({ id, body }: { id: number; body: FoodInput }) => api.updateFood(id, body), onSuccess }),
    deleteFood: useMutation({ mutationFn: (id: number) => api.deleteFood(id), onSuccess }),
    createEntry: useMutation({ mutationFn: (body: EntryInput) => api.createEntry(body), onSuccess }),
    updateEntry: useMutation({ mutationFn: ({ id, body }: { id: number; body: EntryInput }) => api.updateEntry(id, body), onSuccess }),
    deleteEntry: useMutation({ mutationFn: (id: number) => api.deleteEntry(id), onSuccess }),
    setWorkoutWeight: useMutation({
      mutationFn: ({ source, id, pre_kg, post_kg }: { source: string; id: string; pre_kg: number | null; post_kg: number | null }) =>
        api.setWorkoutWeight(source, id, { pre_kg, post_kg }),
      // The pre-workout weight is what the ride's per-kg values use.
      onSuccess: () => Promise.all([onSuccess(), client.invalidateQueries({ queryKey: ["insights"] })]),
    }),
  };
}
