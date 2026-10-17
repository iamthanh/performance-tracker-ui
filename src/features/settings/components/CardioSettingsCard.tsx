import { useState, type FormEvent } from "react";

import { CARDIO_SCORED, useCardio, useCardioSettings, useSetCardioSettings, type CardioSettings } from "@/api";
import { Card, CardHeader, ErrorState, Field } from "@/components";
import { today } from "@/lib/dates";
import { num } from "@/lib/format";

import { CARDIO_LABELS, fromCardioDraft, toCardioDraft, type CardioDraft } from "../lib/cardioSettings";

type Save = ReturnType<typeof useSetCardioSettings>;

/** The cardio index's reference power and heart rate (automatic by default) and the weights of its components. */
export function CardioSettingsCard() {
  const settings = useCardioSettings();
  // Here, not in the form: saving refetches the settings, which remounts the form (and would drop the result).
  const save = useSetCardioSettings();
  // Today's model, for what the automatic references are.
  const day = today();
  const model = useCardio({ start_date: day, end_date: day }).data?.model ?? null;
  return (
    <Card label="Cardio index">
      <CardHeader
        title="Cardio index"
        subtitle="The power and heart rate your steady riding is compared at, and how much each component counts in the cardio score. Saving re-scores your whole history."
      />
      {settings.isError ? (
        <ErrorState error={settings.error} />
      ) : settings.data ? (
        <CardioForm key={JSON.stringify(settings.data)} saved={settings.data} save={save} auto={model?.reference ?? null} />
      ) : null}
    </Card>
  );
}

function CardioForm({ saved, save, auto }: { saved: CardioSettings; save: Save; auto: { power_w: number; hr_bpm: number } | null }) {
  const [draft, setDraft] = useState<CardioDraft>(() => toCardioDraft(saved));
  const [error, setError] = useState<string | null>(null);
  const total = CARDIO_SCORED.reduce((t, k) => t + (Number(draft[k]) || 0), 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = fromCardioDraft(draft);
    if ("error" in parsed) return setError(parsed.error);
    setError(null);
    save.mutate(parsed);
  };

  return (
    <form onSubmit={submit}>
      <div className="filters" style={{ alignItems: "flex-end", marginBottom: 12 }}>
        <div>
          <Field label="Reference power (W)">
            <input
              type="number"
              min={50}
              max={600}
              step="any"
              value={draft.power}
              placeholder={saved.reference_power_w === null && auto ? `auto (${num(auto.power_w)})` : "automatic"}
              onChange={(e) => setDraft({ ...draft, power: e.target.value })}
              style={{ width: 120 }}
            />
          </Field>
        </div>
        <div>
          <Field label="Reference heart rate (bpm)">
            <input
              type="number"
              min={60}
              max={220}
              step="any"
              value={draft.hr}
              placeholder={saved.reference_hr_bpm === null && auto ? `auto (${num(auto.hr_bpm)})` : "automatic"}
              onChange={(e) => setDraft({ ...draft, hr: e.target.value })}
              style={{ width: 120 }}
            />
          </Field>
        </div>
      </div>
      <div className="filters" style={{ alignItems: "flex-end" }}>
        {CARDIO_SCORED.map((k) => (
          <div key={k}>
            <Field label={CARDIO_LABELS[k]}>
              <input
                type="number"
                min={0}
                max={100}
                step="any"
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                style={{ width: 90 }}
                aria-describedby={`cardio-share-${k} cardio-shares`}
              />
            </Field>
            <span id={`cardio-share-${k}`} className="small muted">
              {total > 0 ? `${num(((Number(draft[k]) || 0) / total) * 100)} % of the score` : "—"}
            </span>
          </div>
        ))}
        <button className="btn primary" type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save"}
        </button>
      </div>
      <p id="cardio-shares" className="small muted" style={{ marginBottom: 0 }}>
        Leave a reference empty to use the median of your steady riding. Weights are relative; a component without
        values (resting heart rate before your watch syncs) is left out. <code>fitness-hub cardio --backtest</code> shows
        how much each correction helps on your rides.
      </p>
      {error || save.error ? (
        <p className="small" role="alert" style={{ color: "var(--critical-text)" }}>
          {error ?? save.error?.message}
        </p>
      ) : null}
      {save.isSuccess && !error ? (
        <p className="small" role="status" style={{ color: "var(--success-text)" }}>
          Saved. The cardio index uses the new settings.
        </p>
      ) : null}
    </form>
  );
}
