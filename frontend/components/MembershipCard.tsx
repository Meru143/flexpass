import Link from "next/link";

import { ExpiryCountdown } from "./ExpiryCountdown";

interface MembershipCardProps {
  tokenId: string;
  gymName: string;
  tier: string;
  expiresAt: number;
  isListed: boolean;
}

export function MembershipCard({ tokenId, gymName, tier, expiresAt, isListed }: MembershipCardProps) {
  const expiryDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(expiresAt * 1000));

  return (
    <article className="flex min-h-56 flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Token #{tokenId}</p>
            <h3 className="mt-1 break-words text-lg font-semibold leading-6 text-slate-950">{gymName}</h3>
          </div>
          <span className="shrink-0 rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white">{tier}</span>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <p>Expires {expiryDate}</p>
          <ExpiryCountdown expiresAt={expiresAt} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        {isListed ? (
          <span className="rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">Listed</span>
        ) : (
          <Link
            aria-label={`Sell membership token ${tokenId}`}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            href={`/sell/${tokenId}`}
          >
            Sell
          </Link>
        )}
      </div>
    </article>
  );
}
