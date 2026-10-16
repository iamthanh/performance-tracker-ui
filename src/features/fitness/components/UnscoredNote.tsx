/** Says how many workouts in the range have no TSS, so load is understated. */
export function UnscoredNote({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <p className="small secondary" role="note">
      {count} workout{count === 1 ? "" : "s"} in this range {count === 1 ? "has" : "have"} no TSS (no per-second data
      imported), so load is understated on those days.
    </p>
  );
}
