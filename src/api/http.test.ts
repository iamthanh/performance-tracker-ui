import { request } from "./http";

describe("request", () => {
  it("returns nothing for a 204 (a delete)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    await expect(request("/x", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("names the field in validation errors", async () => {
    const detail = [{ loc: ["body", "kcal"], msg: "Input should be greater than or equal to 0", type: "x" }];
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail }), { status: 422 })));
    await expect(request("/x")).rejects.toThrow("kcal: Input should be greater than or equal to 0");
  });
});
