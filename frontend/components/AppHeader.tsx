"use client";

import Link from "next/link";

import { ConnectButton } from "@/components/ConnectButton";

const navItems = [
  { href: "/admin", label: "Admin" },
  { href: "/gym", label: "Gym" },
  { href: "/dashboard", label: "Member" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/verify", label: "Verify" },
];

export function AppHeader() {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between gap-4">
        <Link
          className="text-lg font-semibold tracking-normal text-slate-950 transition hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          href="/"
        >
          FlexPass
        </Link>
        <div className="sm:hidden">
          <ConnectButton />
        </div>
      </div>
      <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
        {navItems.map((item) => (
          <Link
            className="rounded-md px-3 py-2 transition hover:bg-white hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="hidden sm:block">
        <ConnectButton />
      </div>
    </header>
  );
}
