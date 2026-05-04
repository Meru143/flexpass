"use client";

import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { MembershipCard } from "@/components/MembershipCard";
import { WalletGate } from "@/components/WalletGate";
import { useMemberships } from "@/hooks/useMemberships";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-6 py-6">
        <AppHeader />

        <div className="py-10">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal">My memberships</h1>
        </div>

        <WalletGate>
          <DashboardContent />
        </WalletGate>
      </section>
    </main>
  );
}

function DashboardContent() {
  const membershipsQuery = useMemberships();
  const memberships = membershipsQuery.data?.memberships ?? [];

  if (membershipsQuery.isLoading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading memberships...</div>;
  }

  if (memberships.length === 0) {
    return (
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
    );
  }

  return (
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
  );
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
