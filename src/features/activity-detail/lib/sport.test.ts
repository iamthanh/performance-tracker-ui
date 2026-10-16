import { isOnFoot } from "./sport";

it("treats runs, walks and hikes as on foot", () => {
  expect(["running", "walking", "hiking"].every(isOnFoot)).toBe(true);
  expect(["cycling", "swimming", null, undefined].some(isOnFoot)).toBe(false);
});
