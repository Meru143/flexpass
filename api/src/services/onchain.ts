import { createPublicClient, createWalletClient, http, isAddress, zeroAddress, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon, polygonAmoy } from "viem/chains";

const gymMembershipAbi = [
  {
    type: "function",
    name: "userOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "userExpires",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "getMembershipGym",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "getMembershipTier",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

const gymRegistryAbi = [
  {
    type: "function",
    name: "registerGym",
    stateMutability: "nonpayable",
    inputs: [
      { name: "gymAddress", type: "address" },
      { name: "treasury", type: "address" },
      { name: "name", type: "string" },
      { name: "royaltyBps", type: "uint96" },
    ],
    outputs: [],
  },
] as const;

export interface MembershipState {
  gymAddress: Address;
  tierId: number;
  owner: Address;
  user: Address;
  expiresAt: bigint;
  metadataUri: string;
  isActive: boolean;
}

export interface RegisterGymInput {
  gymAddress: Address;
  treasury: Address;
  name: string;
  royaltyBps: number;
}

export class OnchainConfigError extends Error {
  readonly code = "ONCHAIN_CONFIG_MISSING";
}

const chain = getConfiguredChain();

export const publicClient = createPublicClient({
  chain,
  transport: http(getRpcUrl()),
});

function getMembershipAddress(): Address {
  const configuredAddress = process.env.GYM_MEMBERSHIP_ADDRESS ?? process.env.NEXT_PUBLIC_GYM_MEMBERSHIP_ADDRESS;

  if (!configuredAddress || !isAddress(configuredAddress)) {
    throw new OnchainConfigError("GYM_MEMBERSHIP_ADDRESS is not configured");
  }

  return configuredAddress;
}

function getRegistryAddress(): Address {
  const configuredAddress = process.env.REGISTRY_ADDRESS ?? process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;

  if (!configuredAddress || !isAddress(configuredAddress)) {
    throw new OnchainConfigError("REGISTRY_ADDRESS is not configured");
  }

  return configuredAddress;
}

function getRpcUrl(): string | undefined {
  return process.env.POLYGON_RPC_URL ?? process.env.AMOY_RPC_URL;
}

function getConfiguredChain() {
  const chainId = Number(process.env.CHAIN_ID ?? process.env.NEXT_PUBLIC_CHAIN_ID ?? polygonAmoy.id);

  return chainId === polygon.id ? polygon : polygonAmoy;
}

function getPrivateKey(): Hex {
  const rawPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!rawPrivateKey) {
    throw new OnchainConfigError("DEPLOYER_PRIVATE_KEY is not configured");
  }

  const privateKey = rawPrivateKey.startsWith("0x") ? rawPrivateKey : `0x${rawPrivateKey}`;

  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new OnchainConfigError("DEPLOYER_PRIVATE_KEY is invalid");
  }

  return privateKey as Hex;
}

export async function readMembershipState(tokenId: bigint): Promise<MembershipState> {
  const address = getMembershipAddress();

  const [owner, user, expiresAt, metadataUri, gymAddress, tierId] = await Promise.all([
    publicClient.readContract({
      address,
      abi: gymMembershipAbi,
      functionName: "ownerOf",
      args: [tokenId],
    }),
    publicClient.readContract({
      address,
      abi: gymMembershipAbi,
      functionName: "userOf",
      args: [tokenId],
    }),
    publicClient.readContract({
      address,
      abi: gymMembershipAbi,
      functionName: "userExpires",
      args: [tokenId],
    }),
    publicClient.readContract({
      address,
      abi: gymMembershipAbi,
      functionName: "tokenURI",
      args: [tokenId],
    }),
    publicClient.readContract({
      address,
      abi: gymMembershipAbi,
      functionName: "getMembershipGym",
      args: [tokenId],
    }),
    publicClient.readContract({
      address,
      abi: gymMembershipAbi,
      functionName: "getMembershipTier",
      args: [tokenId],
    }),
  ]);

  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));

  return {
    gymAddress,
    tierId,
    owner,
    user,
    expiresAt,
    metadataUri,
    isActive: user !== zeroAddress && expiresAt >= nowSeconds,
  };
}

export async function registerGymOnchain(input: RegisterGymInput): Promise<Hex> {
  const account = privateKeyToAccount(getPrivateKey());
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(getRpcUrl()),
  });

  return walletClient.writeContract({
    address: getRegistryAddress(),
    abi: gymRegistryAbi,
    functionName: "registerGym",
    args: [input.gymAddress, input.treasury, input.name, BigInt(input.royaltyBps)],
  });
}
