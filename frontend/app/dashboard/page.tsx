"use client";

import Link from "next/link";

import { ConnectButton } from "@/components/ConnectButton";
import { MembershipCard } from "@/components/MembershipCard";
import { useMemberships } from "@/hooks/useMemberships";

export default function DashboardPage() {
  const membershipsQuery = useMemberships();
  const memberships = membershipsQuery.data?.memberships ?? [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-6 py-6">
        <header className="flex items-center justify-between gap-4">
          <Link className="text-lg font-semibold" href="/">
            FlexPass
          </Link>
          <ConnectButton />
        </header>

        <div className="py-10">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal">My memberships</h1>
        </div>

        {membershipsQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading memberships...</div>
        ) : memberships.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
            <h2 className="text-xl font-semibold">No memberships yet</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Connect a wallet with FlexPass NFTs or browse the marketplace to buy remaining membership time.
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              href="/marketplace"
            >
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map((membership) => (
              <MembershipCard
                expiresAt={Number(membership.expiresAt)}
                gymName={shortAddress(membership.gymAddress)}
                isListed={Boolean(membership.currentListing?.active)}
                key={membership.id}
                tier={`Tier ${membership.tierId}`}
                tokenId={membership.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
