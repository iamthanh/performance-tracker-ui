import { activityPath, calendarMonthPath } from "./paths";

describe("paths", () => {
  it("encodes activity ids", () => {
    expect(activityPath({ source: "strava", source_id: "a/b" })).toBe("/activities/strava/a%2Fb");
  });

  it("links a day to its calendar month", () => {
    expect(calendarMonthPath("2026-10-14")).toBe("/calendar?month=2026-10");
  });
});
