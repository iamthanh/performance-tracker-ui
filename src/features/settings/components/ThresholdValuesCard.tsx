import type { ThresholdValue } from "@/api";
import { Badge, Card, CardHeader, DataTable } from "@/components";
import { formatFullDay } from "@/lib/dates";

import type { ThresholdEditor } from "../hooks/useThresholdEditor";
import { describeThreshold, formatThresholdNumber, metricInfo } from "../lib/thresholdMetrics";

/** Every automatic and manual value, newest first; manual ones can be removed. */
export function ThresholdValuesCard({ values, editor }: { values: ThresholdValue[]; editor: ThresholdEditor }) {
  const rows = [...values].sort((a, b) => b.effective_date.localeCompare(a.effective_date));
  const confirmRemove = (v: ThresholdValue) => {
    if (window.confirm(`Remove your ${describeThreshold(v)}? Workouts from that date will be re-scored.`)) editor.removeValue(v);
  };
  return (
    <Card label="All threshold values" style={{ padding: 0 }}>
      <CardHeader title="All values" style={{ padding: "16px 16px 0" }} />
      <div className="table-wrap" style={{ maxHeight: 480 }}>
        <DataTable
          rows={rows}
          rowKey={(v) => `${v.metric}/${v.effective_date}/${v.origin}`}
          columns={[
            { key: "metric", header: "Threshold", cell: (v) => metricInfo(v.metric).label },
            { key: "from", header: "From", cell: (v) => formatFullDay(v.effective_date) },
            {
              key: "value",
              header: "Value",
              cell: (v) => (
                <>
                  {formatThresholdNumber(v)} {metricInfo(v.metric).unit}
                </>
              ),
            },
            {
              key: "origin",
              header: "Origin",
              headerClassName: "left",
              cellClassName: "left",
              cell: (v) => (v.origin === "manual" ? <Badge>yours</Badge> : <span className="muted">auto</span>),
            },
            { key: "note", header: "Note", headerClassName: "left", cellClassName: "left secondary", cell: (v) => v.note },
            {
              key: "remove",
              header: null,
              cell: (v) =>
                v.origin === "manual" ? (
                  <button type="button" className="btn ghost small" disabled={editor.removing} onClick={() => confirmRemove(v)}>
                    Remove
                  </button>
                ) : null,
            },
          ]}
        />
      </div>
    </Card>
  );
}
