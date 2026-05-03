import Link from "next/link";

import { ConnectButton } from "@/components/ConnectButton";
import { querySubgraph } from "@/lib/subgraph";

interface HomeStats {
  memberships: number;
  activeListings: number;
  approvedGyms: number;
}

interface HomeStatsQuery {
  memberships: { id: string }[];
  listings: { id: string }[];
  gyms: { id: string; approved: boolean }[];
}

const homeStatsQuery = `
  query HomeStats {
    memberships(first: 1000) {
      id
    }
    listings(first: 1000, where: { active: true }) {
      id
    }
    gyms(first: 1000) {
      id
      approved
    }
  }
`;

export default async function Home() {
  const stats = await getHomeStats();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6">
        <header className="flex items-center justify-between gap-4">
          <Link className="text-lg font-semibold tracking-normal" href="/">
            FlexPass
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
            <Link className="hover:text-slate-950" href="/marketplace">
              Marketplace
            </Link>
            <Link className="hover:text-slate-950" href="/dashboard">
              Dashboard
            </Link>
          </nav>
          <ConnectButton />
        </header>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl space-y-8">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
                Portable gym access on Polygon
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-none tracking-normal text-slate-950 sm:text-6xl">
                Gym memberships you actually own
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Mint time-bound access, list unused days, and let gyms collect royalties on every FlexPass resale.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                href="/marketplace"
              >
                Browse Listings
              </Link>
              <ConnectButton />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-lg bg-slate-950 p-5 text-white">
              <p className="text-sm font-semibold text-emerald-300">Live membership pass</p>
              <div className="mt-16 space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-normal text-slate-400">Gym</p>
                  <p className="mt-1 text-2xl font-semibold">FlexPass Founders Club</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Tier</p>
                    <p className="font-semibold">Gold</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Expires</p>
                    <p className="font-semibold">30 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <dl className="grid gap-3 border-t border-slate-200 py-5 sm:grid-cols-3">
          <Stat label="Memberships minted" value={stats.memberships} />
          <Stat label="Active listings" value={stats.activeListings} />
          <Stat label="Approved gyms" value={stats.approvedGyms} />
        </dl>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold text-slate-950">{value.toLocaleString("en")}</dd>
    </div>
  );
}

async function getHomeStats(): Promise<HomeStats> {
  try {
    const data = await querySubgraph<HomeStatsQuery>(homeStatsQuery);

    return {
      memberships: data.memberships.length,
      activeListings: data.listings.length,
      approvedGyms: data.gyms.filter((gym) => gym.approved).length,
    };
  } catch {
    return {
      memberships: 0,
      activeListings: 0,
      approvedGyms: 0,
    };
  }
}
