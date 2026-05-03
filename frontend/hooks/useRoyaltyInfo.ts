"use client";

import { isAddress, type Address } from "viem";
import { useChainId, useReadContract } from "wagmi";

import { getContractAddresses, GymMembershipABI } from "@/lib/contracts";

interface UseRoyaltyInfoArgs {
  tokenId?: bigint;
  priceWei?: bigint;
  chainId?: number;
}

export interface UseRoyaltyInfoResult {
  receiver: Address | undefined;
  royaltyAmount: bigint | undefined;
  isPending: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useRoyaltyInfo({ tokenId, priceWei, chainId }: UseRoyaltyInfoArgs): UseRoyaltyInfoResult {
  const connectedChainId = useChainId();
  const addresses = getContractAddresses(chainId ?? connectedChainId);
  const enabled = Boolean(addresses?.gymMembership && tokenId !== undefined && priceWei !== undefined);

  const result = useReadContract({
    address: addresses?.gymMembership,
    abi: GymMembershipABI,
    functionName: "royaltyInfo",
    args: enabled && tokenId !== undefined && priceWei !== undefined ? [tokenId, priceWei] : undefined,
    query: {
      enabled,
    },
  });

  const royaltyInfo = parseRoyaltyInfo(result.data);

  return {
    receiver: royaltyInfo.receiver,
    royaltyAmount: royaltyInfo.royaltyAmount,
    isPending: result.isPending,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

function parseRoyaltyInfo(data: unknown): {
  receiver: Address | undefined;
  royaltyAmount: bigint | undefined;
} {
  if (!Array.isArray(data) || data.length !== 2) {
    return {
      receiver: undefined,
      royaltyAmount: undefined,
    };
  }

  const [receiver, royaltyAmount] = data;

  if (typeof receiver !== "string" || !isAddress(receiver) || typeof royaltyAmount !== "bigint") {
    return {
      receiver: undefined,
      royaltyAmount: undefined,
    };
  }

  return {
    receiver,
    royaltyAmount,
  };
}
