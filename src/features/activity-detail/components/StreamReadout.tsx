import { useColors } from "@/hooks";
import { duration, withUnit } from "@/lib/format";

import type { ChannelSpec, StreamRow } from "../lib/channels";

/** Every channel's value at the hovered moment ("—" when not hovering). */
export function StreamReadout({ channels, at }: { channels: ChannelSpec[]; at: StreamRow | undefined }) {
  const c = useColors();
  return (
    <div className="readout" aria-live="off">
      <span>
        <span className="muted">Time </span>
        <strong>{at ? duration(at.t) : "—"}</strong>
      </span>
      {channels.map((ch) => (
        <span key={ch.key}>
          <i className="key-line" style={{ background: c[ch.token] }} aria-hidden />
          <span className="muted">{ch.label} </span>
          <strong>{at ? withUnit(at[ch.key], ch.unit, ch.digits) : "—"}</strong>
        </span>
      ))}
    </div>
  );
}
