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
    "/nutrition/daily": () => [],
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
  // The performance index and the training load each say so.
  expect((await screen.findAllByText("The fitness-hub API is not reachable")).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/serve-api/).length).toBeGreaterThan(0);
});

it("treats the dev proxy's empty 500 as an unreachable API", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
  renderAt("/fitness");
  expect((await screen.findAllByText("The fitness-hub API is not reachable")).length).toBeGreaterThan(0);
});

it("shows the API's own message for a 503", async () => {
  const detail = "database schema version 4 is newer than this fitness-hub supports (3); upgrade fitness-hub";
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail }), { status: 503 })));
  renderAt("/fitness");
  expect((await screen.findAllByText("Something went wrong")).length).toBeGreaterThan(0);
  expect(screen.getAllByText(detail).length).toBeGreaterThan(0);
});

it("falls back to the current month for an invalid ?month=", async () => {
  mockApi({
    "/health": health,
    "/activities": () => [],
    "/nutrition/daily": () => [],
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

const activity = (id: string, name: string, tss: number | null) => ({
  source: "strava",
  source_id: id,
  start_time: `2026-10-0${id}T08:00:00Z`,
  local_date: `2026-10-0${id}`,
  sport: "cycling",
  name,
  tss,
  intensity_factor: null,
  normalized_power_w: null,
  moving_s: 3600,
  timer_s: 3600,
  distance_m: 30000,
  avg_hr: null,
  decoupling_pct: null,
  tss_method: "power",
  has_streams: true,
  kcal: tss === null ? null : tss * 10,
});

it("sorts activities by a column, and flips on a second click", async () => {
  mockApi({ "/health": health, "/activities": () => [activity("1", "Easy", 40), activity("2", "Hard", 95)] });
  renderAt("/activities");
  await screen.findByText("Easy");
  const names = () => screen.getAllByRole("row").slice(1).map((r) => r.textContent ?? "");
  expect(names()[0]).toMatch(/Hard/); // newest first
  const tss = screen.getByRole("button", { name: "TSS" });
  fireEvent.click(tss);
  expect(tss.closest("th")).toHaveAttribute("aria-sort", "descending");
  expect(names()[0]).toMatch(/Hard/);
  fireEvent.click(screen.getByRole("button", { name: /^TSS/ }));
  expect(screen.getByRole("button", { name: /^TSS/ }).closest("th")).toHaveAttribute("aria-sort", "ascending");
  expect(names()[0]).toMatch(/Easy/);
});

it("opens a workout from the activities table with the keyboard", async () => {
  mockApi({
    "/health": health,
    "/activities": () => [activity("1", "Easy", 40)],
  });
  renderAt("/activities");
  const row = (await screen.findByText("Easy")).closest("tr")!;
  fireEvent.keyDown(row, { key: "Enter" });
  // The detail page asks the API for this workout (404 here), which shows its error.
  expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  expect(screen.getByText("not found")).toBeInTheDocument();
});

it("removes a manual threshold only after confirmation", async () => {
  const thresholds = {
    values: [{ metric: "ftp_w", effective_date: "2026-09-02", origin: "manual", value: 245, note: null }],
    on: today(),
    in_effect: { ftp_w: 245, threshold_hr: 168, max_hr: 176, resting_hr: null },
  };
  const calls = mockApi({
    "/health": health,
    "/thresholds": () => thresholds,
    "/thresholds/ftp_w/2026-09-02": () => ({ analysis: { analysed: 0, rescored: 7, ftp_changes: 1, threshold_hr_changes: 0 } }),
  });
  const confirm = vi.fn(() => false);
  vi.stubGlobal("confirm", confirm);
  renderAt("/settings");
  fireEvent.click(await screen.findByRole("button", { name: "Remove" }));
  expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/^Remove your FTP 245 W from .*\? Workouts from that date will be re-scored\.$/));
  expect(calls.some((c) => c.init?.method === "DELETE")).toBe(false);

  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
  expect(await screen.findByText("Removed. 7 workouts re-scored.")).toBeInTheDocument();
  expect(calls.some((c) => c.init?.method === "DELETE" && c.url.pathname === "/api/thresholds/ftp_w/2026-09-02")).toBe(true);
});

it("logs a saved food on the Nutrition page", async () => {
  const gel = { id: 7, name: "Maurten Gel 100", brand: null, serving: "1 gel", kcal: 100, carbs_g: 25, sugars_g: null,
    protein_g: null, fat_g: null, fiber_g: null, sodium_mg: 20, potassium_mg: null, caffeine_mg: null, fluid_ml: null,
    note: null, archived: false, created_at: "", updated_at: "" };
  const day = { date: "2026-10-12", entries: 0, intake: { kcal: null }, workout_kcal: null, total_kcal: null,
    active_kcal: null, balance_kcal: null, partial: false };
  const calls = mockApi({
    "/health": health,
    "/nutrition/foods": () => [gel],
    "/nutrition/entries": (_url, init) => (init?.method === "POST" ? { id: 1 } : []),
    "/nutrition/daily": () => [day],
  });
  renderAt("/nutrition?day=2026-10-12");
  expect(await screen.findByText("Nothing logged for this day")).toBeInTheDocument();
  fireEvent.change(await screen.findByLabelText("Item"), { target: { value: "7" } });
  fireEvent.change(screen.getByLabelText("Servings"), { target: { value: "2" } });
  expect(screen.getByText(/Adds 200 kcal energy · 50 g carbs · 40 mg sodium/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
  await waitFor(() => expect(calls.some((c) => c.init?.method === "POST")).toBe(true));
  const post = calls.find((c) => c.init?.method === "POST")!;
  expect(JSON.parse(String(post.init!.body))).toEqual({ local_date: "2026-10-12", meal: "breakfast", servings: 2, food_id: 7 });
});

it("shows calories burned and sorts by them", async () => {
  mockApi({ "/health": health, "/activities": () => [activity("1", "Easy", 40), activity("2", "Hard", 95), activity("3", "No data", null)] });
  renderAt("/activities");
  await screen.findByText("Easy");
  const cells = () => screen.getAllByRole("row").slice(1).map((r) => r.textContent ?? "");
  expect(cells().find((r) => r.includes("Hard"))).toMatch(/950 kcal/);
  fireEvent.click(screen.getByRole("button", { name: "Calories" }));
  expect(cells().map((r) => r.match(/Easy|Hard|No data/)?.[0])).toEqual(["Hard", "Easy", "No data"]); // unknown last
});
