import { importActivityFile } from "./upload";

class FakeXhr {
  static last: FakeXhr;
  status = 0;
  statusText = "";
  responseText = "";
  upload: { onprogress?: (e: ProgressEvent) => void; onload?: () => void } = {};
  onload?: () => void;
  onerror?: () => void;
  headers: Record<string, string> = {};
  url = "";
  body: unknown;
  constructor() {
    FakeXhr.last = this;
  }
  open(_method: string, url: string) {
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: unknown) {
    this.body = body;
  }
  respond(status: number, body: string) {
    this.status = status;
    this.responseText = body;
    this.onload?.();
  }
}

describe("importActivityFile", () => {
  beforeEach(() => vi.stubGlobal("XMLHttpRequest", FakeXhr));

  it("posts the raw file with its name and the time zone", async () => {
    const file = new File(["fit"], "ride 1.fit");
    const done = importActivityFile(file, { timezone: "America/Los_Angeles", activityType: "Ride" });
    const xhr = FakeXhr.last;
    expect(xhr.url).toBe("/api/activities/import?filename=ride+1.fit&activity_type=Ride&timezone=America%2FLos_Angeles");
    expect(xhr.headers["Content-Type"]).toBe("application/octet-stream");
    expect(xhr.body).toBe(file);
    xhr.respond(201, JSON.stringify({ created: true }));
    await expect(done).resolves.toEqual({ created: true });
  });

  it("explains an API too old to import, and passes on the API's own errors", async () => {
    const old = importActivityFile(new File(["x"], "a.fit"), {});
    FakeXhr.last.respond(404, JSON.stringify({ detail: "Not Found" }));
    await expect(old).rejects.toThrow(/cannot import files yet/);
    const bad = importActivityFile(new File(["x"], "a.fit"), {});
    FakeXhr.last.respond(400, JSON.stringify({ detail: "could not read a.fit" }));
    await expect(bad).rejects.toThrow("could not read a.fit");
  });
});
