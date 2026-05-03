export interface VerifierConfig {
  rpcUrl: string;
  contractAddress: string;
  abi: unknown[];
  offlineGracePeriodMs?: number;
}

export interface AccessResult {
  valid: boolean;
  user: string;
  expiresAt: Date;
  tokenId: number;
  tierId: number;
  gymAddress: string;
}
