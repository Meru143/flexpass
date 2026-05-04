import { getAddress, isAddress, type Address } from "viem";

export const maxRoyaltyBps = 3000;

const integerPattern = /^(?:0|[1-9]\d*)$/;
const zero = BigInt(0);
const one = BigInt(1);
const uint256Max = (one << BigInt(256)) - one;

export interface ParsedField<T> {
  value: T | null;
  error: string | null;
}

export function parseAddressField(input: string, label: string): ParsedField<Address> {
  const value = input.trim();

  if (!value) {
    return { value: null, error: `${label} is required.` };
  }

  if (!isAddress(value)) {
    return { value: null, error: `${label} must be a valid wallet address.` };
  }

  return { value: getAddress(value), error: null };
}

export function parseRequiredText(input: string, label: string): ParsedField<string> {
  const value = input.trim();
  return value ? { value, error: null } : { value: null, error: `${label} is required.` };
}

export function parseIntegerField(input: string, label: string, min: number, max: number): ParsedField<number> {
  const value = input.trim();

  if (!integerPattern.test(value)) {
    return { value: null, error: `${label} must be a whole number.` };
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    return { value: null, error: `${label} must be between ${min} and ${max}.` };
  }

  return { value: parsed, error: null };
}

export function parseTokenIdField(input: string): ParsedField<bigint> {
  const value = input.trim();

  if (!integerPattern.test(value)) {
    return { value: null, error: "Token ID must be a whole number." };
  }

  const parsed = BigInt(value);

  if (parsed <= zero || parsed > uint256Max) {
    return { value: null, error: "Token ID must be a positive uint256." };
  }

  return { value: parsed, error: null };
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: bigint | number): string {
  const seconds = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(seconds * 1000));
}

export function isZeroAddress(address: string): boolean {
  return /^0x0{40}$/i.test(address);
}
