import { fromCardioDraft, toCardioDraft } from "./cardioSettings";

const SAVED = { reference_power_w: null, reference_hr_bpm: 146, weights: { aerobic: 60, resting_hr: 25, hr_recovery: 15 } };

it("round-trips the saved settings, an automatic reference as an empty field", () => {
  const draft = toCardioDraft(SAVED);
  expect(draft.power).toBe("");
  expect(fromCardioDraft(draft)).toEqual(SAVED);
});

it("says what is wrong", () => {
  expect(fromCardioDraft({ ...toCardioDraft(SAVED), aerobic: "0" })).toHaveProperty("error");
  expect(fromCardioDraft({ ...toCardioDraft(SAVED), hr_recovery: "" })).toEqual({ error: "HR recovery: a weight from 0 to 100" });
  expect(fromCardioDraft({ ...toCardioDraft(SAVED), power: "20" })).toEqual({ error: "Reference power: 50 to 600, or empty for automatic" });
});
