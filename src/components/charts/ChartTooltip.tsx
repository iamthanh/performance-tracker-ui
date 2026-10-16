import type { ReactNode } from "react";

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

type TooltipState = { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> };

/**
 * A Recharts `<Tooltip content>` that renders the hovered data point (the chart's data row of type `T`):
 * `content={tooltipContent<Row>((row) => <TooltipBox … />)}`.
 */
export function tooltipContent<T>(render: (datum: T) => ReactNode) {
  return ({ active, payload }: TooltipState) => {
    const datum = payload?.[0]?.payload as T | undefined;
    if (!active || !datum) return null;
    return render(datum);
  };
}
