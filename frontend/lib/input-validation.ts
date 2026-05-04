import { parseEther } from "viem";

const zero = BigInt(0);
const one = BigInt(1);
const uint256Max = (one << BigInt(256)) - one;
const positiveIntegerPattern = /^(?:0|[1-9]\d*)$/;
const maticDecimalPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/;

export function parseTokenIdParam(value: string): bigint | null {
  const normalized = value.trim();

  if (!positiveIntegerPattern.test(normalized)) {
    return null;
  }

  const tokenId = BigInt(normalized);
  return tokenId > zero && tokenId <= uint256Max ? tokenId : null;
}

export function parseMaticPriceToWei(value: string): bigint | null {
  const normalized = value.trim();

  if (!maticDecimalPattern.test(normalized)) {
    return null;
  }

  const priceWei = parseEther(normalized);
  return priceWei > zero && priceWei <= uint256Max ? priceWei : null;
}

export function parsePositiveWei(value: string): bigint | null {
  const normalized = value.trim();

  if (!positiveIntegerPattern.test(normalized)) {
    return null;
  }

  const amount = BigInt(normalized);
  return amount > zero && amount <= uint256Max ? amount : null;
}

export function assertValidTokenId(tokenId: bigint): void {
  if (tokenId <= zero || tokenId > uint256Max) {
    throw new Error("Token ID must be a positive uint256.");
  }
}

export function assertPositiveWei(priceWei: bigint): void {
  if (priceWei <= zero || priceWei > uint256Max) {
    throw new Error("Price must be greater than 0 MATIC.");
  }
}
