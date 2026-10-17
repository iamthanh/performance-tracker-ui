import { today } from "@/lib/dates";

import { dayFromParam } from "./day";

it("reads ?day= and falls back to today", () => {
  expect(dayFromParam("2026-10-12")).toBe("2026-10-12");
  for (const bad of [null, "", "2026-13-45", "2026-02-31", "yesterday"]) expect(dayFromParam(bad)).toBe(today());
});
