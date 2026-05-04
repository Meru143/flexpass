"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { isAddress } from "viem";

import { AppHeader } from "@/components/AppHeader";
import { ListingCard } from "@/components/ListingCard";
import type { ListingWithMembership } from "@/hooks/types";

interface Gym {
  id: string;
  name: string;
  address: string;
  treasury: string;
  royaltyBps: number;
  approved: boolean;
  createdAt: string;
}

interface ApiResponse<TData> {
  data: TData | null;
  error: {
    code: string;
    message: string;
  } | null;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function GymPage() {
  const params = useParams<{ address: string }>();
  const address = params.address;
  const normalizedAddress = useMemo(() => (isAddress(address) ? address.toLowerCase() : null), [address]);

  const gymQuery = useQuery<Gym>({
    queryKey: ["gym", normalizedAddress],
    enabled: normalizedAddress !== null,
    queryFn: async () => requestApi<Gym>(`/api/gym/${normalizedAddress}`),
  });

  const listingsQuery = useQuery<ListingWithMembership[]>({
    queryKey: ["gym-listings", normalizedAddress],
    enabled: normalizedAddress !== null,
    queryFn: async () => requestApi<ListingWithMembership[]>(`/api/gym/${normalizedAddress}/listings`),
  });

  const gym = gymQuery.data;
  const listings = listingsQuery.data ?? [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-6 py-6">
        <AppHeader />

        {!normalizedAddress ? (
          <div className="mt-10 rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
            Invalid gym address.
          </div>
        ) : gymQuery.isLoading ? (
          <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading gym...</div>
        ) : gymQuery.isError || !gym ? (
          <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-8">
            <h1 className="text-2xl font-semibold">Gym not found</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This address is not registered in the FlexPass API mirror yet.
            </p>
          </div>
        ) : (
          <>
            <section className="py-10">
              <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">Gym</p>
              <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <h1 className="text-4xl font-semibold tracking-normal">{gym.name}</h1>
                  <p className="mt-3 break-all text-sm text-slate-600">{gym.address}</p>
                </div>
                <button
                  aria-label={`Buy new membership from ${gym.name}`}
                  className="min-h-11 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  onClick={() => {
                    // NOTE: The PRD defines no member-side primary purchase route in v1; gyms mint new memberships.
                    window.location.href = `/marketplace?gym=${gym.address}`;
                  }}
                  type="button"
                >
                  Buy New Membership
                </button>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <GymStat label="Status" value={gym.approved ? "Approved" : "Pending"} />
              <GymStat label="Royalty" value={`${formatBps(gym.royaltyBps)}%`} />
              <GymStat label="Active listings" value={String(listings.length)} />
            </section>

            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Active listings</h2>
                  <p className="mt-1 text-sm text-slate-600">Resale memberships currently available for this gym.</p>
                </div>
                <Link className="text-sm font-semibold text-emerald-700" href="/marketplace">
                  Browse all
                </Link>
              </div>

              {listingsQuery.isLoading ? (
                <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading listings...</div>
              ) : listings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
                  <h3 className="text-xl font-semibold">No active listings</h3>
                  <p className="mt-2 text-sm text-slate-600">There are no resale memberships for this gym right now.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.map((listing) => (
                    <ListingCard
                      expiresAt={Number(listing.membership.expiresAt)}
                      gymName={gym.name}
                      key={listing.id}
                      priceWei={BigInt(listing.priceWei)}
                      seller={listing.seller}
                      tier={`Tier ${listing.membership.tierId}`}
                      tokenId={listing.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function GymStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

async function requestApi<TData>(path: string): Promise<TData> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  const body = (await response.json()) as ApiResponse<TData>;

  if (!response.ok || body.error || body.data === null) {
    throw new Error(body.error?.message ?? `FlexPass API request failed with status ${response.status}`);
  }

  return body.data;
}

function formatBps(value: number): string {
  return (value / 100).toLocaleString("en", {
    maximumFractionDigits: 2,
  });
}
