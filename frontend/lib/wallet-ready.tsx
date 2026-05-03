"use client";

import { createContext, useContext } from "react";

const WalletReadyContext = createContext(false);

export const WalletReadyProvider = WalletReadyContext.Provider;

export function useWalletReady(): boolean {
  return useContext(WalletReadyContext);
}
