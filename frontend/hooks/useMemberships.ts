"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import { GET_USER_MEMBERSHIPS, querySubgraph } from "@/lib/subgraph";

import type { MembershipSummary } from "./types";

interface UserMembershipsData {
  memberships: MembershipSummary[];
}

export function useMemberships(): UseQueryResult<UserMembershipsData> {
  const { address, isConnected } = useAccount();
  const owner = address?.toLowerCase();

  return useQuery<UserMembershipsData>({
    queryKey: ["memberships", owner],
    enabled: isConnected && Boolean(owner),
    queryFn: () => {
      if (!owner) {
        return Promise.resolve({ memberships: [] });
      }

      return querySubgraph<UserMembershipsData>(GET_USER_MEMBERSHIPS, {
        owner,
      });
    },
  });
}
