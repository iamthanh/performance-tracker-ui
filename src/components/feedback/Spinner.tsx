/** A small busy indicator; `label` is announced to screen readers. */
export function Spinner({ label = "Working…" }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label} />;
}
