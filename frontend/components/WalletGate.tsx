"use client";

import type { ReactNode } from "react";

import { useWalletReady } from "@/lib/wallet-ready";

interface WalletGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function WalletGate({ children, fallback }: WalletGateProps) {
  const walletReady = useWalletReady();

  if (!walletReady) {
    return fallback ?? <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading wallet...</div>;
  }

  return <>{children}</>;
}
