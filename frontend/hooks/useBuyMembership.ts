"use client";

import { useCallback } from "react";
import type { Hash } from "viem";
import { useChainId, usePublicClient, useWriteContract } from "wagmi";

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
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending, error, reset } = useWriteContract();

  const buy = useCallback(
    async (tokenId: bigint, priceWei: bigint): Promise<Hash> => {
      const addresses = getContractAddresses(chainId);

      if (!addresses) {
        throw new Error(`Please switch your wallet to Polygon Amoy (chain 80002). Current chain: ${chainId}.`);
      }

      if (!publicClient) {
        throw new Error("Wallet public client is not available.");
      }

      assertValidTokenId(tokenId);
      assertPositiveWei(priceWei);

      const isListed = await publicClient.readContract({
        address: addresses.market,
        abi: FlexPassMarketABI,
        functionName: "isListed",
        args: [tokenId],
      });

      if (!isListed) {
        throw new Error("This listing has already been sold, delisted, or expired.");
      }

      return writeContractAsync({
        address: addresses.market,
        abi: FlexPassMarketABI,
        functionName: "buyMembership",
        args: [tokenId],
        value: priceWei,
      });
    },
    [chainId, publicClient, writeContractAsync],
  );

  return {
    buy,
    isPending,
    error,
    reset,
  };
}
