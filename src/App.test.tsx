import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { App } from "./App";
import { addDays, today } from "./lib/dates";

// ResponsiveContainer needs ResizeObserver; jsdom has none.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= NoopResizeObserver as unknown as typeof ResizeObserver;

type Handler = (url: URL, init?: RequestInit) => unknown;

function mockApi(routes: Record<string, Handler>) {
  const calls: { url: URL; init?: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input, "http://localhost");
      calls.push({ url, init });
      const key = Object.keys(routes).find((path) => url.pathname === `/api${path}`);
      if (!key) return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
      return new Response(JSON.stringify(routes[key]!(url, init)), { status: 200 });
    }),
  );
  return calls;
}

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const health = () => ({ status: "ok", version: "0.1.0", schema_version: 3, latest_activity_date: "2026-10-12", last_analysis_at: null });

afterEach(() => {
  vi.unstubAllGlobals();
});

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
