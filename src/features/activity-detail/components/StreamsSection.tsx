import type { UseQueryResult } from "@tanstack/react-query";

import type { Streams } from "@/api";
import { EmptyCard, ErrorCard, LoadingCard } from "@/components";

import type { Highlight } from "../lib/highlight";
import { StreamCharts } from "./StreamCharts";

/** The per-second charts, or why there are none. */
export function StreamsSection({
  hasStreams,
  streams,
  onFoot,
  highlight = null,
  onClearHighlight = () => {},
}: {
  hasStreams: boolean;
  streams: UseQueryResult<Streams>;
  onFoot: boolean;
  highlight?: Highlight | null;
  onClearHighlight?: () => void;
}) {
  if (!hasStreams) {
    return (
      <EmptyCard title="No per-second data for this workout">
        Only its summary was synced. Import your Strava export to get charts, zones and TSS.
      </EmptyCard>
    );
  }
  if (streams.isError) return <ErrorCard error={streams.error} />;
  if (streams.isPending) return <LoadingCard label="Loading charts…" />;
  return <StreamCharts streams={streams.data} onFoot={onFoot} highlight={highlight} onClearHighlight={onClearHighlight} />;
}
