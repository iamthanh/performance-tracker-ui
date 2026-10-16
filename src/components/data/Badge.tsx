import type { ReactNode } from "react";

/** A small pill label (a sport, "yours"). */
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
