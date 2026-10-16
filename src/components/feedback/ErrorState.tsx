import { ApiError } from "@/api";

/** An error message; when the API is not running, how to start it. */
export function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  const unreachable = error instanceof ApiError && error.unreachable;
  return (
    <div className="state error" role="alert">
      <strong>{unreachable ? "The fitness-hub API is not reachable" : "Something went wrong"}</strong>
      {unreachable ? (
        <>
          Start it in the backend repo with <code>.venv/bin/fitness-hub serve-api</code>, then reload.
        </>
      ) : (
        message
      )}
    </div>
  );
}
