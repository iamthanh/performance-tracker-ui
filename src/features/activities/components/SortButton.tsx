import type { Sort, SortKey } from "../lib/sorting";

/** A column header that sorts by its column, showing ↓/↑ while it is the sort column. */
export function SortButton({
  column,
  label,
  sort,
  onSort,
}: {
  column: SortKey;
  label: string;
  sort: Sort;
  onSort: (key: SortKey) => void;
}) {
  return (
    <button type="button" className="btn ghost small" style={{ padding: 0, fontWeight: 550 }} onClick={() => onSort(column)}>
      {label}
      {sort.key === column ? (sort.desc ? " ↓" : " ↑") : ""}
    </button>
  );
}

/** `aria-sort` for a column header. */
export function ariaSort(sort: Sort, column: SortKey): "ascending" | "descending" | "none" {
  return sort.key === column ? (sort.desc ? "descending" : "ascending") : "none";
}
