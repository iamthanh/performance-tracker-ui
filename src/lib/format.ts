// Display formatting. Every function accepts null/undefined and returns an em dash for "no value".

const DASH = "—";

export function isNum(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function num(v: number | null | undefined, digits = 0): string {
  if (!isNum(v)) return DASH;
  return v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** 1,284 / 12.9K / 4.2M for axis ticks and tiles. */
export function compact(v: number | null | undefined): string {
  if (!isNum(v)) return DASH;
  return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v);
}

/** Seconds -> "2:13:05" (or "13:05" under an hour). */
export function duration(seconds: number | null | undefined): string {
  if (!isNum(seconds)) return DASH;
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Seconds -> "2h 13m" for compact contexts (calendar cards, totals). */
export function hoursMinutes(seconds: number | null | undefined): string {
  if (!isNum(seconds)) return DASH;
  const m = Math.round(seconds / 60);
  const h = Math.floor(m / 60);
  return h ? `${h}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`;
}

/** Elapsed time on a workout's axis: "1:05" past an hour, "45m" before. */
export function elapsedLabel(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}:${String(m).padStart(2, "0")}` : `${m}m`;
}

/** Power-curve durations: 1s, 30s, 5m, 1h, 1h30. */
export function durationLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return seconds % 60 ? `${Math.floor(seconds / 60)}m${seconds % 60}s` : `${seconds / 60}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export function km(metres: number | null | undefined, digits = 1): string {
  return isNum(metres) ? `${num(metres / 1000, digits)} km` : DASH;
}

export function withUnit(v: number | null | undefined, unit: string, digits = 0): string {
  return isNum(v) ? `${num(v, digits)} ${unit}` : DASH;
}

export function pct(v: number | null | undefined, digits = 1): string {
  return isNum(v) ? `${num(v, digits)}%` : DASH;
}

export function signed(v: number | null | undefined, digits = 1): string {
  if (!isNum(v)) return DASH;
  const text = num(Math.abs(v), digits);
  return v > 0 ? `+${text}` : v < 0 ? `−${text}` : text;
}

const SPORT_LABELS: Record<string, string> = {
  cycling: "Ride",
  running: "Run",
  swimming: "Swim",
  walking: "Walk",
  hiking: "Hike",
  rowing: "Row",
  strength: "Strength",
  skiing: "Ski",
  yoga: "Yoga",
};

export function sportLabel(sport: string | null | undefined): string {
  if (!sport) return "Other";
  return SPORT_LABELS[sport] ?? sport.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
