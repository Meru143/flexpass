"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatEther } from "viem";

import { ExpiryCountdown } from "./ExpiryCountdown";

interface ListingCardProps {
  tokenId: string;
  gymName: string;
  tier: string;
  expiresAt: number;
  priceWei: bigint;
  seller: string;
}

interface PriceFeedResponse {
  data?: {
    maticInr?: number;
  };
}

export function ListingCard({ tokenId, gymName, tier, expiresAt, priceWei, seller }: ListingCardProps) {
  const [maticInr, setMaticInr] = useState<number | null>(null);
  const maticPrice = formatEther(priceWei);
  const approximateInr = useMemo(() => {
    if (maticInr === null) {
      return null;
    }

    return Number(maticPrice) * maticInr;
  }, [maticInr, maticPrice]);

  useEffect(() => {
    let active = true;

    fetch("/api/price/matic-inr")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: PriceFeedResponse | null) => {
        const rate = body?.data?.maticInr;

        if (active && typeof rate === "number") {
          setMaticInr(rate);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return (
    <article className="flex min-h-64 flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Token #{tokenId}</p>
            <h3 className="mt-1 break-words text-lg font-semibold leading-6 text-slate-950">{gymName}</h3>
          </div>
          <span className="shrink-0 rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white">{tier}</span>
        </div>

        <div className="space-y-2">
          <p className="text-2xl font-semibold text-slate-950">{maticPrice} MATIC</p>
          <p className="text-sm text-slate-600">
            {approximateInr === null
              ? "INR estimate unavailable"
              : `~INR ${Math.round(approximateInr).toLocaleString("en-IN")}`}
          </p>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <p className="break-all">Seller {seller}</p>
          <ExpiryCountdown expiresAt={expiresAt} />
        </div>
      </div>

      <Link
        aria-label={`Buy membership token ${tokenId}`}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        href={`/buy/${tokenId}`}
      >
        Buy
      </Link>
    </article>
  );
}
