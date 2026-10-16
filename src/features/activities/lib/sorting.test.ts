import type { ActivityRow } from "@/api";

import { filterAndSort, nextSort } from "./sorting";

const row = (name: string | null, tss: number | null, start_time: string) => ({ name, tss, start_time }) as ActivityRow;

describe("activity sorting", () => {
  const rows = [row("Easy spin", 40, "2026-10-01"), row("Hill repeats", 95, "2026-10-02"), row(null, null, "2026-10-03")];

  it("sorts with missing values last and ties newest first", () => {
    expect(filterAndSort(rows, "", { key: "tss", desc: true }).map((a) => a.tss)).toEqual([95, 40, null]);
    expect(filterAndSort(rows, "", { key: "tss", desc: false }).map((a) => a.tss)).toEqual([40, 95, null]);
  });

  it("filters by name", () => {
    expect(filterAndSort(rows, "  HILL ", { key: "tss", desc: true }).map((a) => a.name)).toEqual(["Hill repeats"]);
  });

  it("flips the order on a second click", () => {
    expect(nextSort({ key: "tss", desc: true }, "tss")).toEqual({ key: "tss", desc: false });
    expect(nextSort({ key: "tss", desc: false }, "avg_hr")).toEqual({ key: "avg_hr", desc: true });
  });
});
