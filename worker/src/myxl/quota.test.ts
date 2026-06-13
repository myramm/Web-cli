import { describe, expect, it } from "vitest";
import { formatMyPackages, formatQuotaByte } from "./quota";

describe("quota formatting", () => {
  it("formatQuotaByte matches Python style", () => {
    expect(formatQuotaByte(1024 ** 3)).toBe("1.00 GB");
    expect(formatQuotaByte(512)).toBe("512 B");
  });

  it("formatMyPackages formats DATA benefits", () => {
    const out = formatMyPackages([
      {
        name: "Internet",
        quota_code: "Q1",
        benefits: [{ data_type: "DATA", remaining: 1024 ** 3, total: 2 * 1024 ** 3, name: "Kuota" }],
      },
    ]);
    expect(out[0].has_benefits).toBe(true);
    expect(out[0].benefits[0].rem_disp).toBe("1.00 GB");
    expect(out[0].benefits[0].pct).toBe(50);
  });
});