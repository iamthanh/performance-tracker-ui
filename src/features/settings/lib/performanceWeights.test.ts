import { fromDraft, toDraft } from "./performanceWeights";

const W = { sprint: 10, anaerobic: 10, vo2max: 15, threshold: 30, endurance: 15, durability: 20 };

describe("performance weights form", () => {
  it("round-trips the saved settings", () => {
    const draft = toDraft(W, 0.005);
    expect(draft.decay).toBe("0.5");
    expect(fromDraft(draft)).toEqual({ weights: W, decay_per_week: 0.005 });
  });

  it("says what is wrong", () => {
    expect(fromDraft({ ...toDraft(W, 0.01), sprint: "" })).toEqual({ error: "Sprint (5 s): a weight from 0 to 100" });
    expect(fromDraft({ ...toDraft(W, 0.01), threshold: "120" })).toHaveProperty("error");
    const zero = toDraft({ sprint: 0, anaerobic: 0, vo2max: 0, threshold: 0, endurance: 0, durability: 0 }, 0.01);
    expect(fromDraft(zero)).toEqual({ error: "At least one weight must be above 0" });
    expect(fromDraft({ ...toDraft(W, 0.01), decay: "9" })).toEqual({ error: "Easing: 0 to 5 % a week" });
  });
});
