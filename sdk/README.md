# @flexpass/verifier

`@flexpass/verifier` is the gym-entry SDK for FlexPass membership NFTs. It reads `userOf`, `userExpires`, `getMembershipTier`, and `getMembershipGym` from the deployed `GymMembership` contract and returns a typed access decision for kiosk or backend verifier services.

## Install

```bash
npm install @flexpass/verifier viem
```

`viem` is a peer dependency so applications can keep one wallet/RPC stack version across the dApp, API, and verifier process.

## Check Access

Create one verifier per contract/RPC configuration and reuse it for entry checks. The offline grace period defaults to 60 seconds and can be lowered or disabled by setting `offlineGracePeriodMs`.

```ts
import { createVerifier } from "@flexpass/verifier";
import gymMembershipAbi from "./abis/GymMembership.json";

const verifier = createVerifier({
  rpcUrl: process.env.POLYGON_RPC_URL!,
  contractAddress: "0xYourGymMembershipContract",
  abi: gymMembershipAbi,
  offlineGracePeriodMs: 60_000,
});

const access = await verifier.checkAccess(42);

if (!access.valid) {
  console.log("Access denied");
} else {
  console.log("Access granted", {
    user: access.user,
    expiresAt: access.expiresAt,
    tierId: access.tierId,
    gymAddress: access.gymAddress,
  });
}
```

## Direct Function

For one-off checks, import `checkAccess` directly and pass the same configuration with each call.

```ts
import { checkAccess } from "@flexpass/verifier";

const access = await checkAccess(42, {
  rpcUrl: process.env.POLYGON_RPC_URL!,
  contractAddress: "0xYourGymMembershipContract",
  abi: [],
});
```

Passing an empty ABI uses the SDK's built-in minimal FlexPass read ABI. Production deployments should pass the generated `GymMembership` ABI so application code stays aligned with the deployed contract.
