# @flexpass/verifier

`@flexpass/verifier` is the gym-entry SDK for FlexPass membership NFTs. It reads `userOf`, `userExpires`, `getMembershipTier`, and `getMembershipGym` from the deployed `GymMembership` contract and returns a typed access decision for kiosk software, turnstile controllers, and backend verifier services.

## Install

Install the SDK from npm. `viem` is a peer dependency so the verifier can share the same RPC and ABI tooling used by the dApp and API.

```bash
npm install @flexpass/verifier viem
```

If your package manager does not install peer dependencies automatically, install `viem` in the same application package.

## VerifierConfig

The public SDK surface is configured with `VerifierConfig`. Pass the deployed `GymMembership` address, an RPC URL for the target chain, and either the generated contract ABI or an empty array to use the SDK's built-in minimal read ABI.

```ts
export interface VerifierConfig {
  rpcUrl: string;
  contractAddress: string;
  abi: unknown[];
  offlineGracePeriodMs?: number;
}
```

`rpcUrl` must point at Polygon PoS, Polygon Amoy, or the local Anvil chain that contains the target `GymMembership` deployment. `contractAddress` must be an EVM address. `abi` should normally be `contracts/out/GymMembership.sol/GymMembership.json` copied into your verifier application at build time. `offlineGracePeriodMs` controls how long the SDK may return the last cached access decision if the RPC read fails.

## checkAccess Example

Create one verifier at process startup and reuse it for every gate check. The SDK accepts a numeric token ID and returns an `AccessResult` with a boolean decision plus the on-chain context used to make it.

```ts
import { createVerifier } from "@flexpass/verifier";
import gymMembershipAbi from "./abis/GymMembership.json";

const verifier = createVerifier({
  rpcUrl: process.env.POLYGON_RPC_URL!,
  contractAddress: "0x465CF3a5918534d94BA62F3A7980f5ffB0277168",
  abi: gymMembershipAbi,
  offlineGracePeriodMs: 60_000,
});

async function verifyEntry(tokenId: number): Promise<void> {
  const access = await verifier.checkAccess(tokenId);

  if (!access.valid) {
    console.log("Access denied", {
      tokenId: access.tokenId,
      user: access.user,
      expiresAt: access.expiresAt.toISOString(),
    });
    return;
  }

  console.log("Access granted", {
    tokenId: access.tokenId,
    user: access.user,
    tierId: access.tierId,
    gymAddress: access.gymAddress,
    expiresAt: access.expiresAt.toISOString(),
  });
}

await verifyEntry(42);
```

For one-off checks, import `checkAccess` directly and pass the same configuration on each call.

```ts
import { checkAccess } from "@flexpass/verifier";

const access = await checkAccess(42, {
  rpcUrl: process.env.POLYGON_RPC_URL!,
  contractAddress: "0x465CF3a5918534d94BA62F3A7980f5ffB0277168",
  abi: [],
  offlineGracePeriodMs: 0,
});
```

## AccessResult

`AccessResult` always includes the token ID, user address, expiry timestamp, tier ID, and gym address. `valid` is true only when `userOf(tokenId)` is not the zero address and the current wall-clock time is before `userExpires(tokenId)`.

```ts
export interface AccessResult {
  valid: boolean;
  user: string;
  expiresAt: Date;
  tokenId: number;
  tierId: number;
  gymAddress: string;
}
```

## Offline Grace Period

The verifier caches the most recent result per `contractAddress:tokenId`. If an RPC call fails and the cached result is younger than `offlineGracePeriodMs`, the SDK returns that cached decision instead of throwing. The default is 60 seconds.

Set `offlineGracePeriodMs` to `0` for strict online-only checks, or use a short non-zero value for venue entrances where a transient RPC failure should not block a member who was just verified. The grace period does not extend an expired membership; it only reuses a recent result when the chain read cannot complete.
