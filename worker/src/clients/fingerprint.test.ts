import { describe, expect, it } from "vitest";
import { axDeviceId } from "./fingerprint";

describe("axDeviceId", () => {
  it("matches Python hashlib.md5 hex digest", () => {
    expect(axDeviceId("test-fingerprint-string")).toBe("0eea5dc390e488070fd417e3c21d779e");
  });
});