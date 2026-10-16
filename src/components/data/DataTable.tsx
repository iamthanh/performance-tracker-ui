import type { HTMLAttributes, ReactNode, ThHTMLAttributes } from "react";

export type Column<T> = {
  /** Unique within the table (React key). */
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  /** e.g. "left": columns are right-aligned numbers unless told otherwise. */
  headerClassName?: string;
  cellClassName?: string;
  headerProps?: ThHTMLAttributes<HTMLTableCellElement>;
};

/** A `table.data`: one column definition per column, one row per item. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowProps,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  rowProps?: (row: T) => HTMLAttributes<HTMLTableRowElement>;
}) {
  return (
    <table className="data">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} className={c.headerClassName} {...c.headerProps}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={rowKey(row, i)} {...rowProps?.(row)}>
            {columns.map((c) => (
              <td key={c.key} className={c.cellClassName}>
                {c.cell(row, i)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
