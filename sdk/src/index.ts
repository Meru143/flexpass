import { createPublicClient, http, isAddress, parseAbi, zeroAddress } from "viem";
import { polygon } from "viem/chains";
import type { Abi, Address } from "viem";

type VerifierConfig = {
  rpcUrl: string;
  contractAddress: Address;
  abi?: Abi;
  offlineGracePeriodMs?: number;
};

type AccessResult = {
  valid: boolean;
  user: Address;
  expiresAt: Date;
  tokenId: number;
};

type CachedAccessResult = {
  cachedAt: number;
  result: AccessResult;
};

const defaultAbi = parseAbi([
  "function userOf(uint256 tokenId) view returns (address)",
  "function userExpires(uint256 tokenId) view returns (uint256)",
]);

const defaultOfflineGracePeriodMs = 60_000;
const accessCache = new Map<number, CachedAccessResult>();

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

  const offlineGracePeriodMs = config.offlineGracePeriodMs ?? defaultOfflineGracePeriodMs;

  try {
    const client = createPublicClient({
      chain: polygon,
      transport: http(config.rpcUrl),
    });

    const [rawUser, rawExpires] = await Promise.all([
      client.readContract({
        address: config.contractAddress,
        abi: config.abi ?? defaultAbi,
        functionName: "userOf",
        args: [BigInt(tokenId)],
      }),
      client.readContract({
        address: config.contractAddress,
        abi: config.abi ?? defaultAbi,
        functionName: "userExpires",
        args: [BigInt(tokenId)],
      }),
    ]);

    if (typeof rawUser !== "string" || !isAddress(rawUser)) {
      throw new Error("userOf returned an invalid EVM address");
    }

    if (typeof rawExpires !== "bigint") {
      throw new Error("userExpires returned an invalid timestamp");
    }

    const user = rawUser as Address;
    const expires = rawExpires;
    const expiresAt = new Date(Number(expires) * 1000);
    const result: AccessResult = {
      valid: user !== zeroAddress && Date.now() <= expiresAt.getTime(),
      user,
      expiresAt,
      tokenId,
    };

    accessCache.set(tokenId, {
      cachedAt: Date.now(),
      result,
    });

    return result;
  } catch (error) {
    const cached = accessCache.get(tokenId);

    if (cached && Date.now() - cached.cachedAt <= offlineGracePeriodMs) {
      return cached.result;
    }

    throw error;
  }
}

export default checkAccess;
