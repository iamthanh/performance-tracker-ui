import { useState } from "react";

import type { ThresholdMetric } from "@/api";
import { today } from "@/lib/dates";

/** The threshold form's fields. Held by the page, so a typed value survives the form unmounting
 *  (e.g. while thresholds reload after a failed refetch). */
export function useThresholdForm() {
  const [metric, setMetric] = useState<ThresholdMetric>("ftp_w");
  const [date, setDate] = useState(today());
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  return {
    metric,
    setMetric,
    date,
    setDate,
    value,
    setValue,
    note,
    setNote,
    /** The fields as the API takes them. */
    input: () => ({ metric, effective_date: date, value: Number(value), note: note || undefined }),
    /** Clear value and note after a save (metric and date stay for the next entry). */
    clear: () => {
      setValue("");
      setNote("");
    },
  };
}

export type ThresholdFormState = ReturnType<typeof useThresholdForm>;
