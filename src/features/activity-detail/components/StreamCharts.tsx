import { useMemo } from "react";

import type { Streams } from "@/api";
import { Card, CardHeader } from "@/components";
import { duration } from "@/lib/format";

import { useHoverIndex } from "../hooks/useHoverIndex";
import { channelSpecs, streamRows } from "../lib/channels";
import type { Highlight } from "../lib/highlight";
import { StreamChart } from "./StreamChart";
import { StreamReadout } from "./StreamReadout";

/** Power, W′ balance, heart rate, cadence, speed and elevation, one chart each, with a shared hover readout. */
export function StreamCharts({
  streams,
  onFoot,
  highlight,
  onClearHighlight,
}: {
  streams: Streams;
  onFoot: boolean;
  highlight: Highlight | null;
  onClearHighlight: () => void;
}) {
  const hover = useHoverIndex();
  const specs = useMemo(() => channelSpecs(onFoot), [onFoot]);
  const channels = specs.filter((ch) => streams[ch.key]?.some((v) => v !== null));
  const rows = useMemo(() => streamRows(streams, specs), [streams, specs]);

  return (
    <Card label="Workout charts">
      <CardHeader
        title="Workout"
        subtitle="Hover a chart to read every channel at that moment"
        actions={
          highlight ? (
            <span className="badge">
              <i className="key-swatch" style={{ background: "var(--series-4)", opacity: 0.5 }} aria-hidden />
              <span role="status">
                Marked: {highlight.label}, {duration(highlight.start_s)} – {duration(highlight.end_s)}
              </span>
              <button type="button" className="btn ghost small" aria-label="Clear the marked stretch" onClick={onClearHighlight}>
                ✕
              </button>
            </span>
          ) : null
        }
      />
      <StreamReadout channels={channels} at={hover.index !== null ? rows[hover.index] : undefined} />
      {channels.map((ch, i) => (
        <StreamChart
          key={ch.key}
          channel={ch}
          rows={rows}
          showTimeAxis={i === channels.length - 1}
          highlight={highlight}
          onMouseMove={hover.onMouseMove}
          onMouseLeave={hover.onMouseLeave}
        />
      ))}
    </Card>
  );
}
