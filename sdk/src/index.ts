import { createPublicClient, http, isAddress, parseAbi, zeroAddress } from "viem";
import { polygon } from "viem/chains";
import type { Abi, Address } from "viem";
import type { AccessResult, VerifierConfig } from "./types";

export type { AccessResult, VerifierConfig } from "./types";

type CachedAccessResult = {
  cachedAt: number;
  result: AccessResult;
};

export interface FlexPassVerifier {
  checkAccess: (tokenId: number) => Promise<AccessResult>;
}

const defaultAbi = parseAbi([
  "function userOf(uint256 tokenId) view returns (address)",
  "function userExpires(uint256 tokenId) view returns (uint256)",
  "function getMembershipTier(uint256 tokenId) view returns (uint8)",
  "function getMembershipGym(uint256 tokenId) view returns (address)",
]);

const defaultOfflineGracePeriodMs = 60_000;
const accessCache = new Map<string, CachedAccessResult>();

function resolveAbi(abi: unknown[]): Abi {
  return abi.length > 0 ? (abi as Abi) : defaultAbi;
}

/**
 * Creates a configured FlexPass verifier for repeated gym-entry checks.
 */
export function createVerifier(config: VerifierConfig): FlexPassVerifier {
  return {
    checkAccess: (tokenId: number) => checkAccess(tokenId, config),
  };
}

export async function checkAccess(tokenId: number, config: VerifierConfig): Promise<AccessResult> {
  if (!Number.isSafeInteger(tokenId) || tokenId < 0) {
    throw new RangeError("tokenId must be a non-negative safe integer");
  }

  if (!config.rpcUrl) {
    throw new Error("rpcUrl is required");
  }

  if (!isAddress(config.contractAddress)) {
    throw new Error("contractAddress must be a valid EVM address");
  }

  const contractAddress = config.contractAddress as Address;
  const offlineGracePeriodMs = config.offlineGracePeriodMs ?? defaultOfflineGracePeriodMs;
  const abi = resolveAbi(config.abi);
  const cacheKey = `${contractAddress.toLowerCase()}:${tokenId}`;

  try {
    const publicClient = createPublicClient({
      chain: polygon,
      transport: http(config.rpcUrl),
    });

    const [rawUser, rawExpires, rawTierId, rawGymAddress] = await Promise.all([
      publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "userOf",
        args: [BigInt(tokenId)],
      }),
      publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "userExpires",
        args: [BigInt(tokenId)],
      }),
      publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "getMembershipTier",
        args: [BigInt(tokenId)],
      }),
      publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "getMembershipGym",
        args: [BigInt(tokenId)],
      }),
    ]);

    if (typeof rawUser !== "string" || !isAddress(rawUser)) {
      throw new Error("userOf returned an invalid EVM address");
    }

    if (typeof rawExpires !== "bigint") {
      throw new Error("userExpires returned an invalid timestamp");
    }

    const tierId = parseTierId(rawTierId);

    if (typeof rawGymAddress !== "string" || !isAddress(rawGymAddress)) {
      throw new Error("getMembershipGym returned an invalid EVM address");
    }

    const user = rawUser as Address;
    const gymAddress = rawGymAddress as Address;
    const expiresAt = new Date(Number(rawExpires) * 1000);
    const result: AccessResult = {
      valid: user !== zeroAddress && Date.now() <= expiresAt.getTime(),
      user,
      expiresAt,
      tokenId,
      tierId,
      gymAddress,
    };

    accessCache.set(cacheKey, {
      cachedAt: Date.now(),
      result,
    });

    return result;
  } catch (error) {
    const cached = accessCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt <= offlineGracePeriodMs) {
      return cached.result;
    }

    throw error;
  }
}

function parseTierId(value: unknown): number {
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return value;
  }

  if (typeof value === "bigint" && value <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(value);
  }

  throw new Error("getMembershipTier returned an invalid tier id");
}

export default checkAccess;
