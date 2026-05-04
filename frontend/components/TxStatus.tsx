import type { Hash } from "viem";

export type TxStatusState =
  | { type: "idle" }
  | { type: "pending"; label: string }
  | { type: "success"; label: string; hash: Hash }
  | { type: "error"; message: string };

export const idleTxStatus: TxStatusState = { type: "idle" };

export function TxStatus({ status }: { status: TxStatusState }) {
  if (status.type === "idle") {
    return null;
  }

  if (status.type === "pending") {
    return (
      <div aria-live="polite" className="rounded-md border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700">
        {status.label}
      </div>
    );
  }

  if (status.type === "success") {
    return (
      <div
        aria-live="polite"
        className="break-all rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
      >
        {status.label}: {status.hash}
      </div>
    );
  }

  return (
    <div aria-live="assertive" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
      {status.message}
    </div>
  );
}
