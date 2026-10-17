import { useState } from "react";

import { Field, Modal, Spinner } from "@/components";

import type { ActivityImport } from "../hooks/useActivityImport";
import { DropZone } from "./DropZone";
import { ImportItemRow } from "./ImportItemRow";
import "../import.css";

const SPORTS = [
  { value: "", label: "From the file" },
  { value: "Ride", label: "Ride" },
  { value: "VirtualRide", label: "Virtual ride" },
  { value: "Run", label: "Run" },
  { value: "Walk", label: "Walk" },
  { value: "Hike", label: "Hike" },
  { value: "Workout", label: "Other" },
];

/** Pick or drop activity files, set a name and sport if wanted, and watch each one import. */
export function ImportDialog({ open, onClose, imports }: { open: boolean; onClose: () => void; imports: ActivityImport }) {
  const [sport, setSport] = useState("");
  const [name, setName] = useState("");
  const { items, running } = imports;
  const queued = items.filter((i) => i.status === "queued").length;
  const done = items.filter((i) => i.status === "done").length;
  const close = () => {
    if (running) return;
    imports.clear();
    setName("");
    onClose();
  };
  const start = () => imports.start({ name: name.trim() || undefined, activityType: sport || undefined });

  return (
    <Modal
      open={open}
      title="Import workouts"
      onClose={close}
      busy={running}
      footer={
        <>
          {done && !running ? <span className="secondary small import-summary">{done} imported</span> : null}
          <button type="button" className="btn" onClick={close} disabled={running}>
            {done && !running ? "Done" : "Cancel"}
          </button>
          <button type="button" className="btn primary" onClick={start} disabled={running || queued === 0}>
            {running ? (
              <>
                <Spinner label="Importing" /> Importing…
              </>
            ) : queued > 1 ? (
              `Import ${queued} files`
            ) : (
              "Import"
            )}
          </button>
        </>
      }
    >
      <p className="secondary small" style={{ margin: 0 }}>
        Files from your bike computer, watch or another app. Each one is analysed (TSS, zones, power curve) as soon as it
        is in; importing the same file again updates it.
      </p>
      <DropZone onFiles={imports.add} disabled={running} />
      <div className="filters" style={{ alignItems: "flex-end" }}>
        <Field label="Sport">
          <select value={sport} onChange={(e) => setSport(e.target.value)} disabled={running}>
            {SPORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={queued > 1 ? "Name (one file at a time)" : "Name"} style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            placeholder="From the file, or e.g. Morning Ride"
            value={name}
            maxLength={200}
            onChange={(e) => setName(e.target.value)}
            disabled={running || queued > 1}
          />
        </Field>
      </div>
      {items.length ? (
        <ul className="import-list" aria-label="Files">
          {items.map((item) => (
            <ImportItemRow key={item.id} item={item} busy={running} onRemove={() => imports.remove(item.id)} onOpen={close} />
          ))}
        </ul>
      ) : null}
    </Modal>
  );
}
