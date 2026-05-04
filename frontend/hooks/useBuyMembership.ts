"use client";

import { useCallback } from "react";
import type { Hash } from "viem";
import { useChainId, useWriteContract } from "wagmi";

import { FlexPassMarketABI, getContractAddresses } from "@/lib/contracts";
import { assertPositiveWei, assertValidTokenId } from "@/lib/input-validation";

export interface UseBuyMembershipResult {
  buy: (tokenId: bigint, priceWei: bigint) => Promise<Hash>;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
}

export function useBuyMembership(): UseBuyMembershipResult {
  const chainId = useChainId();
  const { writeContractAsync, isPending, error, reset } = useWriteContract();

  const buy = useCallback(
    async (tokenId: bigint, priceWei: bigint): Promise<Hash> => {
      const addresses = getContractAddresses(chainId);

      if (!addresses) {
        throw new Error(`FlexPass contracts are not configured for chain ${chainId}`);
      }

      assertValidTokenId(tokenId);
      assertPositiveWei(priceWei);

      return writeContractAsync({
        address: addresses.market,
        abi: FlexPassMarketABI,
        functionName: "buyMembership",
        args: [tokenId],
        value: priceWei,
      });
    },
    [chainId, writeContractAsync],
  );

  return {
    buy,
    isPending,
    error,
    reset,
  };
}
