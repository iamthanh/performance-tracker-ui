import type { CSSProperties, ReactNode } from "react";

const INLINE: CSSProperties = { flexDirection: "row", alignItems: "center" };

/** A labelled form control: the label above it, or beside it when `inline`. */
export function Field({
  label,
  inline = false,
  style,
  children,
}: {
  label: ReactNode;
  inline?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <label className="field" style={inline ? { ...INLINE, ...style } : style}>
      {label}
      {children}
    </label>
  );
}
