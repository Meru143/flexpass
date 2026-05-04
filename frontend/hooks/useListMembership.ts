"use client";

import { useCallback } from "react";
import type { Hash } from "viem";
import { useChainId, usePublicClient, useWriteContract } from "wagmi";

import { FlexPassMarketABI, getContractAddresses, GymMembershipABI } from "@/lib/contracts";
import { assertPositiveWei, assertValidTokenId } from "@/lib/input-validation";

export interface ListMembershipResult {
  approveHash: Hash;
  listHash: Hash;
}

export interface UseListMembershipResult {
  list: (tokenId: bigint, priceWei: bigint) => Promise<ListMembershipResult>;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
}

export function useListMembership(): UseListMembershipResult {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending, error, reset } = useWriteContract();

  const list = useCallback(
    async (tokenId: bigint, priceWei: bigint): Promise<ListMembershipResult> => {
      const addresses = getContractAddresses(chainId);

      if (!addresses) {
        throw new Error(`Please switch your wallet to Polygon Amoy (chain 80002). Current chain: ${chainId}.`);
      }

      if (!publicClient) {
        throw new Error("Wallet public client is not available");
      }

      assertValidTokenId(tokenId);
      assertPositiveWei(priceWei);

      const approveHash = await writeContractAsync({
        address: addresses.gymMembership,
        abi: GymMembershipABI,
        functionName: "approve",
        args: [addresses.market, tokenId],
      });

      await publicClient.waitForTransactionReceipt({
        hash: approveHash,
      });

      const listHash = await writeContractAsync({
        address: addresses.market,
        abi: FlexPassMarketABI,
        functionName: "listMembership",
        args: [tokenId, priceWei],
      });

      return {
        approveHash,
        listHash,
      };
    },
    [chainId, publicClient, writeContractAsync],
  );

  return {
    list,
    isPending,
    error,
    reset,
  };
}
