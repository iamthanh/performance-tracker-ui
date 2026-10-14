import { useState, type ReactNode } from "react";

import { ApiError } from "../api/client";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="state" role="status">
      {label}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  const unreachable = error instanceof ApiError && error.unreachable;
  return (
    <div className="state error" role="alert">
      <strong>{unreachable ? "The fitness-hub API is not reachable" : "Something went wrong"}</strong>
      {unreachable ? (
        <>
          Start it in the backend repo with <code>.venv/bin/fitness-hub serve-api</code>, then reload.
        </>
      ) : (
        message
      )}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  unit,
  hint,
  hero = false,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  hero?: boolean;
}) {
  return (
    <div className={hero ? "tile hero" : "tile"}>
      <div className="label" title={label}>
        {label}
      </div>
      <div className="value">
        {value}
        {unit && value !== "—" ? <small>{unit}</small> : null}
      </div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export type LegendItem = { label: string; color: string; shape?: "line" | "dot" | "rect" };

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div className="legend" aria-label="Legend">
      {items.map((item) => (
        <span key={item.label}>
          <i className={`key-${item.shape ?? "line"}`} style={{ background: item.color }} aria-hidden />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** A chart card with a title, optional legend and a chart/table toggle (every chart has a table twin). */
export function ChartCard({
  title,
  subtitle,
  legend,
  actions,
  table,
  refetching = false,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  legend?: LegendItem[];
  actions?: ReactNode;
  table?: () => ReactNode;
  refetching?: boolean;
  children: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className="card" aria-label={title}>
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="filters">
          {actions}
          {table ? (
            <div className="segmented" role="group" aria-label={`${title} view`}>
              <button type="button" aria-pressed={!showTable} onClick={() => setShowTable(false)}>
                Chart
              </button>
              <button type="button" aria-pressed={showTable} onClick={() => setShowTable(true)}>
                Table
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {legend && legend.length > 1 && !showTable ? (
        <div style={{ marginBottom: 8 }}>
          <Legend items={legend} />
        </div>
      ) : null}
      <div className={refetching ? "refetching" : undefined}>
        {showTable && table ? <div className="table-wrap" style={{ maxHeight: 420 }}>{table()}</div> : children}
      </div>
    </section>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export type TooltipRow = { name: string; value: string; color?: string };

/** Tooltip body: values lead (strong), names follow; series keyed by a short line, never a box. */
export function TooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="chart-tooltip">
      <div className="title">{title}</div>
      {rows.map((r) => (
        <div className="row" key={r.name}>
          <span className="name">
            {r.color ? <i className="key-line" style={{ background: r.color }} aria-hidden /> : null}
            {r.name}
          </span>
          <strong>{r.value}</strong>
        </div>
      ))}
    </div>
  );
}
