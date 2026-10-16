export type LegendItem = { label: string; color: string; shape?: "line" | "dot" | "rect" };

/** Series keys: a short line (or dot, or square) in the series colour, then its name. */
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
