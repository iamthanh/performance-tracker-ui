import { useRef, useState, type DragEvent } from "react";

import { ACCEPTED } from "../lib/importQueue";

/** Drop files here, or click (or press Enter/Space) to choose them. */
export function DropZone({ onFiles, disabled }: { onFiles: (files: FileList) => void; disabled: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  };
  return (
    <div
      className={["dropzone", dragging ? "dragging" : "", disabled ? "disabled" : ""].join(" ")}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Choose activity files to import"
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          input.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
    >
      <strong>Drop .fit, .gpx or .tcx files here</strong>
      <span className="secondary">or click to choose them. Gzipped files (.fit.gz) work too; up to 50 MB each.</span>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPTED.join(",")}
        hidden
        data-testid="import-file-input"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = ""; // choosing the same file again still fires
        }}
      />
    </div>
  );
}
