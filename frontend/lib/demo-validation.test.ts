import { describe, expect, it } from "vitest";

import { maxRoyaltyBps, parseAddressField, parseIntegerField, parseRequiredText, parseTokenIdField } from "./demo-validation";

describe("demo validation", () => {
  it("parses and checksums wallet addresses", () => {
    const parsed = parseAddressField("0x465cf3a5918534d94ba62f3a7980f5ffb0277168", "Gym address");

    expect(parsed.error).toBeNull();
    expect(parsed.value).toBe("0x465CF3a5918534d94BA62F3A7980f5ffB0277168");
  });

  it("rejects empty text and invalid addresses", () => {
    expect(parseRequiredText("   ", "Gym name").error).toBe("Gym name is required.");
    expect(parseAddressField("bad", "Treasury").error).toBe("Treasury must be a valid wallet address.");
  });

  it("bounds integer fields for contract-safe values", () => {
    expect(parseIntegerField("1000", "Royalty", 0, maxRoyaltyBps).value).toBe(1000);
    expect(parseIntegerField("3001", "Royalty", 0, maxRoyaltyBps).error).toBe("Royalty must be between 0 and 3000.");
    expect(parseIntegerField("1.5", "Tier", 0, 255).error).toBe("Tier must be a whole number.");
  });

  it("parses positive token ids", () => {
    expect(parseTokenIdField("2").value).toBe(BigInt(2));
    expect(parseTokenIdField("0").error).toBe("Token ID must be a positive uint256.");
  });
});
