"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";

import { AppHeader } from "@/components/AppHeader";
import { idleTxStatus, TxStatus, type TxStatusState } from "@/components/TxStatus";
import { WalletGate } from "@/components/WalletGate";
import { getContractAddresses, GymRegistryABI } from "@/lib/contracts";
import {
  isZeroAddress,
  maxRoyaltyBps,
  parseAddressField,
  parseIntegerField,
  parseRequiredText,
  shortAddress,
} from "@/lib/demo-validation";
import { getWalletErrorMessage } from "@/lib/wallet-errors";

interface RegisterGymForm {
  gymAddress: string;
  treasury: string;
  name: string;
  royaltyBps: string;
}

interface GymInfoView {
  gymAddress: Address;
  treasury: Address;
  name: string;
  royaltyBps: bigint;
  approved: boolean;
}

const initialRegisterForm: RegisterGymForm = {
  gymAddress: "",
  treasury: "",
  name: "FlexPass Demo Gym",
  royaltyBps: "1000",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-6 py-6">
        <AppHeader />
        <WalletGate>
          <AdminContent />
        </WalletGate>
      </section>
    </main>
  );
}

function AdminContent() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId]);
  const [registerForm, setRegisterForm] = useState<RegisterGymForm>(initialRegisterForm);
  const [approveAddress, setApproveAddress] = useState("");
  const [lookupAddress, setLookupAddress] = useState("");
  const [registryOwner, setRegistryOwner] = useState<Address | null>(null);
  const [gymInfo, setGymInfo] = useState<GymInfoView | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatusState>(idleTxStatus);

  const isAdminWallet =
    Boolean(address && registryOwner) && address?.toLowerCase() === registryOwner?.toLowerCase();

  useEffect(() => {
    let cancelled = false;

    async function loadOwner() {
      if (!contractAddresses || !publicClient) {
        setRegistryOwner(null);
        return;
      }

      try {
        const owner = (await publicClient.readContract({
          address: contractAddresses.registry,
          abi: GymRegistryABI,
          functionName: "owner",
        })) as Address;

        if (!cancelled) {
          setRegistryOwner(owner);
        }
      } catch {
        if (!cancelled) {
          setRegistryOwner(null);
        }
      }
    }

    void loadOwner();

    return () => {
      cancelled = true;
    };
  }, [contractAddresses, publicClient]);

  const refreshGymInfo = useCallback(
    async (gymAddress: Address) => {
      if (!contractAddresses || !publicClient) {
        setLookupError(`Please switch your wallet to Polygon Amoy (chain 80002). Current chain: ${chainId}.`);
        return;
      }

      try {
        const rawInfo = await publicClient.readContract({
          address: contractAddresses.registry,
          abi: GymRegistryABI,
          functionName: "getGymInfo",
          args: [gymAddress],
        });

        setGymInfo(normalizeGymInfo(rawInfo));
        setLookupError(null);
      } catch (error) {
        setGymInfo(null);
        setLookupError(getWalletErrorMessage(error, "Could not load gym registry data."));
      }
    },
    [chainId, contractAddresses, publicClient],
  );

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTxStatus(idleTxStatus);

    const gymAddress = parseAddressField(registerForm.gymAddress, "Gym address");
    const treasury = parseAddressField(registerForm.treasury, "Treasury address");
    const name = parseRequiredText(registerForm.name, "Gym name");
    const royaltyBps = parseIntegerField(registerForm.royaltyBps, "Royalty", 0, maxRoyaltyBps);
    const validationError = gymAddress.error ?? treasury.error ?? name.error ?? royaltyBps.error;

    if (validationError || !gymAddress.value || !treasury.value || !name.value || royaltyBps.value === null) {
      setTxStatus({ type: "error", message: validationError ?? "Check the registration form values." });
      return;
    }

    if (!contractAddresses || !publicClient) {
      setTxStatus({ type: "error", message: `Please switch your wallet to Polygon Amoy (chain 80002). Current chain: ${chainId}.` });
      return;
    }

    try {
      setTxStatus({ type: "pending", label: "Waiting for gym registration confirmation..." });
      const hash = await writeContractAsync({
        address: contractAddresses.registry,
        abi: GymRegistryABI,
        functionName: "registerGym",
        args: [gymAddress.value, treasury.value, name.value, BigInt(royaltyBps.value)],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setLookupAddress(gymAddress.value);
      await refreshGymInfo(gymAddress.value);
      setTxStatus({ type: "success", label: "Gym registered", hash });
    } catch (error) {
      setTxStatus({ type: "error", message: getWalletErrorMessage(error, "Gym registration failed.") });
    }
  }

  async function handleApprove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTxStatus(idleTxStatus);

    const gymAddress = parseAddressField(approveAddress, "Gym address");

    if (gymAddress.error || !gymAddress.value) {
      setTxStatus({ type: "error", message: gymAddress.error ?? "Enter a gym address to approve." });
      return;
    }

    if (!contractAddresses || !publicClient) {
      setTxStatus({ type: "error", message: `Please switch your wallet to Polygon Amoy (chain 80002). Current chain: ${chainId}.` });
      return;
    }

    try {
      setTxStatus({ type: "pending", label: "Waiting for gym approval confirmation..." });
      const hash = await writeContractAsync({
        address: contractAddresses.registry,
        abi: GymRegistryABI,
        functionName: "approveGym",
        args: [gymAddress.value],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setLookupAddress(gymAddress.value);
      await refreshGymInfo(gymAddress.value);
      setTxStatus({ type: "success", label: "Gym approved", hash });
    } catch (error) {
      setTxStatus({ type: "error", message: getWalletErrorMessage(error, "Gym approval failed.") });
    }
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const gymAddress = parseAddressField(lookupAddress, "Gym address");

    if (gymAddress.error || !gymAddress.value) {
      setGymInfo(null);
      setLookupError(gymAddress.error ?? "Enter a gym address to inspect.");
      return;
    }

    await refreshGymInfo(gymAddress.value);
  }

  return (
    <>
        <div className="grid gap-6 py-10 lg:grid-cols-[1fr_24rem]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">Protocol admin</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal">Register and approve gyms</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Use the deployer wallet here. Registration creates the gym record; approval unlocks membership minting for
              that gym address.
            </p>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Admin wallet</p>
            <dl className="mt-4 space-y-3 text-sm">
              <StatusRow label="Connected" value={address ? shortAddress(address) : "Not connected"} />
              <StatusRow label="Registry owner" value={registryOwner ? shortAddress(registryOwner) : "Unavailable"} />
              <StatusRow label="Role" value={isAdminWallet ? "Protocol admin" : "Not owner"} />
            </dl>
          </aside>
        </div>

        <TxStatus status={txStatus} />

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleRegister}>
            <h2 className="text-xl font-semibold">Register gym</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The gym address is the wallet that will later mint memberships. Treasury receives royalties.
            </p>

            <div className="mt-5 grid gap-4">
              <TextInput
                label="Gym address"
                onChange={(value) => setRegisterForm((form) => ({ ...form, gymAddress: value }))}
                placeholder="0x..."
                value={registerForm.gymAddress}
              />
              <TextInput
                label="Treasury address"
                onChange={(value) => setRegisterForm((form) => ({ ...form, treasury: value }))}
                placeholder="0x..."
                value={registerForm.treasury}
              />
              <TextInput
                label="Gym name"
                onChange={(value) => setRegisterForm((form) => ({ ...form, name: value }))}
                placeholder="FlexPass Demo Gym"
                value={registerForm.name}
              />
              <TextInput
                inputMode="numeric"
                label="Royalty basis points"
                onChange={(value) => setRegisterForm((form) => ({ ...form, royaltyBps: value }))}
                placeholder="1000"
                value={registerForm.royaltyBps}
              />
            </div>

            <button
              aria-busy={isPending}
              className="mt-5 min-h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              Register Gym
            </button>
          </form>

          <div className="space-y-5">
            <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleApprove}>
              <h2 className="text-xl font-semibold">Approve gym</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This action is owner-only. Switch to the deployer wallet before approving.
              </p>
              <div className="mt-5">
                <TextInput label="Gym address" onChange={setApproveAddress} placeholder="0x..." value={approveAddress} />
              </div>
              <button
                aria-busy={isPending}
                className="mt-5 min-h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                Approve Gym
              </button>
            </form>

            <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleLookup}>
              <h2 className="text-xl font-semibold">Inspect gym</h2>
              <div className="mt-5">
                <TextInput label="Gym address" onChange={setLookupAddress} placeholder="0x..." value={lookupAddress} />
              </div>
              <button
                className="mt-5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
                type="submit"
              >
                Load Gym Status
              </button>
              {lookupError ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{lookupError}</p> : null}
              {gymInfo ? <GymStatus info={gymInfo} /> : null}
            </form>
          </div>
        </div>
    </>
  );
}

function normalizeGymInfo(value: unknown): GymInfoView {
  const tuple = value as readonly [Address, Address, string, bigint, boolean, readonly unknown[]] & {
    gymAddress?: Address;
    treasury?: Address;
    name?: string;
    royaltyBps?: bigint;
    approved?: boolean;
  };

  return {
    gymAddress: tuple.gymAddress ?? tuple[0],
    treasury: tuple.treasury ?? tuple[1],
    name: tuple.name ?? tuple[2],
    royaltyBps: tuple.royaltyBps ?? tuple[3],
    approved: tuple.approved ?? tuple[4],
  };
}

function GymStatus({ info }: { info: GymInfoView }) {
  if (isZeroAddress(info.gymAddress)) {
    return (
      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
        This gym is not registered yet.
      </div>
    );
  }

  return (
    <dl className="mt-4 grid gap-3 rounded-md bg-slate-100 p-4 text-sm">
      <StatusRow label="Name" value={info.name || "Unnamed"} />
      <StatusRow label="Gym" value={shortAddress(info.gymAddress)} />
      <StatusRow label="Treasury" value={shortAddress(info.treasury)} />
      <StatusRow label="Royalty" value={`${info.royaltyBps.toString()} bps`} />
      <StatusRow label="Approval" value={info.approved ? "Approved" : "Pending"} />
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
  inputMode?: "decimal" | "numeric";
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
