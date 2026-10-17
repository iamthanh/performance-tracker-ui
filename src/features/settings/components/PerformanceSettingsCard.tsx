import { useState, type FormEvent } from "react";

import { PERFORMANCE_COMPONENTS, usePerformanceSettings, useSetPerformanceSettings, type PerformanceSettings } from "@/api";

type Save = ReturnType<typeof useSetPerformanceSettings>;
import { Card, CardHeader, ErrorState, Field } from "@/components";
import { num } from "@/lib/format";

import { COMPONENT_LABELS, fromDraft, toDraft, type WeightsDraft } from "../lib/performanceWeights";

/** The performance index's weights (with presets by rider type) and how fast an untested component eases. */
export function PerformanceSettingsCard() {
  const settings = usePerformanceSettings();
  // Here, not in the form: saving refetches the settings, which remounts the form (and would drop the result).
  const save = useSetPerformanceSettings();
  return (
    <Card label="Performance index">
      <CardHeader
        title="Performance index"
        subtitle="How much each component counts in your score, and how fast a component you have not tested eases down. Saving re-scores your whole history."
      />
      {settings.isError ? (
        <ErrorState error={settings.error} />
      ) : settings.data ? (
        // Refill the form when the saved settings change.
        <WeightsForm key={JSON.stringify([settings.data.weights, settings.data.decay_per_week])} saved={settings.data} save={save} />
      ) : null}
    </Card>
  );
}

function WeightsForm({ saved, save }: { saved: PerformanceSettings; save: Save }) {
  const [draft, setDraft] = useState<WeightsDraft>(() => toDraft(saved.weights, saved.decay_per_week));
  const [error, setError] = useState<string | null>(null);
  const total = PERFORMANCE_COMPONENTS.reduce((t, k) => t + (Number(draft[k]) || 0), 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = fromDraft(draft);
    if ("error" in parsed) return setError(parsed.error);
    setError(null);
    save.mutate(parsed);
  };

  return (
    <form onSubmit={submit}>
      <div className="filters" style={{ marginBottom: 12 }} role="group" aria-label="Presets">
        <span className="small muted">Presets:</span>
        {Object.entries(saved.presets).map(([id, preset]) => (
          <button
            key={id}
            type="button"
            className="btn ghost small"
            onClick={() => setDraft({ ...toDraft(preset.weights, Number(draft.decay) / 100 || 0), decay: draft.decay })}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="filters" style={{ alignItems: "flex-end" }}>
        {PERFORMANCE_COMPONENTS.map((k) => (
          // The share sits outside the label, so it is not read as part of the field's name.
          <div key={k}>
            <Field label={COMPONENT_LABELS[k]}>
              <input
                type="number"
                min={0}
                max={100}
                step="any"
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                style={{ width: 90 }}
                aria-describedby={`share-${k} weight-shares`}
              />
            </Field>
            <span id={`share-${k}`} className="small muted">
              {total > 0 ? `${num(((Number(draft[k]) || 0) / total) * 100)} % of the score` : "—"}
            </span>
          </div>
        ))}
        <div>
          <Field label="Easing (% a week)">
            <input type="number" min={0} max={5} step="0.1" value={draft.decay} onChange={(e) => setDraft({ ...draft, decay: e.target.value })} style={{ width: 90 }} />
          </Field>
          <span className="small muted">when untested</span>
        </div>
        <button className="btn primary" type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save"}
        </button>
      </div>
      <p id="weight-shares" className="small muted" style={{ marginBottom: 0 }}>
        Weights are relative: each one's share of the score is shown under it. Easing defaults to 1 % a week, as the
        automatic FTP; <code>fitness-hub performance --backtest</code> compares rates against your history.
      </p>
      {error || save.error ? (
        <p className="small" role="alert" style={{ color: "var(--critical-text)" }}>
          {error ?? save.error?.message}
        </p>
      ) : null}
      {save.isSuccess && !error ? (
        <p className="small" role="status" style={{ color: "var(--success-text)" }}>
          Saved. The performance index uses the new weights.
        </p>
      ) : null}
    </form>
  );
}
