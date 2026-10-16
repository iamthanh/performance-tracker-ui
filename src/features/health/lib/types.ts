/** A night's sleep in hours per stage (`asleep` in minutes, as the API reports it). */
export type Night = { date: string; deep: number; light: number; rem: number; awake: number; asleep: number | null };
