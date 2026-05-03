"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";

import { useWalletReady } from "@/lib/wallet-ready";

export function ConnectButton() {
  const walletReady = useWalletReady();

  if (!walletReady) {
    return (
      <button
        aria-label="Wallet loading"
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white opacity-60"
        disabled
        type="button"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!connected) {
          return (
            <button
              aria-label="Connect wallet"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!ready}
              onClick={openConnectModal}
              type="button"
            >
              Connect Wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              aria-label="Switch network"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-amber-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              onClick={openChainModal}
              type="button"
            >
              Switch Network
            </button>
          );
        }

        return (
          <button
            aria-label="Open wallet account"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
            onClick={openAccountModal}
            type="button"
          >
            {account.displayName}
          </button>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
