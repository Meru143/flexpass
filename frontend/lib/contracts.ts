import type { Abi, Address } from "viem";
import { isAddress } from "viem";
import { polygon, polygonAmoy } from "wagmi/chains";

import flexPassMarketAbi from "./abis/FlexPassMarket.json";
import gymMembershipAbi from "./abis/GymMembership.json";
import gymRegistryAbi from "./abis/GymRegistry.json";

const amoyGymMembershipAddress = "0x465CF3a5918534d94BA62F3A7980f5ffB0277168";
const amoyMarketAddress = "0x0e9a4999ABcccE5B1A6989B34Ed549C2Dd72bfC0";
const amoyRegistryAddress = "0xaE12edE4Eab2655b9B1618628c678819693881eA";

export interface ContractAddresses {
  gymMembership: Address;
  market: Address;
  registry: Address;
}

export const GYM_MEMBERSHIP_ADDRESS: Partial<Record<number, Address>> = {
  [polygon.id]: envAddress(process.env.NEXT_PUBLIC_GYM_MEMBERSHIP_ADDRESS),
  [polygonAmoy.id]: amoyGymMembershipAddress,
};

export const MARKET_ADDRESS: Partial<Record<number, Address>> = {
  [polygon.id]: envAddress(process.env.NEXT_PUBLIC_MARKET_ADDRESS),
  [polygonAmoy.id]: amoyMarketAddress,
};

export const REGISTRY_ADDRESS: Partial<Record<number, Address>> = {
  [polygon.id]: envAddress(process.env.NEXT_PUBLIC_REGISTRY_ADDRESS),
  [polygonAmoy.id]: amoyRegistryAddress,
};

export const GymMembershipABI = gymMembershipAbi as Abi;
export const FlexPassMarketABI = flexPassMarketAbi as Abi;
export const GymRegistryABI = gymRegistryAbi as Abi;

export function getContractAddresses(chainId: number): ContractAddresses | null {
  const gymMembership = GYM_MEMBERSHIP_ADDRESS[chainId];
  const market = MARKET_ADDRESS[chainId];
  const registry = REGISTRY_ADDRESS[chainId];

  if (!gymMembership || !market || !registry) {
    return null;
  }

  return {
    gymMembership,
    market,
    registry,
  };
}

function envAddress(value: string | undefined): Address | undefined {
  return value && isAddress(value) ? value : undefined;
}
