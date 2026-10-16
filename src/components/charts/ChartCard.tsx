import { useState, type ReactNode } from "react";

import { Card, CardHeader } from "../layout";
import { Legend, type LegendItem } from "./Legend";

/** A chart card with a title, optional legend and a chart/table toggle (every chart has a table twin). */
export function ChartCard({
  title,
  subtitle,
  legend,
  actions,
  table,
  refetching = false,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  legend?: LegendItem[];
  actions?: ReactNode;
  table?: () => ReactNode;
  refetching?: boolean;
  children: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card label={title}>
      <CardHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="filters">
            {actions}
            {table ? (
              <div className="segmented" role="group" aria-label={`${title} view`}>
                <button type="button" aria-pressed={!showTable} onClick={() => setShowTable(false)}>
                  Chart
                </button>
                <button type="button" aria-pressed={showTable} onClick={() => setShowTable(true)}>
                  Table
                </button>
              </div>
            ) : null}
          </div>
        }
      />
      {legend && legend.length > 1 && !showTable ? (
        <div style={{ marginBottom: 8 }}>
          <Legend items={legend} />
        </div>
      ) : null}
      <div className={refetching ? "refetching" : undefined}>
        {showTable && table ? (
          <div className="table-wrap" style={{ maxHeight: 420 }}>
            {table()}
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
