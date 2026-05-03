"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { GET_ACTIVE_LISTINGS, querySubgraph } from "@/lib/subgraph";

import type { ListingWithMembership } from "./types";

interface ActiveListingsData {
  listings: ListingWithMembership[];
}

export function useListings(gymAddress?: string): UseQueryResult<ActiveListingsData> {
  const normalizedGymAddress = gymAddress?.toLowerCase();

  return useQuery<ActiveListingsData>({
    queryKey: ["listings", normalizedGymAddress],
    queryFn: async () => {
      const data = await querySubgraph<ActiveListingsData>(GET_ACTIVE_LISTINGS);

      if (!normalizedGymAddress) {
        return data;
      }

      return {
        listings: data.listings.filter(
          (listing) => listing.membership.gymAddress.toLowerCase() === normalizedGymAddress,
        ),
      };
    },
  });
}
