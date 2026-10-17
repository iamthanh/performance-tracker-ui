// Uploading an activity file. XMLHttpRequest rather than fetch: only it reports upload progress.

import { ApiError, apiError, query } from "./http";
import type { ImportResult } from "./types";

export type ImportOptions = { name?: string; activityType?: string; timezone?: string };

/** POSTs the file's bytes to /api/activities/import; `onUploaded` fires once they are all sent
 *  (the server is then parsing and analysing), `onProgress` with 0-1 while sending. */
export function importActivityFile(
  file: File,
  options: ImportOptions,
  { onProgress, onUploaded }: { onProgress?: (fraction: number) => void; onUploaded?: () => void } = {},
): Promise<ImportResult> {
  const params = query({
    filename: file.name,
    name: options.name,
    activity_type: options.activityType,
    timezone: options.timezone,
  });
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/activities/import${params}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress?.(e.loaded / e.total);
    };
    xhr.upload.onload = () => onUploaded?.();
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as ImportResult);
        } catch {
          reject(new ApiError(xhr.status, "The API sent an unreadable answer"));
        }
      } else if (xhr.status === 404) {
        // The route itself is missing: an API older than this UI.
        reject(new ApiError(404, "This fitness-hub API cannot import files yet: update the backend and restart `fitness-hub serve-api`"));
      } else reject(apiError(xhr.status, xhr.statusText, xhr.responseText));
    };
    xhr.onerror = () => reject(apiError(0, "", ""));
    xhr.send(file);
  });
}
