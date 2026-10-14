import { useMemo } from "react";

import { useColors } from "../lib/theme";

/** The GPS track as an SVG polyline (no map tiles: nothing leaves the machine). Equirectangular,
 *  with longitude scaled by cos(latitude) so shapes are not stretched. */
export function RouteMap({ lat, lng, height = 260 }: { lat: (number | null)[]; lng: (number | null)[]; height?: number }) {
  const c = useColors();
  const path = useMemo(() => {
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
  }, [lat, lng]);

  if (!path) return <div className="state">No GPS track (indoor workout).</div>;
  const pad = 30;
  return (
    <svg
      role="img"
      aria-label="Route"
      viewBox={`${-pad} ${-pad} ${path.width + 2 * pad} ${path.height + 2 * pad}`}
      style={{ width: "100%", height, display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={path.d} fill="none" stroke={c["series-1"]} strokeWidth={3} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={path.start[0]} cy={path.start[1]} r={14} vectorEffect="non-scaling-stroke" fill={c["surface-1"]} stroke={c["text-primary"]} strokeWidth={2} />
      <circle cx={path.end[0]} cy={path.end[1]} r={14} vectorEffect="non-scaling-stroke" fill={c["text-primary"]} stroke={c["surface-1"]} strokeWidth={2} />
    </svg>
  );
}
