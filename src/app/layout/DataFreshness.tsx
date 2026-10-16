import { useHealth } from "@/api";
import { formatDay } from "@/lib/dates";

/** "Data through Oct 12": the latest workout the API knows about, or that the API is down. */
export function DataFreshness() {
  const health = useHealth();
  if (health.isError) return <span>API offline</span>;
  const latest = health.data?.latest_activity_date;
  return <span>{latest ? `Data through ${formatDay(latest)}` : ""}</span>;
}
