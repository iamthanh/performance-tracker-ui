import type { ImportResult } from "@/api";

/** One file in the import dialog, from picked to imported (or failed). */
export type ImportItem = {
  id: number;
  file: File;
  status: "queued" | "uploading" | "analysing" | "done" | "error";
  /** 0-1 while uploading. */
  progress: number;
  result?: ImportResult;
  error?: string;
};

export const ACCEPTED = [".fit", ".gpx", ".tcx", ".fit.gz", ".gpx.gz", ".tcx.gz"];
export const MAX_FILE_BYTES = 50_000_000;

/** Why a file cannot be imported, before sending it; null if it can. */
export function rejectReason(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!ACCEPTED.some((ext) => name.endsWith(ext))) return "Not a .fit, .gpx or .tcx file";
  if (file.size === 0) return "The file is empty";
  if (file.size > MAX_FILE_BYTES) return "Larger than 50 MB";
  return null;
}

/** "1.2 MB", "820 KB". */
export function fileSize(bytes: number): string {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

/** The browser's IANA time zone, for files without a local clock (GPX, TCX). */
export function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}
