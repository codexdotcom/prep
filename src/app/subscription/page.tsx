"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Crown,
  Loader2,
  Zap,
  Star,
  Shield,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface PlanInfo {
  name: string;
  price: number;
  priceLabel: string;
  features: string[];
  popular?: boolean;
}

const PLAN_ICONS: Record<string, typeof Star> = {
  FREE: Shield,
  STARTER: Zap,
  PRO: Star,
  ELITE: Crown,
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");
  const [allPlans, setAllPlans] = useState<Record<string, PlanInfo>>({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/payments/subscription");
        const data = await res.json();
        if (res.ok) {
          setCurrentPlan(data.plan);
          setAllPlans(data.allPlans);
          setExpiresAt(data.expiresAt);
        }
      } catch {
        console.error("Failed to load subscription");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubscribe = async (plan: string) => {
    if (plan === "FREE" || plan === currentPlan) return;
    setPurchasing(plan);

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Payment failed");
        return;
      }

      // Redirect to Paystack checkout
      window.location.href = data.authorizationUrl;
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
      </div>
    );
  }

  const planKeys = ["FREE", "STARTER", "PRO", "ELITE"];

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header
        className="sticky top-0 z-30"
        style={{
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-surface-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Choose Your Plan
          </span>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--color-text-primary)" }}>
            Upgrade Your Prep
          </h1>
          <p className="mt-2 text-sm mx-auto max-w-md" style={{ color: "var(--color-text-tertiary)", lineHeight: "1.6" }}>
            Unlock AI-powered features, unlimited practice, and personalized study plans to hit your target score.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {planKeys.map((key) => {
            const plan = allPlans[key];
            if (!plan) return null;

            const Icon = PLAN_ICONS[key] || Shield;
            const isCurrent = currentPlan === key;
            const isPopular = (plan as any).popular;

            return (
              <div
                key={key}
                className="relative rounded-2xl p-5 flex flex-col"
                style={{
                  background: "var(--color-surface-card)",
                  border: `1.5px solid ${
                    isPopular
                      ? "var(--color-accent-green)"
                      : isCurrent
                      ? "rgba(34, 197, 94, 0.3)"
                      : "var(--color-surface-border)"
                  }`,
                  boxShadow: isPopular ? "var(--shadow-glow)" : "var(--shadow-card)",
                }}
              >
                {isPopular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[0.625rem] font-bold"
                    style={{
                      background: "var(--color-accent-green)",
                      color: "var(--color-surface)",
                    }}
                  >
                    MOST POPULAR
                  </span>
                )}

                <Icon
                  className="h-6 w-6 mb-3"
                  style={{
                    color: isPopular ? "var(--color-accent-green)" : "var(--color-text-tertiary)",
                  }}
                />

                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {plan.name}
                </p>

                <div className="mt-2 mb-4">
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.75rem",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {plan.priceLabel}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      /month
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--color-accent-green)" }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div
                    className="w-full rounded-xl py-2.5 text-center text-xs font-semibold"
                    style={{
                      background: "rgba(34, 197, 94, 0.1)",
                      color: "var(--color-accent-green)",
                      border: "1px solid rgba(34, 197, 94, 0.2)",
                    }}
                  >
                    Current Plan
                  </div>
                ) : key === "FREE" ? (
                  <div
                    className="w-full rounded-xl py-2.5 text-center text-xs font-medium"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Free forever
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(key)}
                    disabled={purchasing === key}
                    className={isPopular ? "btn-primary w-full" : "btn-secondary w-full"}
                    style={{ fontSize: "0.8125rem" }}
                  >
                    {purchasing === key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Get ${plan.name}`
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Current plan info */}
        {currentPlan !== "FREE" && expiresAt && (
          <div
            className="mt-6 rounded-xl p-4 text-center text-sm"
            style={{
              background: "rgba(34, 197, 94, 0.05)",
              border: "1px solid rgba(34, 197, 94, 0.1)",
              color: "var(--color-text-tertiary)",
            }}
          >
            Your {currentPlan} plan renews on{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {new Date(expiresAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
            </strong>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 text-center" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
          <Logo size="small" />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <a href="/privacy" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Privacy Policy</a>
            <span>·</span>
            <a href="/terms" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Terms</a>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} JambOS. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}