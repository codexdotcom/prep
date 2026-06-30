"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Zap, Loader2, Crown, Star } from "lucide-react";
import { PLANS, MICRO_PRICES } from "@/lib/plans";

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTier, setCurrentTier] = useState("FREE");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const success = searchParams.get("success");

  useEffect(() => {
    fetch("/api/payments/status").then((r) => r.json()).then((d) => setCurrentTier(d.tier || "FREE"))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (tier: string) => {
    setSubscribing(tier);
    try {
      const res = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setSubscribing(null);
    } catch { setSubscribing(null); }
  };

  const tierOrder = ["FREE", "BASIC", "STANDARD", "PREMIUM", "ELITE"];
  const currentIdx = tierOrder.indexOf(currentTier);

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span>
          </button>
          <span className="text-sm font-semibold" style={{ color: "#111" }}>Choose Your Plan</span>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-8">
        {/* Success banner */}
        {success && (
          <div className="rounded-xl p-4 mb-6 text-center" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p className="text-sm font-semibold" style={{ color: "#166534" }}>Payment successful. Your plan is now active.</p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "#111" }}>
            Invest in your JAMB success
          </h1>
          <p className="mt-2 text-sm mx-auto max-w-md" style={{ color: "#777", lineHeight: 1.6 }}>
            Every plan gives you AI-powered tools to study smarter. Upgrade for deeper features, unlimited access, and live tutoring.
          </p>
          {!loading && currentTier !== "FREE" && (
            <p className="mt-2 text-xs font-semibold" style={{ color: "#14b8a6" }}>
              Current plan: {currentTier}
            </p>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {PLANS.filter((p) => p.tier !== "FREE").map((plan) => {
            const planIdx = tierOrder.indexOf(plan.tier);
            const isCurrent = plan.tier === currentTier;
            const isDowngrade = planIdx < currentIdx;
            const isHighlight = plan.highlight;

            return (
              <div key={plan.tier} className="rounded-2xl p-6 flex flex-col relative"
                style={{
                  background: "#fff",
                  border: `2px solid ${isCurrent ? "#14b8a6" : isHighlight ? "#111" : "#eee"}`,
                  boxShadow: isHighlight ? "0 8px 32px rgba(0,0,0,0.08)" : "none",
                }}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[0.625rem] font-bold px-3 py-1 rounded-full"
                      style={{ background: plan.tier === "ELITE" ? "#111" : "#111", color: "#fff" }}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: "#111" }}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xs" style={{ color: "#999" }}>N</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "#111", lineHeight: 1 }}>
                      {plan.priceLabel}
                    </span>
                    <span className="text-xs" style={{ color: "#999" }}>{plan.period}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#14b8a6" }} />
                      <span className="text-xs" style={{ color: "#555", lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => handleSubscribe(plan.tier)}
                  disabled={isCurrent || isDowngrade || subscribing === plan.tier}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all"
                  style={{
                    background: isCurrent ? "#f5f5f5" : isHighlight ? "#111" : "#fff",
                    color: isCurrent ? "#999" : isHighlight ? "#fff" : "#111",
                    border: `1px solid ${isCurrent ? "#eee" : isHighlight ? "#111" : "#ddd"}`,
                    opacity: isDowngrade ? 0.4 : 1,
                  }}>
                  {subscribing === plan.tier ? <Loader2 className="h-4 w-4 animate-spin" /> :
                    isCurrent ? "Current Plan" :
                    isDowngrade ? "Downgrade" :
                    <>Upgrade to {plan.name}</>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Micro transactions section */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "#111" }}>Pay as you go</h2>
            <p className="text-xs mt-1" style={{ color: "#999" }}>No subscription needed. Pay for individual features when you need them.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(MICRO_PRICES).map(([key, { price, label }]) => (
              <div key={key} className="rounded-xl p-3 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "#111" }}>{label}</p>
                <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>N{price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Free plan info */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: "#fff", border: "1px solid #eee" }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4" style={{ color: "#f59e0b" }} />
            <h3 className="text-sm font-semibold" style={{ color: "#111" }}>Free Plan</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PLANS[0].features.map((f, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <Check className="h-3 w-3 mt-0.5 shrink-0" style={{ color: "#999" }} />
                <span className="text-[0.6875rem]" style={{ color: "#777" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <footer className="pt-6 text-center" style={{ borderTop: "1px solid #eee" }}>
          <div className="flex items-center justify-center gap-0.5 mb-3">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111" }}>Jamb</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111", fontWeight: 700 }}>OS</span>
          </div>
          <p className="text-xs" style={{ color: "#bbb" }}>&copy; {new Date().getFullYear()} JambOS. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}