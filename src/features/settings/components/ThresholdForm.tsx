import { useState, type FormEvent } from "react";

import type { ThresholdMetric } from "@/api";
import { Card, CardHeader, Field } from "@/components";
import { today } from "@/lib/dates";

import type { ThresholdEditor } from "../hooks/useThresholdEditor";
import { metricInfo, THRESHOLD_METRICS } from "../lib/thresholdMetrics";

/** Set a threshold from a date on; shows the outcome of the last save or removal. */
export function ThresholdForm({ editor }: { editor: ThresholdEditor }) {
  const [metric, setMetric] = useState<ThresholdMetric>("ftp_w");
  const [date, setDate] = useState(today());
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    editor.save({ metric, effective_date: date, value: Number(value), note: note || undefined }, () => {
      setValue("");
      setNote("");
    });
  };

  return (
    <Card label="Set a threshold">
      <CardHeader
        title="Set a threshold"
        subtitle="A value you set holds until your next one, unless a new best effort pushes the automatic value above it. Every workout from that date on is re-scored."
      />
      <form className="filters" style={{ alignItems: "flex-end" }} onSubmit={submit}>
        <Field label="Threshold">
          <select value={metric} onChange={(e) => setMetric(e.target.value as ThresholdMetric)}>
            {THRESHOLD_METRICS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={<>Value ({metricInfo(metric).unit})</>}>
          <input type="number" required min={1} step="any" value={value} onChange={(e) => setValue(e.target.value)} style={{ width: 110 }} />
        </Field>
        <Field label="Note" style={{ flex: 1, minWidth: 180 }}>
          <input type="text" placeholder="e.g. ramp test" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <button className="btn primary" type="submit" disabled={editor.saving}>
          {editor.saving ? "Saving…" : "Save"}
        </button>
      </form>
      <p className="small muted" style={{ marginBottom: 0 }}>
        {metricInfo(metric).help}
      </p>
      {editor.error ? (
        <p className="small" role="alert" style={{ color: "var(--critical-text)" }}>
          {editor.error.message}
        </p>
      ) : null}
      {editor.message ? (
        <p className="small" style={{ color: "var(--success-text)" }}>
          {editor.message}
        </p>
      ) : null}
    </Card>
  );
}
