/** The bottle form's inputs as typed (strings; "" = none). */
export type BottleDraft = {
  water_ml: string;
  salt_g: string;
  maltodextrin_g: string;
  sucrose_g: string;
  other: { name: string; grams: string; carbs_g: string; sodium_mg: string; caffeine_mg: string }[];
};

const STORAGE_KEY = "pt-last-bottle";

export const emptyBottle = (): BottleDraft => ({ water_ml: "", salt_g: "", maltodextrin_g: "", sucrose_g: "", other: [] });

/** The last bottle logged in this browser (a convenience: most riders mix the same bottle every time). */
export function loadLastBottle(): BottleDraft {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<BottleDraft> | null;
    if (!saved || typeof saved !== "object") return emptyBottle();
    const text = (v: unknown) => (typeof v === "string" ? v : "");
    return {
      water_ml: text(saved.water_ml),
      salt_g: text(saved.salt_g),
      maltodextrin_g: text(saved.maltodextrin_g),
      sucrose_g: text(saved.sucrose_g),
      other: Array.isArray(saved.other)
        ? saved.other.slice(0, 20).map((o) => ({
            name: text(o?.name),
            grams: text(o?.grams),
            carbs_g: text(o?.carbs_g),
            sodium_mg: text(o?.sodium_mg),
            caffeine_mg: text(o?.caffeine_mg),
          }))
        : [],
    };
  } catch {
    return emptyBottle();
  }
}

export function saveLastBottle(draft: BottleDraft): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, other: draft.other.filter((o) => o.name.trim()) }));
  } catch {
    // storage unavailable: the next form simply starts empty
  }
}
