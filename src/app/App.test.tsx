import { fireEvent, screen, waitFor } from "@testing-library/react";

import { addDays, today } from "@/lib/dates";
import { health, mockApi, renderAt } from "@/test/utils";

it("shows fitness, fatigue and form from the training load", async () => {
  const end = today();
  const load = Array.from({ length: 10 }, (_, i) => ({
    date: addDays(end, i - 9),
    tss: i === 9 ? 0 : 80,
    ctl: 20 + i,
    atl: 30 + i,
    tsb: -10 + (i === 9 ? 7.4 : 0),
    unscored: i === 5 ? 1 : 0,
  }));
  mockApi({
    "/health": health,
    "/training-load": () => load,
    "/summary": (url) => ({ start_date: url.searchParams.get("start_date"), end_date: end, group_by: "week", periods: [] }),
  });
  renderAt("/fitness");
  expect(await screen.findByText("−2.6")).toBeInTheDocument(); // form today
  expect(screen.getByText("29.0")).toBeInTheDocument(); // fitness
  expect(screen.getByText("Neutral")).toBeInTheDocument();
  expect(screen.getByText(/1 workout in this range has no TSS/)).toBeInTheDocument();
  expect(await screen.findByText("Data through Oct 12")).toBeInTheDocument();
});

it("explains how to start the API when it is unreachable", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("Bad Gateway", { status: 502 })));
  renderAt("/fitness");
  expect(await screen.findByText("The fitness-hub API is not reachable")).toBeInTheDocument();
  expect(screen.getByText(/serve-api/)).toBeInTheDocument();
});

it("treats the dev proxy's empty 500 as an unreachable API", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
  renderAt("/fitness");
  expect(await screen.findByText("The fitness-hub API is not reachable")).toBeInTheDocument();
});

it("shows the API's own message for a 503", async () => {
  const detail = "database schema version 4 is newer than this fitness-hub supports (3); upgrade fitness-hub";
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail }), { status: 503 })));
  renderAt("/fitness");
  expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  expect(screen.getByText(detail)).toBeInTheDocument();
});

it("falls back to the current month for an invalid ?month=", async () => {
  mockApi({
    "/health": health,
    "/activities": () => [],
    "/summary": (url) => ({ start_date: url.searchParams.get("start_date"), end_date: "", group_by: "week", periods: [] }),
  });
  renderAt("/calendar?month=2025-13");
  const heading = await screen.findByRole("heading", { level: 1 });
  expect(heading.textContent).toMatch(new RegExp(String(new Date().getFullYear())));
});

it("saves a manual FTP as JSON and reports the re-scoring", async () => {
  const calls = mockApi({
    "/health": health,
    "/thresholds": (_url, init) =>
      init?.method === "POST"
        ? { analysis: { analysed: 0, rescored: 12, ftp_changes: 3, threshold_hr_changes: 1 } }
        : {
            values: [{ metric: "ftp_w", effective_date: "2026-09-25", origin: "auto", value: 220, note: null }],
            on: today(),
            in_effect: { ftp_w: 220, threshold_hr: 168, max_hr: 176, resting_hr: null },
          },
  });
  renderAt("/settings");
  fireEvent.change(await screen.findByLabelText("Value (W)"), { target: { value: "235" } });
  fireEvent.change(screen.getByLabelText("Note"), { target: { value: "ramp test" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Saved. 12 workouts re-scored.")).toBeInTheDocument();
  const post = calls.find((c) => c.init?.method === "POST")!;
  expect(new Headers(post.init!.headers).get("Content-Type")).toBe("application/json");
  expect(JSON.parse(String(post.init!.body))).toEqual({
    metric: "ftp_w",
    effective_date: today(),
    value: 235,
    note: "ramp test",
  });
  await waitFor(() => expect(calls.filter((c) => c.url.pathname === "/api/thresholds").length).toBeGreaterThan(2));
});
