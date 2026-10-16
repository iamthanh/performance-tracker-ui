/** A GPS track projected for an SVG: path data in a box up to 1000 units on its long side. */
export type ProjectedRoute = {
  d: string;
  width: number;
  height: number;
  start: readonly [number, number];
  end: readonly [number, number];
};

/** Equirectangular projection with longitude scaled by cos(latitude), so shapes are not stretched.
 *  Missing and (0, 0) points are skipped; null when fewer than two remain. */
export function projectRoute(lat: (number | null)[], lng: (number | null)[]): ProjectedRoute | null {
  const pts: [number, number][] = [];
  for (let i = 0; i < lat.length; i++) {
    const y = lat[i];
    const x = lng[i];
    if (typeof x === "number" && typeof y === "number" && (x !== 0 || y !== 0)) pts.push([x, y]);
  }
  if (pts.length < 2) return null;
  const meanLat = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const k = Math.cos((meanLat * Math.PI) / 180);
  const xs = pts.map((p) => p[0] * k);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = maxX - minX || 1e-9;
  const h = maxY - minY || 1e-9;
  const size = 1000;
  const scale = size / Math.max(w, h);
  const coords = pts.map((_, i) => [(xs[i]! - minX) * scale, (maxY - ys[i]!) * scale] as const);
  return {
    d: coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(""),
    width: w * scale,
    height: h * scale,
    start: coords[0]!,
    end: coords[coords.length - 1]!,
  };
}
