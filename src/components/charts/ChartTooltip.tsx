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
