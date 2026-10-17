import { Field } from "@/components";
import { today } from "@/lib/dates";

export function DayNav({
  day,
  onPrevious,
  onNext,
  onToday,
  onPick,
}: {
  day: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onPick: (day: string) => void;
}) {
  return (
    <div className="filters">
      <button type="button" className="btn" onClick={onPrevious} aria-label="Previous day">
        ←
      </button>
      <button type="button" className="btn" onClick={onToday}>
        Today
      </button>
      <button type="button" className="btn" onClick={onNext} aria-label="Next day" disabled={day >= today()}>
        →
      </button>
      <Field inline label={<span className="sr-only">Day</span>}>
        <input type="date" value={day} max={today()} onChange={(e) => e.target.value && onPick(e.target.value)} />
      </Field>
    </div>
  );
}
