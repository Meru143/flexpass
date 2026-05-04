import { formatEther } from "viem";

const millisecondsPerDay = 86_400_000;
const basisPointsDenominator = BigInt(10000);

export function formatMATIC(wei: bigint): string {
  return Number(formatEther(wei)).toLocaleString("en", {
    maximumFractionDigits: 4,
  });
}

export function formatExpiry(timestamp: number): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

export function daysRemaining(timestamp: number): number {
  const millisecondsRemaining = timestamp * 1000 - Date.now();

  return Math.max(0, Math.ceil(millisecondsRemaining / millisecondsPerDay));
}

export function calcRoyalty(priceWei: bigint, royaltyBps: number): bigint {
  return (priceWei * BigInt(royaltyBps)) / basisPointsDenominator;
}
