import { Link } from "react-router-dom";

import type { ActivityDetail } from "@/api";
import { Badge, PageHeader } from "@/components";
import { formatFullDay } from "@/lib/dates";
import { sportLabel } from "@/lib/format";
import { calendarMonthPath } from "@/lib/paths";

/** Back link to the workout's day, its name, sport and where it was recorded. */
export function ActivityHeader({ detail }: { detail: ActivityDetail }) {
  const a = detail.activity;
  const recordedWith = [detail.device, a.source === "strava" ? "via Strava" : `via ${a.source}`].filter(Boolean).join(" ");
  return (
    <PageHeader
      eyebrow={<Link to={calendarMonthPath(a.local_date)}>← {formatFullDay(a.local_date)}</Link>}
      title={a.name ?? "Untitled workout"}
      description={
        <>
          <Badge>{sportLabel(a.sport)}</Badge> {recordedWith}
        </>
      }
    />
  );
}
