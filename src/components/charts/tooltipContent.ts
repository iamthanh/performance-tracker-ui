import type { ReactNode } from "react";

type TooltipState = { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> };

/**
 * A Recharts `<Tooltip content>` that renders the hovered data point (the chart's data row of type `T`):
 * `content={tooltipContent<Row>((row) => <TooltipBox … />)}`.
 */
export function tooltipContent<T>(render: (datum: T) => ReactNode) {
  return ({ active, payload }: TooltipState) => {
    const datum = payload?.[0]?.payload as T | undefined;
    if (!active || !datum) return null;
    return render(datum);
  };
}
