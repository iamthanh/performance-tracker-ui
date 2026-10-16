import { describeThreshold, formatThreshold } from "./thresholdMetrics";

describe("threshold metrics", () => {
  const v = (value: number) => ({ metric: "ftp_w", effective_date: "2026-09-02", origin: "manual", value, note: null }) as const;

  it("formats values with their unit", () => {
    expect(formatThreshold(v(245))).toBe("245 W");
    expect(formatThreshold(v(247.5))).toBe("247.5 W");
  });

  it("describes a value for confirmations", () => {
    expect(describeThreshold(v(245))).toMatch(/^FTP 245 W from .*2026$/);
  });
});
