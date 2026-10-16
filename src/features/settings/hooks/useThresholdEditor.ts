import { useState } from "react";

import { useThresholdMutations, type ThresholdMetric, type ThresholdValue } from "@/api";

/** Saving and removing manual thresholds, with the last outcome as a message ("Saved. 12 workouts re-scored."). */
export function useThresholdEditor() {
  const { set, remove } = useThresholdMutations();
  const [message, setMessage] = useState<string | null>(null);

  const save = (
    input: { metric: ThresholdMetric; effective_date: string; value: number; note?: string },
    onSaved: () => void,
  ) => {
    setMessage(null);
    set.mutate(input, {
      onSuccess: (r) => {
        setMessage(`Saved. ${r.analysis.rescored} workouts re-scored.`);
        onSaved();
      },
    });
  };

  const removeValue = (v: ThresholdValue) => {
    setMessage(null);
    remove.mutate(
      { metric: v.metric, effectiveDate: v.effective_date },
      { onSuccess: (r) => setMessage(`Removed. ${r.analysis.rescored} workouts re-scored.`) },
    );
  };

  return {
    save,
    removeValue,
    saving: set.isPending,
    removing: remove.isPending,
    message,
    error: set.isError || remove.isError ? ((set.error ?? remove.error) as Error) : null,
  };
}

export type ThresholdEditor = ReturnType<typeof useThresholdEditor>;
