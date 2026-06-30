"use client";

import { useState, useEffect, useCallback } from "react";

interface UsageState {
  allowed: boolean;
  used: number;
  limit: number;
  tier: string;
  remaining: number;
  loading: boolean;
  record: () => Promise<void>;
}

export function useUsage(feature: string): UsageState {
  const [state, setState] = useState({
    allowed: true, used: 0, limit: -1, tier: "FREE", remaining: -1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/usage/check?feature=${feature}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.allowed !== undefined) setState(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [feature]);

  const record = useCallback(async () => {
    try {
      await fetch("/api/usage/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature }),
      });
      const res = await fetch(`/api/usage/check?feature=${feature}`);
      const data = await res.json();
      if (data.allowed !== undefined) setState(data);
    } catch {}
  }, [feature]);

  return { ...state, loading, record };
}