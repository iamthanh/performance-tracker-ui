import { useState } from "react";

/** The data index under the pointer in a set of synced Recharts charts (null when not hovering). */
export function useHoverIndex() {
  const [index, setIndex] = useState<number | null>(null);
  return {
    index,
    onMouseMove: (state: { activeTooltipIndex?: number | string | null }) => {
      const i = Number(state?.activeTooltipIndex);
      setIndex(Number.isInteger(i) ? i : null);
    },
    onMouseLeave: () => setIndex(null),
  };
}
