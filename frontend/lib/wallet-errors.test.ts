import { describe, expect, it } from "vitest";

import { getWalletErrorMessage } from "./wallet-errors";

describe("getWalletErrorMessage", () => {
  it("maps UserRejectedRequestError-like errors to a friendly decline message", () => {
    const rejectedError = Object.assign(new Error("User rejected the request."), {
      name: "UserRejectedRequestError",
    });

    expect(getWalletErrorMessage(rejectedError, "Fallback")).toBe("Transaction was declined in your wallet.");
  });

  it("returns normal error messages and fallback values", () => {
    expect(getWalletErrorMessage(new Error("RPC unavailable"), "Fallback")).toBe("RPC unavailable");
    expect(getWalletErrorMessage("bad", "Fallback")).toBe("Fallback");
  });
});
