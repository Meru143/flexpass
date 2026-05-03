"use client";

import { useEffect, useState } from "react";

interface ExpiryCountdownProps {
  expiresAt: number;
}

const urgentThresholdSeconds = 7 * 24 * 60 * 60;

export function ExpiryCountdown({ expiresAt }: ExpiryCountdownProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(() => getSecondsRemaining(expiresAt));

  useEffect(() => {
    setSecondsRemaining(getSecondsRemaining(expiresAt));

    const interval = window.setInterval(() => {
      setSecondsRemaining(getSecondsRemaining(expiresAt));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [expiresAt]);

  if (secondsRemaining <= 0) {
    return (
      <span className="inline-flex min-h-6 items-center rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
        Expired
      </span>
    );
  }

  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  const urgent = secondsRemaining < urgentThresholdSeconds;

  return (
    <span
      aria-live="polite"
      className={[
        "inline-flex min-h-6 items-center rounded-md px-2 py-1 text-xs font-semibold",
        urgent ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
      ].join(" ")}
    >
      {urgent ? "Expires soon: " : ""}
      {days} days {hours} hours
    </span>
  );
}

function getSecondsRemaining(expiresAt: number): number {
  return Math.max(0, Math.floor(expiresAt - Date.now() / 1000));
}
