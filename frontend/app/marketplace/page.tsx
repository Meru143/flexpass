"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEther } from "viem";

import { AppHeader } from "@/components/AppHeader";
import { ListingCard } from "@/components/ListingCard";
import { useListings } from "@/hooks/useListings";

const pageSize = 9;

export default function MarketplacePage() {
  const [gymFilter, setGymFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const listingsQuery = useListings(gymFilter.trim() || undefined);
  const listings = useMemo(() => listingsQuery.data?.listings ?? [], [listingsQuery.data?.listings]);

  useEffect(() => {
    const initialGymFilter = new URLSearchParams(window.location.search).get("gym");

    if (initialGymFilter) {
      setGymFilter(initialGymFilter);
    }
  }, []);

  const filteredListings = useMemo(() => {
    const maxPriceMatic = maxPrice ? Number(maxPrice) : null;

    return listings.filter((listing) => {
      const tierMatches = tierFilter ? String(listing.membership.tierId) === tierFilter : true;
      const priceMatic = Number(formatEther(BigInt(listing.priceWei)));
      const priceMatches = maxPriceMatic === null || priceMatic <= maxPriceMatic;

      return tierMatches && priceMatches;
    });
  }, [listings, maxPrice, tierFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedListings = filteredListings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-6 py-6">
        <AppHeader />

        <div className="py-10">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">Marketplace</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal">Buy unused gym time</h1>
        </div>

        <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            Gym address
            <input
              className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
              onChange={(event) => {
                setGymFilter(event.target.value);
                setPage(1);
              }}
              placeholder="0x..."
              value={gymFilter}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Tier
            <input
              className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
              inputMode="numeric"
              onChange={(event) => {
                setTierFilter(event.target.value);
                setPage(1);
              }}
              placeholder="1"
              value={tierFilter}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Max price MATIC
            <input
              className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
              inputMode="decimal"
              onChange={(event) => {
                setMaxPrice(event.target.value);
                setPage(1);
              }}
              placeholder="50"
              value={maxPrice}
            />
          </label>
        </form>

        {listingsQuery.isLoading ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading listings...</div>
        ) : paginatedListings.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8">
            <h2 className="text-xl font-semibold">No active listings</h2>
            <p className="mt-2 text-sm text-slate-600">Try another gym, tier, or price filter.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedListings.map((listing) => (
                <ListingCard
                  expiresAt={Number(listing.membership.expiresAt)}
                  gymName={shortAddress(listing.membership.gymAddress)}
                  key={listing.id}
                  priceWei={BigInt(listing.priceWei)}
                  seller={listing.seller}
                  tier={`Tier ${listing.membership.tierId}`}
                  tokenId={listing.id}
                />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                className="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                type="button"
              >
                Previous
              </button>
              <p className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </p>
              <button
                className="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                type="button"
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
