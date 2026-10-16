import type { CSSProperties, ReactNode } from "react";

/** A titled section of a page. `label` names it for screen readers. */
export function Card({
  label,
  className,
  style,
  children,
}: {
  label: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <section className={className ? `card ${className}` : "card"} aria-label={label} style={style}>
      {children}
    </section>
  );
}

/** A card's title and subtitle, with its controls (if any) on the right. */
export function CardHeader({
  title,
  subtitle,
  actions,
  style,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="card-head" style={style}>
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}
