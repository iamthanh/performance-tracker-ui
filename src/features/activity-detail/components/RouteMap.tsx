import { useMemo } from "react";

import { useColors } from "@/hooks";

import { projectRoute } from "../lib/route";

/** The GPS track as an SVG polyline (no map tiles: nothing leaves the machine), start ring and end dot. */
export function RouteMap({ lat, lng, height = 260 }: { lat: (number | null)[]; lng: (number | null)[]; height?: number }) {
  const c = useColors();
  const path = useMemo(() => projectRoute(lat, lng), [lat, lng]);

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
