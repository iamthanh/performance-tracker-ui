import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { importActivityFile } from "@/api";

import { browserTimeZone, rejectReason, type ImportItem } from "../lib/importQueue";

/**
 * Files picked for import and their progress. `start` imports the queued ones one at a time
 * (the server analyses each), then refreshes every query: lists, calendar, load, power curve.
 */
export function useActivityImport() {
  const client = useQueryClient();
  const [items, setItems] = useState<ImportItem[]>([]);
  const [running, setRunning] = useState(false);
  const nextId = useRef(1);

  const update = (id: number, change: Partial<ImportItem>) =>
    setItems((all) => all.map((item) => (item.id === id ? { ...item, ...change } : item)));

  const add = (files: Iterable<File>) => {
    const added = [...files].map((file): ImportItem => {
      const reason = rejectReason(file);
      return { id: nextId.current++, file, status: reason ? "error" : "queued", progress: 0, error: reason ?? undefined };
    });
    setItems((all) => [...all, ...added]);
  };

  const remove = (id: number) => setItems((all) => all.filter((i) => i.id !== id));

  const start = async (options: { name?: string; activityType?: string }) => {
    const queued = items.filter((i) => i.status === "queued");
    if (!queued.length || running) return;
    setRunning(true);
    const timezone = browserTimeZone();
    let imported = 0;
    for (const item of queued) {
      update(item.id, { status: "uploading", progress: 0 });
      try {
        const result = await importActivityFile(
          item.file,
          { ...options, name: queued.length === 1 ? options.name : undefined, timezone },
          {
            onProgress: (progress) => update(item.id, { progress }),
            onUploaded: () => update(item.id, { status: "analysing", progress: 1 }),
          },
        );
        update(item.id, { status: "done", result });
        imported++;
      } catch (error) {
        update(item.id, { status: "error", error: error instanceof Error ? error.message : String(error) });
      }
    }
    setRunning(false);
    if (imported) await client.invalidateQueries();
  };

  const clear = () => setItems((all) => (running ? all : []));

  return { items, running, add, remove, start, clear };
}

export type ActivityImport = ReturnType<typeof useActivityImport>;
