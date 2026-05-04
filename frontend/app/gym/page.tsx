"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Address } from "viem";
import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";

import { AppHeader } from "@/components/AppHeader";
import { idleTxStatus, TxStatus, type TxStatusState } from "@/components/TxStatus";
import { WalletGate } from "@/components/WalletGate";
import { getContractAddresses, GymMembershipABI, GymRegistryABI } from "@/lib/contracts";
import {
  isZeroAddress,
  parseAddressField,
  parseIntegerField,
  shortAddress,
} from "@/lib/demo-validation";
import { getWalletErrorMessage } from "@/lib/wallet-errors";

interface MintForm {
  recipient: string;
  gymAddress: string;
  tierId: string;
  durationDays: string;
  tokenUri: string;
}

interface GymStatusView {
  name: string;
  gymAddress: Address;
  approved: boolean;
}

const initialMintForm: MintForm = {
  recipient: "",
  gymAddress: "",
  tierId: "1",
  durationDays: "30",
  tokenUri: "",
};

export default function GymPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-6 py-6">
        <AppHeader />
        <WalletGate>
          <GymContent />
        </WalletGate>
      </section>
    </main>
  );
}

function GymContent() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId]);
  const [mintForm, setMintForm] = useState<MintForm>(initialMintForm);
  const [gymStatus, setGymStatus] = useState<GymStatusView | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatusState>(idleTxStatus);

  const connectedMatchesGym =
    Boolean(address && mintForm.gymAddress) && address?.toLowerCase() === mintForm.gymAddress.trim().toLowerCase();

  async function handleStatusCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const gymAddress = parseAddressField(mintForm.gymAddress, "Gym address");

    if (gymAddress.error || !gymAddress.value) {
      setGymStatus(null);
      setStatusError(gymAddress.error ?? "Enter a gym address to inspect.");
      return;
    }

    await loadGymStatus(gymAddress.value);
  }

  async function loadGymStatus(gymAddress: Address) {
    if (!contractAddresses || !publicClient) {
      setStatusError(`Please switch your wallet to Polygon Amoy (chain 80002). Current chain: ${chainId}.`);
      return;
    }

    try {
      const [approved, rawInfo] = await Promise.all([
        publicClient.readContract({
          address: contractAddresses.registry,
          abi: GymRegistryABI,
          functionName: "isApproved",
          args: [gymAddress],
        }),
        publicClient.readContract({
          address: contractAddresses.registry,
          abi: GymRegistryABI,
          functionName: "getGymInfo",
          args: [gymAddress],
        }),
      ]);
      const info = normalizeGymInfo(rawInfo);

      setGymStatus({
        name: info.name,
        gymAddress: info.gymAddress,
        approved: Boolean(approved),
      });
      setStatusError(null);
    } catch (error) {
      setGymStatus(null);
      setStatusError(getWalletErrorMessage(error, "Could not load gym status."));
    }
  }

  async function handleMint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTxStatus(idleTxStatus);

    const recipient = parseAddressField(mintForm.recipient, "Recipient address");
    const gymAddress = parseAddressField(mintForm.gymAddress, "Gym address");
    const tierId = parseIntegerField(mintForm.tierId, "Tier ID", 0, 255);
    const durationDays = parseIntegerField(mintForm.durationDays, "Duration days", 1, 3650);
    const tokenUri = mintForm.tokenUri.trim();
    const validationError = recipient.error ?? gymAddress.error ?? tierId.error ?? durationDays.error;

    if (validationError || !recipient.value || !gymAddress.value || tierId.value === null || durationDays.value === null) {
      setTxStatus({ type: "error", message: validationError ?? "Check the mint form values." });
      return;
    }

    if (!contractAddresses || !publicClient) {
      setTxStatus({ type: "error", message: `Please switch your wallet to Polygon Amoy (chain 80002). Current chain: ${chainId}.` });
      return;
    }

    try {
      setTxStatus({ type: "pending", label: "Waiting for membership mint confirmation..." });
      const baseArgs = [recipient.value, gymAddress.value, BigInt(tierId.value), BigInt(durationDays.value)] as const;
      const hash = await writeContractAsync({
        address: contractAddresses.gymMembership,
        abi: GymMembershipABI,
        functionName: "mintMembership",
        args: tokenUri ? [...baseArgs, tokenUri] : baseArgs,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await loadGymStatus(gymAddress.value);
      setTxStatus({ type: "success", label: "Membership minted", hash });
    } catch (error) {
      setTxStatus({ type: "error", message: getWalletErrorMessage(error, "Membership mint failed.") });
    }
  }

  return (
    <>
        <div className="grid gap-6 py-10 lg:grid-cols-[1fr_24rem]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">Gym dashboard</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal">Mint member access</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Use the approved gym address here, then mint a time-bound membership NFT to your member demo wallet.
            </p>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Connected wallet</p>
            <dl className="mt-4 space-y-3 text-sm">
              <StatusRow label="Address" value={address ? shortAddress(address) : "Not connected"} />
              <StatusRow label="Selected gym" value={mintForm.gymAddress ? shortAddress(mintForm.gymAddress) : "Not set"} />
              <StatusRow label="Role match" value={connectedMatchesGym ? "Matches gym" : "Not the selected gym"} />
            </dl>
          </aside>
        </div>

        <TxStatus status={txStatus} />

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_24rem]">
          <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleMint}>
            <h2 className="text-xl font-semibold">Mint membership</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The contract checks that the gym address is approved. The recipient becomes the NFT owner and active user.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Recipient member wallet"
                onChange={(value) => setMintForm((form) => ({ ...form, recipient: value }))}
                placeholder="0x..."
                value={mintForm.recipient}
              />
              <TextInput
                label="Approved gym address"
                onChange={(value) => setMintForm((form) => ({ ...form, gymAddress: value }))}
                placeholder="0x..."
                value={mintForm.gymAddress}
              />
              <TextInput
                inputMode="numeric"
                label="Tier ID"
                onChange={(value) => setMintForm((form) => ({ ...form, tierId: value }))}
                placeholder="1"
                value={mintForm.tierId}
              />
              <TextInput
                inputMode="numeric"
                label="Duration days"
                onChange={(value) => setMintForm((form) => ({ ...form, durationDays: value }))}
                placeholder="30"
                value={mintForm.durationDays}
              />
              <div className="sm:col-span-2">
                <TextInput
                  label="Token URI (optional)"
                  onChange={(value) => setMintForm((form) => ({ ...form, tokenUri: value }))}
                  placeholder="ipfs://..."
                  value={mintForm.tokenUri}
                />
              </div>
            </div>

            <button
              aria-busy={isPending}
              className="mt-5 min-h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              Mint Membership
            </button>
          </form>

          <aside className="space-y-5">
            <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleStatusCheck}>
              <h2 className="text-xl font-semibold">Gym status</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Check approval before minting.</p>
              <div className="mt-5">
                <TextInput
                  label="Gym address"
                  onChange={(value) => setMintForm((form) => ({ ...form, gymAddress: value }))}
                  placeholder="0x..."
                  value={mintForm.gymAddress}
                />
              </div>
              <button
                className="mt-5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
                type="submit"
              >
                Check Status
              </button>
              {statusError ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{statusError}</p> : null}
              {gymStatus ? <GymStatus status={gymStatus} /> : null}
            </form>

            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
              After minting, open the member wallet and go to{" "}
              <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/dashboard">
                Dashboard
              </Link>{" "}
              to list the membership for resale.
            </div>
          </aside>
        </div>
    </>
  );
}

function normalizeGymInfo(value: unknown): { gymAddress: Address; name: string } {
  const tuple = value as readonly [Address, Address, string, bigint, boolean, readonly unknown[]] & {
    gymAddress?: Address;
    name?: string;
  };

  return {
    gymAddress: tuple.gymAddress ?? tuple[0],
    name: tuple.name ?? tuple[2],
  };
}

function GymStatus({ status }: { status: GymStatusView }) {
  if (isZeroAddress(status.gymAddress)) {
    return <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm font-medium text-amber-800">This gym is not registered.</p>;
  }

  return (
    <dl className="mt-4 space-y-3 rounded-md bg-slate-100 p-4 text-sm">
      <StatusRow label="Name" value={status.name || "Unnamed"} />
      <StatusRow label="Address" value={shortAddress(status.gymAddress)} />
      <StatusRow label="Approval" value={status.approved ? "Approved" : "Pending"} />
    </dl>
  );
}

function TextInput({
  inputMode,
  label,
  onChange,
  placeholder,
  value,
}: {
  inputMode?: "numeric";
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-all text-right font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
