import { formatEther } from "viem";

export function formatMATIC(wei: bigint): string {
  return Number(formatEther(wei)).toLocaleString("en", {
    maximumFractionDigits: 4,
  });
}
