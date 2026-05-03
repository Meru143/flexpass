import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygon, polygonAmoy } from "wagmi/chains";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ??
  "flexpass-development-project-id";

const config = getDefaultConfig({
  appName: "FlexPass",
  projectId: walletConnectProjectId,
  chains: [polygon, polygonAmoy],
  ssr: true,
});

export default config;
