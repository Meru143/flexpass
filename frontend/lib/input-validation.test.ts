import { describe, expect, it } from "vitest";

import {
  assertPositiveWei,
  assertValidTokenId,
  parseMaticPriceToWei,
  parsePositiveWei,
  parseTokenIdParam,
} from "./input-validation";

describe("input validation", () => {
  it("parses positive route token ids only", () => {
    expect(parseTokenIdParam("1")).toBe(BigInt(1));
    expect(parseTokenIdParam(" 42 ")).toBe(BigInt(42));
    expect(parseTokenIdParam("0")).toBeNull();
    expect(parseTokenIdParam("-1")).toBeNull();
    expect(parseTokenIdParam("1.5")).toBeNull();
  });

  it("parses positive MATIC prices with at most 18 decimals", () => {
    expect(parseMaticPriceToWei("1")).toBe(BigInt("1000000000000000000"));
    expect(parseMaticPriceToWei("0.000000000000000001")).toBe(BigInt(1));
    expect(parseMaticPriceToWei("0")).toBeNull();
    expect(parseMaticPriceToWei("-1")).toBeNull();
    expect(parseMaticPriceToWei("1.0000000000000000001")).toBeNull();
  });

  it("parses positive wei strings from indexed listing data", () => {
    expect(parsePositiveWei("100")).toBe(BigInt(100));
    expect(parsePositiveWei("0")).toBeNull();
    expect(parsePositiveWei("-100")).toBeNull();
    expect(parsePositiveWei("1.5")).toBeNull();
  });

  it("throws before contract calls for invalid bigint inputs", () => {
    expect(() => assertValidTokenId(BigInt(0))).toThrow("Token ID must be a positive uint256.");
    expect(() => assertPositiveWei(BigInt(0))).toThrow("Price must be greater than 0 MATIC.");
  });
});
