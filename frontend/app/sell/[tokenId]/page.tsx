"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { parseEther } from "viem";

import { ConnectButton } from "@/components/ConnectButton";
import { ExpiryCountdown } from "@/components/ExpiryCountdown";
import { RoyaltyBreakdown } from "@/components/RoyaltyBreakdown";
import { useListMembership } from "@/hooks/useListMembership";
import { useMemberships } from "@/hooks/useMemberships";

const defaultRoyaltyBps = 1000;

export default function SellMembershipPage() {
  const params = useParams<{ tokenId: string }>();
  const tokenId = params.tokenId;
  const [priceInput, setPriceInput] = useState("");
  const [status, setStatus] = useState<"idle" | "approving" | "listed">("idle");
  const [flowError, setFlowError] = useState<string | null>(null);
  const membershipsQuery = useMemberships();
  const listMembership = useListMembership();

  const membership = useMemo(
    () => membershipsQuery.data?.memberships.find((item) => item.id === tokenId),
    [membershipsQuery.data?.memberships, tokenId],
  );
  const tokenIdBigInt = useMemo(() => parseTokenId(tokenId), [tokenId]);
  const priceWei = useMemo(() => parsePriceWei(priceInput), [priceInput]);
  const isAlreadyListed = Boolean(membership?.currentListing?.active);
  const canList = Boolean(membership && tokenIdBigInt !== null && priceWei !== null && !isAlreadyListed);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFlowError(null);

    if (!canList || tokenIdBigInt === null || priceWei === null) {
      setFlowError("Enter a valid MATIC price before listing.");
      return;
    }

    try {
      setStatus("approving");
      await listMembership.list(tokenIdBigInt, priceWei);
      setStatus("listed");
    } catch (error) {
      setStatus("idle");
      setFlowError(error instanceof Error ? error.message : "Listing transaction failed.");
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
          <Link className="text-sm font-semibold text-emerald-700" href="/dashboard">
            Back to dashboard
          </Link>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">Sell membership #{tokenId}</h1>
        </div>

        {membershipsQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading membership...</div>
        ) : !membership ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
            <h2 className="text-xl font-semibold">Membership not found</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Connect the wallet that owns token #{tokenId}, then return to this sell page.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
            <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Token #{membership.id}</p>
              <h2 className="mt-2 break-words text-2xl font-semibold">{shortAddress(membership.gymAddress)}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Detail label="Tier" value={`Tier ${membership.tierId}`} />
                <Detail label="Expiry" value={formatDate(Number(membership.expiresAt))} />
                <Detail label="Owner" value={shortAddress(membership.owner)} />
                <div className="rounded-md bg-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Time left</p>
                  <div className="mt-2">
                    <ExpiryCountdown expiresAt={Number(membership.expiresAt)} />
                  </div>
                </div>
              </div>
              {isAlreadyListed ? (
                <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  This membership is already listed.
                </div>
              ) : null}
            </article>

            <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Listing price in MATIC
                <input
                  className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                  inputMode="decimal"
                  onChange={(event) => setPriceInput(event.target.value)}
                  placeholder="25"
                  value={priceInput}
                />
              </label>

              {priceWei !== null ? (
                <RoyaltyBreakdown
                  gymName={shortAddress(membership.gymAddress)}
                  priceWei={priceWei}
                  royaltyBps={defaultRoyaltyBps}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  Enter a price to preview gym royalty, protocol fee, and seller proceeds.
                </div>
              )}

              {flowError ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{flowError}</p>
              ) : null}
              {status === "listed" ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                  Membership listed successfully.
                </p>
              ) : null}

              <button
                aria-label={`Approve and list membership token ${tokenId}`}
                className="min-h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canList || listMembership.isPending || status === "approving" || status === "listed"}
                type="submit"
              >
                {status === "approving" || listMembership.isPending ? "Approving & listing..." : "Approve & List"}
              </button>
            </form>
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

function parsePriceWei(value: string): bigint | null {
  const normalized = value.trim();

  if (!normalized || Number(normalized) <= 0) {
    return null;
  }

  try {
    return parseEther(normalized);
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
