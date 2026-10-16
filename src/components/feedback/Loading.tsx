export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="state" role="status">
      {label}
    </div>
  );
}
