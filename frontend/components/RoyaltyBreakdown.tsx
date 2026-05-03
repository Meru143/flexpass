import { formatUnits } from "viem";

interface RoyaltyBreakdownProps {
  priceWei: bigint;
  royaltyBps: number;
  gymName: string;
}

const protocolFeeBps = 100;
const basisPointsDenominator = BigInt(10000);
const zeroWei = BigInt(0);

export function RoyaltyBreakdown({ priceWei, royaltyBps, gymName }: RoyaltyBreakdownProps) {
  const royaltyAmount = (priceWei * BigInt(royaltyBps)) / basisPointsDenominator;
  const protocolFee = (priceWei * BigInt(protocolFeeBps)) / basisPointsDenominator;
  const sellerReceives =
    priceWei > royaltyAmount + protocolFee ? priceWei - royaltyAmount - protocolFee : zeroWei;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full table-fixed text-left text-sm">
        <caption className="px-4 pt-4 text-left text-sm font-semibold text-slate-950">
          Royalty breakdown for {gymName}
        </caption>
        <tbody className="divide-y divide-slate-200">
          <RoyaltyRow label="Total Price" value={`${formatMatic(priceWei)} MATIC`} />
          <RoyaltyRow
            label={`Gym Royalty (${formatBps(royaltyBps)})`}
            value={`${formatMatic(royaltyAmount)} MATIC`}
          />
          <RoyaltyRow label="Protocol Fee (1%)" value={`${formatMatic(protocolFee)} MATIC`} />
          <RoyaltyRow label="Seller Receives" value={`${formatMatic(sellerReceives)} MATIC`} strong />
        </tbody>
      </table>
    </div>
  );
}

function RoyaltyRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr>
      <th className="px-4 py-3 font-medium text-slate-600" scope="row">
        {label}
      </th>
      <td className={["px-4 py-3 text-right", strong ? "font-semibold text-slate-950" : "text-slate-700"].join(" ")}>
        {value}
      </td>
    </tr>
  );
}

function formatMatic(value: bigint): string {
  const formatted = Number(formatUnits(value, 18));

  return formatted.toLocaleString("en", {
    maximumFractionDigits: 4,
  });
}

function formatBps(value: number): string {
  return `${(value / 100).toLocaleString("en", {
    maximumFractionDigits: 2,
  })}%`;
}
