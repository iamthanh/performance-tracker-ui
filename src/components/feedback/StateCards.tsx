import type { ReactNode } from "react";

import { Empty } from "./Empty";
import { ErrorState } from "./ErrorState";
import { Loading } from "./Loading";

// A page's loading, error or empty state on its own card, in place of the page's content.

export function LoadingCard({ label }: { label?: string }) {
  return (
    <div className="card">
      <Loading label={label} />
    </div>
  );
}

export function ErrorCard({ error }: { error: unknown }) {
  return (
    <div className="card">
      <ErrorState error={error} />
    </div>
  );
}

export function EmptyCard({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card">
      <Empty title={title}>{children}</Empty>
    </div>
  );
}
