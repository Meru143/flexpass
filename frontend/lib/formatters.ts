import { formatEther } from "viem";

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
