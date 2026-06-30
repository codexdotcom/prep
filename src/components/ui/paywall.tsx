"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Zap, ArrowRight, Loader2 } from "lucide-react";

interface PaywallProps {
  feature: string;
  used?: number;
  limit?: number;
  tier?: string;
}

const MICRO_PRICES: Record<string, { price: number; label: string }> = {
  quizfetch: { price: 200, label: "Extra quiz generation" },
  flashcards: { price: 150, label: "Extra flashcard deck" },
  essay: { price: 400, label: "Essay grading" },
  "audio-recap": { price: 300, label: "Audio recap" },
  "visual-explainer": { price: 200, label: "Visual analysis" },
  "explainer-video": { price: 500, label: "Explainer video" },
  "record-lecture": { price: 400, label: "Lecture notes" },
  call: { price: 2000, label: "Tutor call session" },
  chat: { price: 100, label: "10 extra messages" },
  arcade: { price: 100, label: "Extra game session" },
  explainer: { price: 150, label: "Extra explainer" },
};

export function Paywall({ feature, used, limit, tier }: PaywallProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const micro = MICRO_PRICES[feature];
  const isLocked = limit === 0;

  const handleMicroPay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/micro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {}
    setLoading(false);
  };

  const tierLabel = (tier || "Free").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="rounded-2xl p-8 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#f5f5f5" }}>
        <Lock className="h-6 w-6" style={{ color: "#555" }} />
      </div>

      <h2 className="text-base font-semibold" style={{ color: "#111" }}>
        {isLocked ? "Upgrade to access this feature" : "You have reached your daily limit"}
      </h2>

      <p className="text-sm mt-2 mb-6 mx-auto max-w-xs" style={{ color: "#777", lineHeight: 1.6 }}>
        {isLocked
          ? `This feature is not available on the ${tierLabel} plan. Upgrade to unlock full access.`
          : `You have used ${used} of ${limit} allowed for today. Upgrade or purchase extra uses to continue.`}
      </p>

      <div className="space-y-2.5 max-w-xs mx-auto">
        {micro && !isLocked && (
          <button onClick={handleMicroPay} disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all"
            style={{ background: "#f8f8f8", color: "#111", border: "1px solid #eee" }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" style={{ color: "#f59e0b" }} />}
            {micro.label} - N{micro.price.toLocaleString()}
          </button>
        )}

        <button onClick={() => router.push("/pricing")}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all"
          style={{ background: "#111", color: "#fff" }}>
          View Plans <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}