"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { useChainId, usePublicClient } from "wagmi";

import { AppHeader } from "@/components/AppHeader";
import { WalletGate } from "@/components/WalletGate";
import { getContractAddresses, GymMembershipABI } from "@/lib/contracts";
import { formatTimestamp, isZeroAddress, parseTokenIdField, shortAddress } from "@/lib/demo-validation";
import { getWalletErrorMessage } from "@/lib/wallet-errors";

interface AccessResult {
  tokenId: bigint;
  owner: Address;
  user: Address;
  expiresAt: bigint;
  tierId: bigint | number;
  gymAddress: Address;
  valid: boolean;
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-6 py-6">
        <AppHeader />
        <WalletGate>
          <VerifyContent />
        </WalletGate>
      </section>
    </main>
  );
}

function VerifyContent() {
  const [tokenId, setTokenId] = useState("2");
  const [result, setResult] = useState<AccessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId]);

  useEffect(() => {
    const initialTokenId = new URLSearchParams(window.location.search).get("tokenId");

    if (initialTokenId) {
      setTokenId(initialTokenId);
    }
  }, []);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError(null);

    const parsedTokenId = parseTokenIdField(tokenId);

    if (parsedTokenId.error || parsedTokenId.value === null) {
      setError(parsedTokenId.error ?? "Enter a token ID.");
      return;
    }

    if (!contractAddresses || !publicClient) {
      setError(`Please switch your wallet to Polygon Amoy (chain 80002). Current chain: ${chainId}.`);
      return;
    }

    try {
      setIsChecking(true);
      const [owner, user, expiresAt, tierId, gymAddress] = await Promise.all([
        publicClient.readContract({
          address: contractAddresses.gymMembership,
          abi: GymMembershipABI,
          functionName: "ownerOf",
          args: [parsedTokenId.value],
        }),
        publicClient.readContract({
          address: contractAddresses.gymMembership,
          abi: GymMembershipABI,
          functionName: "userOf",
          args: [parsedTokenId.value],
        }),
        publicClient.readContract({
          address: contractAddresses.gymMembership,
          abi: GymMembershipABI,
          functionName: "userExpires",
          args: [parsedTokenId.value],
        }),
        publicClient.readContract({
          address: contractAddresses.gymMembership,
          abi: GymMembershipABI,
          functionName: "getMembershipTier",
          args: [parsedTokenId.value],
        }),
        publicClient.readContract({
          address: contractAddresses.gymMembership,
          abi: GymMembershipABI,
          functionName: "getMembershipGym",
          args: [parsedTokenId.value],
        }),
      ]);
      const activeUser = user as Address;
      const expiresAtSeconds = expiresAt as bigint;
      const now = BigInt(Math.floor(Date.now() / 1000));

      setResult({
        tokenId: parsedTokenId.value,
        owner: owner as Address,
        user: activeUser,
        expiresAt: expiresAtSeconds,
        tierId: tierId as bigint | number,
        gymAddress: gymAddress as Address,
        valid: !isZeroAddress(activeUser) && expiresAtSeconds > now,
      });
    } catch (verificationError) {
      setError(getWalletErrorMessage(verificationError, "Token not found or access check failed."));
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <>
        <div className="grid gap-6 py-10 lg:grid-cols-[1fr_24rem]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">Verifier</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal">Check gym access</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Enter a membership token ID at the front desk. FlexPass reads the active ERC-4907 user and expiry directly
              from the Amoy contract.
            </p>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Network</p>
            <p className="mt-3 text-sm font-semibold text-slate-950">Polygon Amoy, chain 80002</p>
            <p className="mt-2 break-all text-xs leading-5 text-slate-500">
              Contract: {contractAddresses?.gymMembership ?? "Switch wallet to Amoy"}
            </p>
          </aside>
        </div>

        <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
          <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleVerify}>
            <label className="block text-sm font-medium text-slate-700">
              Token ID
              <input
                className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                inputMode="numeric"
                onChange={(event) => setTokenId(event.target.value)}
                placeholder="2"
                value={tokenId}
              />
            </label>
            <button
              aria-busy={isChecking}
              className="mt-5 min-h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isChecking}
              type="submit"
            >
              {isChecking ? "Checking..." : "Check Access"}
            </button>
            {error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-live="polite">
            {result ? (
              <AccessResultPanel result={result} />
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 p-8">
                <h2 className="text-xl font-semibold">No token checked yet</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Use token 2 for the seeded Amoy demo, or enter the token minted during your gym dashboard flow.
                </p>
              </div>
            )}
          </section>
        </div>
    </>
  );
}

function AccessResultPanel({ result }: { result: AccessResult }) {
  return (
    <div>
      <div
        className={
          result.valid
            ? "rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
            : "rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800"
        }
      >
        <p className="text-sm font-semibold uppercase tracking-normal">{result.valid ? "Access valid" : "Access inactive"}</p>
        <p className="mt-2 text-sm leading-6">
          {result.valid
            ? "This token currently has an active user before expiry."
            : "The user role is empty or the membership has expired."}
        </p>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <Detail label="Token" value={`#${result.tokenId.toString()}`} />
        <Detail label="Tier" value={`Tier ${result.tierId.toString()}`} />
        <Detail label="Owner" value={shortAddress(result.owner)} />
        <Detail label="Active user" value={isZeroAddress(result.user) ? "No active user" : shortAddress(result.user)} />
        <Detail label="Gym" value={shortAddress(result.gymAddress)} />
        <Detail label="Expires" value={formatTimestamp(result.expiresAt)} />
      </dl>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-100 p-4">
      <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</dt>
      <dd className="mt-2 break-words font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
