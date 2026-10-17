import { fileSize, rejectReason } from "./importQueue";

const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);

describe("import queue", () => {
  it("accepts FIT, GPX and TCX files, gzipped or not", () => {
    for (const name of ["ride.fit", "RIDE.FIT", "run.gpx", "a.tcx", "b.fit.gz", "c.gpx.gz"]) expect(rejectReason(file(name))).toBeNull();
  });

  it("explains what it rejects", () => {
    expect(rejectReason(file("notes.txt"))).toMatch(/Not a .fit/);
    expect(rejectReason(file("export.json"))).toMatch(/Not a .fit/);
    expect(rejectReason(file("empty.fit", 0))).toBe("The file is empty");
  });

  it("formats sizes", () => {
    expect(fileSize(820_000)).toBe("820 KB");
    expect(fileSize(1_234_567)).toBe("1.2 MB");
    expect(fileSize(10)).toBe("1 KB");
  });
});
