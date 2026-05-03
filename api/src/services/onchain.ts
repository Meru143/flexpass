import { createPublicClient, http, isAddress, zeroAddress, type Address } from "viem";
import { polygon } from "viem/chains";

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

export interface MembershipState {
  gymAddress: Address;
  tierId: number;
  owner: Address;
  user: Address;
  expiresAt: bigint;
  metadataUri: string;
  isActive: boolean;
}

export class OnchainConfigError extends Error {
  readonly code = "ONCHAIN_CONFIG_MISSING";
}

export const publicClient = createPublicClient({
  chain: polygon,
  transport: http(process.env.POLYGON_RPC_URL),
});

function getMembershipAddress(): Address {
  const configuredAddress = process.env.GYM_MEMBERSHIP_ADDRESS ?? process.env.NEXT_PUBLIC_GYM_MEMBERSHIP_ADDRESS;

  if (!configuredAddress || !isAddress(configuredAddress)) {
    throw new OnchainConfigError("GYM_MEMBERSHIP_ADDRESS is not configured");
  }

  return configuredAddress;
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
