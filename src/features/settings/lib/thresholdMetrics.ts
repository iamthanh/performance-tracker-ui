import type { ThresholdMetric, ThresholdValue } from "@/api";
import { formatFullDay } from "@/lib/dates";
import { num } from "@/lib/format";

export type ThresholdMetricInfo = { value: ThresholdMetric; label: string; short: string; unit: string; help: string };

/** The thresholds a rider can set, in display order. */
export const THRESHOLD_METRICS: ThresholdMetricInfo[] = [
  { value: "ftp_w", label: "FTP", short: "FTP", unit: "W", help: "Auto: 95% of your best 20-minute ride power in the trailing year" },
  { value: "threshold_hr", label: "Threshold heart rate", short: "Threshold HR", unit: "bpm", help: "Auto: your best 20-minute ride heart rate in the trailing year" },
  { value: "max_hr", label: "Max heart rate", short: "Max HR", unit: "bpm", help: "Auto: third-highest best-30-second heart rate in the trailing year" },
  { value: "resting_hr", label: "Resting heart rate", short: "Resting HR", unit: "bpm", help: "No auto value; 50 bpm is assumed until you set one" },
];

export const metricInfo = (m: ThresholdMetric) => THRESHOLD_METRICS.find((x) => x.value === m)!;

/** "245", "47.5": whole numbers without decimals. */
export function formatThresholdNumber(v: ThresholdValue): string {
  return num(v.value, Number.isInteger(v.value) ? 0 : 1);
}

/** "245 W", "47.5 bpm". */
export function formatThreshold(v: ThresholdValue): string {
  return `${formatThresholdNumber(v)} ${metricInfo(v.metric).unit}`;
}

/** "FTP 245 W from Tue, Sep 2, 2026", for confirmations. */
export function describeThreshold(v: ThresholdValue): string {
  return `${metricInfo(v.metric).label} ${formatThreshold(v)} from ${formatFullDay(v.effective_date)}`;
}
