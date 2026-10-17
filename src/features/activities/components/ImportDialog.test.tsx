import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { ImportResult } from "@/api";

import { useActivityImport } from "../hooks/useActivityImport";
import { ImportDialog } from "./ImportDialog";

const importActivityFile = vi.fn();
vi.mock("@/api/upload", () => ({ importActivityFile: (...args: unknown[]) => importActivityFile(...args) }));

const result = (name: string): ImportResult => ({
  created: true,
  activity: { source: "upload", source_id: "abc", name, local_date: "2026-10-14", start_time: "", activity_type: "Ride",
    sport: "cycling", duration_s: 5400, moving_s: 5400, distance_m: 43200, samples: 5400, channels: ["power"], tss: 126,
    tss_method: "power", intensity_factor: 0.9, normalized_power_w: 220 },
  also_stored_as: [{ source: "strava", source_id: "1", name: "Ride" }],
}); // prettier-ignore

function Harness() {
  const imports = useActivityImport();
  return <ImportDialog open onClose={() => {}} imports={imports} />;
}

function renderDialog() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return screen.getByTestId("import-file-input");
}

afterEach(() => importActivityFile.mockReset());

it("imports files one at a time and reports each", async () => {
  importActivityFile.mockImplementation(async (file: File, _opts, { onUploaded }) => {
    onUploaded();
    if (file.name === "broken.fit") throw new Error("could not read broken.fit");
    return result("Evening Ride");
  });
  const input = renderDialog();
  fireEvent.change(input, { target: { files: [new File(["x"], "ride.fit"), new File(["y"], "broken.fit"), new File(["z"], "notes.txt")] } });
  expect(screen.getByText("✕ Not a .fit, .gpx or .tcx file")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Import 2 files" }));
  expect(await screen.findByText(/could not read broken.fit/)).toBeInTheDocument();
  expect(screen.getByText(/Imported:/)).toHaveTextContent("Evening Ride · Wed, Oct 14, 2026 · 1:30:00 · 43.2 km · 126 TSS");
  expect(screen.getByText(/Also in your Strava data/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "/activities/upload/abc");
  expect(importActivityFile).toHaveBeenCalledTimes(2); // notes.txt never sent
  expect(screen.getByText("1 imported")).toBeInTheDocument();
});

it("sends the name and sport for a single file, and shows progress while busy", async () => {
  let finish: (r: ImportResult) => void = () => {};
  importActivityFile.mockImplementation(
    (_file: File, _opts, { onProgress }) =>
      new Promise<ImportResult>((resolve) => {
        onProgress(0.4);
        finish = resolve;
      }),
  );
  const input = renderDialog();
  fireEvent.change(input, { target: { files: [new File(["x"], "ride.fit.gz")] } });
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Trainer intervals" } });
  fireEvent.change(screen.getByLabelText("Sport"), { target: { value: "VirtualRide" } });
  fireEvent.click(screen.getByRole("button", { name: "Import" }));
  expect(await screen.findByText("Uploading 40%")).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
  expect(screen.getByRole("button", { name: /Importing/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
  expect(importActivityFile.mock.calls[0]![1]).toMatchObject({ name: "Trainer intervals", activityType: "VirtualRide" });
  finish(result("Trainer intervals"));
  await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toBeEnabled());
});
