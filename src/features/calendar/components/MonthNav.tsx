export function MonthNav({ onPrevious, onToday, onNext }: { onPrevious: () => void; onToday: () => void; onNext: () => void }) {
  return (
    <div className="filters">
      <button type="button" className="btn" onClick={onPrevious} aria-label="Previous month">
        ←
      </button>
      <button type="button" className="btn" onClick={onToday}>
        Today
      </button>
      <button type="button" className="btn" onClick={onNext} aria-label="Next month">
        →
      </button>
    </div>
  );
}
