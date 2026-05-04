"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatEther, type Hash } from "viem";
import { useAccount } from "wagmi";

import { ConnectButton } from "@/components/ConnectButton";
import { ExpiryCountdown } from "@/components/ExpiryCountdown";
import { RoyaltyBreakdown } from "@/components/RoyaltyBreakdown";
import { useBuyMembership } from "@/hooks/useBuyMembership";
import type { ListingWithMembership } from "@/hooks/types";
import { GET_LISTING_BY_TOKEN_ID, querySubgraph } from "@/lib/subgraph";

const defaultRoyaltyBps = 1000;

interface ListingByTokenData {
  listing: ListingWithMembership | null;
}

export default function BuyMembershipPage() {
  const params = useParams<{ tokenId: string }>();
  const tokenId = params.tokenId;
  const tokenIdBigInt = useMemo(() => parseTokenId(tokenId), [tokenId]);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const { address } = useAccount();
  const buyMembership = useBuyMembership();

  const listingQuery = useQuery<ListingByTokenData>({
    queryKey: ["listing", tokenId],
    enabled: tokenIdBigInt !== null,
    queryFn: () =>
      querySubgraph<ListingByTokenData>(GET_LISTING_BY_TOKEN_ID, {
        tokenId,
      }),
  });

  const listing = listingQuery.data?.listing;
  const priceWei = listing ? BigInt(listing.priceWei) : null;
  const isSelfBuy = Boolean(address && listing?.seller && address.toLowerCase() === listing.seller.toLowerCase());
  const canBuy = Boolean(listing?.active && tokenIdBigInt !== null && priceWei !== null && !isSelfBuy);

  async function handleBuy() {
    setFlowError(null);
    setTxHash(null);

    if (!canBuy || tokenIdBigInt === null || priceWei === null) {
      setFlowError(isSelfBuy ? "You cannot buy your own listing." : "This listing is not available.");
      return;
    }

    try {
      const hash = await buyMembership.buy(tokenIdBigInt, priceWei);
      setTxHash(hash);
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : "Buy transaction failed.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto w-full max-w-5xl px-6 py-6">
        <header className="flex items-center justify-between gap-4">
          <Link className="text-lg font-semibold" href="/">
            FlexPass
          </Link>
          <ConnectButton />
        </header>

        <div className="py-10">
          <Link className="text-sm font-semibold text-emerald-700" href="/marketplace">
            Back to marketplace
          </Link>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">Buy membership #{tokenId}</h1>
        </div>

        {listingQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading listing...</div>
        ) : !listing ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
            <h2 className="text-xl font-semibold">Listing not found</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This membership is not currently listed on the FlexPass marketplace.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
            <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Token #{listing.id}</p>
                  <h2 className="mt-2 break-words text-2xl font-semibold">
                    {shortAddress(listing.membership.gymAddress)}
                  </h2>
                </div>
                <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white">
                  Tier {listing.membership.tierId}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Detail label="Price" value={`${formatEther(BigInt(listing.priceWei))} MATIC`} />
                <Detail label="Seller" value={shortAddress(listing.seller)} />
                <Detail label="Expires" value={formatDate(Number(listing.membership.expiresAt))} />
                <div className="rounded-md bg-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Access time left</p>
                  <div className="mt-2">
                    <ExpiryCountdown expiresAt={Number(listing.membership.expiresAt)} />
                  </div>
                </div>
              </div>

              {!listing.active ? (
                <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  This listing is no longer active.
                </div>
              ) : null}
            </article>

            <aside className="space-y-4">
              <RoyaltyBreakdown
                gymName={shortAddress(listing.membership.gymAddress)}
                priceWei={BigInt(listing.priceWei)}
                royaltyBps={defaultRoyaltyBps}
              />

              {isSelfBuy ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
                  You are the seller for this listing.
                </p>
              ) : null}
              {flowError ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{flowError}</p>
              ) : null}
              {txHash ? (
                <p className="break-all rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                  Purchase submitted: {txHash}
                </p>
              ) : null}

              <button
                aria-label={`Buy membership token ${tokenId}`}
                className="min-h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canBuy || buyMembership.isPending}
                onClick={handleBuy}
                type="button"
              >
                {buyMembership.isPending ? "Buying..." : "Buy Now"}
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function parseTokenId(tokenId: string): bigint | null {
  try {
    return BigInt(tokenId);
  } catch {
    return null;
  }
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
