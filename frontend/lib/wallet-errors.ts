import { UserRejectedRequestError } from "viem";

const userRejectedPattern = /user rejected|rejected request|denied transaction|user denied/i;
const userRejectedMessage = "Transaction was declined in your wallet.";

export function getWalletErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof UserRejectedRequestError) {
    return userRejectedMessage;
  }

  if (error instanceof Error) {
    if (error.name === "UserRejectedRequestError" || userRejectedPattern.test(error.message)) {
      return userRejectedMessage;
    }

    return error.message;
  }

  return fallbackMessage;
}
