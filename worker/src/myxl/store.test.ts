import { describe, expect, it } from "vitest";
import { formatStorePackages, storeActionHref } from "./store";

describe("store helpers", () => {
  it("storeActionHref maps PDP and PLP", () => {
    expect(storeActionHref("PDP", "OPT123")).toBe("/packages/by-option?code=OPT123");
    expect(storeActionHref("PLP", "FAM1")).toBe("/packages/by-family?code=FAM1");
    expect(storeActionHref("OTHER", "x")).toBeNull();
  });

  it("formatStorePackages extracts price rows", () => {
    const rows = formatStorePackages({
      data: {
        results_price_only: [
          { title: "Paket A", discounted_price: 1000, original_price: 2000, action_type: "PDP", action_param: "X" },
        ],
      },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].has_href).toBe(true);
    expect(rows[0].has_discount).toBe(true);
  });
});