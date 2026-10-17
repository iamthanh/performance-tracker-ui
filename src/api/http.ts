// HTTP plumbing for the fitness-hub API: every request goes to /api (proxied to the backend by Vite).

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** True when the API could not be reached at all (nothing listening, or the dev proxy failed). */
    readonly unreachable = false,
  ) {
    super(message);
  }
}

const UNREACHABLE = "Cannot reach the fitness-hub API. Is `fitness-hub serve-api` running?";

type Params = Record<string, string | number | string[] | undefined | null>;

/** `?a=1&b=x&b=y` from params; empty and missing values are left out. */
export function query(params: Params = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    for (const v of Array.isArray(value) ? value : [value]) search.append(key, String(v));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** The error for a failed response: the API's own `{"detail": …}` message when there is one. */
export function apiError(status: number, statusText: string, body: string): ApiError {
  let detail = statusText;
  let fromApi = false; // the API always answers errors with a JSON {"detail": ...}
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (typeof parsed.detail === "string") {
      detail = parsed.detail;
      fromApi = true;
    } else if (Array.isArray(parsed.detail)) {
      detail = parsed.detail
        .map((d: { msg?: string; loc?: unknown[] }) => {
          const field = d.loc?.[d.loc.length - 1];
          return typeof field === "string" ? `${field}: ${d.msg}` : d.msg;
        })
        .join("; ");
      fromApi = true;
    }
  } catch {
    // not JSON: an error page from a proxy in front of the API
  }
  // Vite's dev proxy answers a refused connection with an empty 500; gateways use 502/504.
  const unreachable = !fromApi && [500, 502, 504].includes(status);
  return new ApiError(status, unreachable ? UNREACHABLE : detail, unreachable);
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, UNREACHABLE, true);
  }
  if (!response.ok) throw apiError(response.status, response.statusText, await response.text().catch(() => ""));
  if (response.status === 204) return undefined as T; // a delete: no body
  return (await response.json()) as T;
}
