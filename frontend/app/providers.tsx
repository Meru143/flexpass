"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import type { Config } from "wagmi";

type WalletModules = {
  WagmiProvider: typeof import("wagmi").WagmiProvider;
  RainbowKitProvider: typeof import("@rainbow-me/rainbowkit").RainbowKitProvider;
  config: Config;
};

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [walletModules, setWalletModules] = useState<WalletModules | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    Promise.all([
      import("wagmi"),
      import("@rainbow-me/rainbowkit"),
      import("@/lib/wagmi"),
    ]).then(([wagmi, rainbowKit, wagmiConfig]) => {
      if (!active) {
        return;
      }

      setWalletModules({
        WagmiProvider: wagmi.WagmiProvider,
        RainbowKitProvider: rainbowKit.RainbowKitProvider,
        config: wagmiConfig.default,
      });
    });

    return () => {
      active = false;
    };
  }, []);

  if (!walletModules) {
    return <QueryClientProvider client={queryClient} />;
  }

  const { WagmiProvider, RainbowKitProvider, config } = walletModules;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
