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

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, UNREACHABLE, true);
  }
  if (!response.ok) {
    let detail = response.statusText;
    let fromApi = false; // the API always answers errors with a JSON {"detail": ...}
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") {
        detail = body.detail;
        fromApi = true;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail.map((d: { msg?: string }) => d.msg).join("; ");
        fromApi = true;
      }
    } catch {
      // not JSON: an error page from a proxy in front of the API
    }
    // Vite's dev proxy answers a refused connection with an empty 500; gateways use 502/504.
    const unreachable = !fromApi && [500, 502, 504].includes(response.status);
    throw new ApiError(response.status, unreachable ? UNREACHABLE : detail, unreachable);
  }
  if (response.status === 204) return undefined as T; // a delete: no body
  return (await response.json()) as T;
}
