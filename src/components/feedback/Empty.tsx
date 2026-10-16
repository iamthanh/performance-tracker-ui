import type { ReactNode } from "react";

/** "Nothing here" with an optional hint on how to get data. */
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state">
      <strong>{title}</strong>
      {children}
    </div>
  );
}
