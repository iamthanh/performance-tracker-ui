import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { App } from "@/app/App";

type Handler = (url: URL, init?: RequestInit) => unknown;

/** Stubs fetch: `/api<path>` answers with the handler's JSON, anything else with a 404. Returns the calls made. */
export function mockApi(routes: Record<string, Handler>) {
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

/** Renders the whole app at `path`, with a fresh cache and no retries. */
export function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** A healthy `/api/health` answer. */
export const health = () => ({
  status: "ok",
  version: "0.1.0",
  schema_version: 3,
  latest_activity_date: "2026-10-12",
  last_analysis_at: null,
});
