import { Link } from "react-router-dom";

import { ProgressBar, Spinner } from "@/components";
import { formatFullDay } from "@/lib/dates";
import { duration, isNum, num } from "@/lib/format";
import { activityPath } from "@/lib/paths";

import { fileSize, type ImportItem } from "../lib/importQueue";

/** One file: its name and size, then where it is in the import, or what came of it. */
export function ImportItemRow({
  item,
  busy,
  onRemove,
  onOpen,
}: {
  item: ImportItem;
  /** Other files are still importing: no leaving the dialog yet. */
  busy: boolean;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const a = item.result?.activity;
  return (
    <li className={`import-item ${item.status}`}>
      <div className="import-file">
        <span className="import-name" title={item.file.name}>
          {item.file.name}
        </span>
        <span className="muted small">{fileSize(item.file.size)}</span>
      </div>
      <div className="import-status" aria-live="polite">
        {item.status === "queued" ? (
          busy ? (
            <span className="secondary">Waiting…</span>
          ) : (
            <>
              <span className="secondary">Ready to import</span>
              <button type="button" className="btn ghost small" onClick={onRemove} aria-label={`Remove ${item.file.name}`}>
                Remove
              </button>
            </>
          )
        ) : item.status === "uploading" ? (
          <>
            <ProgressBar value={item.progress} label={`Uploading ${item.file.name}`} />
            <span className="secondary">Uploading {Math.round(item.progress * 100)}%</span>
          </>
        ) : item.status === "analysing" ? (
          <>
            <Spinner label={`Analysing ${item.file.name}`} />
            <span className="secondary">Reading the file and analysing…</span>
          </>
        ) : item.status === "error" ? (
          <>
            <span className="import-error" role="alert">
              ✕ {item.error}
            </span>
            {busy ? null : (
              <button type="button" className="btn ghost small" onClick={onRemove} aria-label={`Remove ${item.file.name}`}>
                Remove
              </button>
            )}
          </>
        ) : a ? (
          <>
            <span className="import-done">
              ✓ {item.result?.created ? "Imported" : "Already imported, updated"}: <strong>{a.name}</strong> ·{" "}
              {formatFullDay(a.local_date)} · {duration(a.moving_s ?? a.duration_s)}
              {isNum(a.distance_m) && a.distance_m > 0 ? ` · ${num(a.distance_m / 1000, 1)} km` : ""}
              {isNum(a.tss) ? ` · ${num(a.tss)} TSS` : ""}
            </span>
            {busy ? null : (
              <Link to={activityPath(a)} onClick={onOpen}>
                Open
              </Link>
            )}
          </>
        ) : null}
      </div>
      {item.result?.also_stored_as.length ? (
        <p className="small muted import-note">
          Also in your {[...new Set(item.result.also_stored_as.map((d) => sourceName(d.source)))].join(" and ")} data: the
          lists show this workout once.
        </p>
      ) : null}
    </li>
  );
}

function sourceName(source: string): string {
  return { strava: "Strava", garmin: "Garmin", google_health: "Google Health", garmin_export: "Garmin export" }[source] ?? source;
}
