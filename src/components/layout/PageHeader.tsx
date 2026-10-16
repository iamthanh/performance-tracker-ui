import type { ReactNode } from "react";

/** The page title and description, with the page's controls (if any) on the right. */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** A line above the title, e.g. a back link. */
  eyebrow?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow ? (
          <p className="small" style={{ margin: 0 }}>
            {eyebrow}
          </p>
        ) : null}
        <h1 style={eyebrow ? { marginTop: 4 } : undefined}>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
