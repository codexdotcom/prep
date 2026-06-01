"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Gift,
  Copy,
  Check,
  Share2,
  Loader2,
  ChevronRight,
  Crown,
  Star,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface ReferralData {
  code: string;
  referrals: Array<{
    id: string;
    name: string;
    image: string | null;
    status: string;
    date: string;
  }>;
  totalCompleted: number;
  nextReward: { threshold: number; reward: string } | null;
  shareUrl: string;
}

const REWARD_TIERS = [
  { threshold: 3, reward: "1 week Pro", icon: "🎁" },
  { threshold: 5, reward: "1 month Pro", icon: "⭐" },
  { threshold: 10, reward: "3 months Pro", icon: "🏆" },
  { threshold: 25, reward: "1 year Pro", icon: "👑" },
];

export default function ReferralPage() {
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/referral");
        const d = await res.json();
        if (res.ok) setData(d);
      } catch {
        console.error("Failed to load referral data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!data) return;
    const text = `I'm using JambOS to prep for JAMB — AI-powered, personalized, and it actually works! Use my code ${data.code} to join.\n\n${data.shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
      </div>
    );
  }

  if (!data) return null;

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
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Invite Friends
            </span>
          </div>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* Hero */}
        <div className="card mb-6 p-6 text-center" style={{ boxShadow: "var(--shadow-glow)" }}>
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(34,197,94,0.1)" }}
          >
            <Gift className="h-7 w-7" style={{ color: "var(--color-accent-green)" }} />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
            Get Free Premium
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
            Invite friends to JambOS. When they sign up with your code, you both benefit.
            Invite {data.nextReward?.threshold || 3} friends to unlock {data.nextReward?.reward || "Pro access"}.
          </p>

          {/* Code display */}
          <div
            className="mt-5 flex items-center justify-between rounded-xl p-4"
            style={{
              background: "var(--color-surface-light)",
              border: "1px solid var(--color-surface-border)",
            }}
          >
            <div>
              <p className="text-[0.625rem] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                Your code
              </p>
              <p
                className="text-xl font-bold tracking-widest mt-0.5"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}
              >
                {data.code}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="btn-secondary"
              style={{ padding: "0.5rem 0.75rem" }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="btn-primary w-full mt-4"
          >
            <Share2 className="h-4 w-4" />
            Share with Friends
          </button>
        </div>

        {/* Progress to next reward */}
        {data.nextReward && (
          <div className="card mb-6 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Progress to {data.nextReward.reward}
              </p>
              <span
                className="text-xs font-semibold"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}
              >
                {data.totalCompleted}/{data.nextReward.threshold}
              </span>
            </div>
            <div className="progress-track" style={{ height: "10px" }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (data.totalCompleted / data.nextReward.threshold) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
              {data.nextReward.threshold - data.totalCompleted} more friend{data.nextReward.threshold - data.totalCompleted !== 1 ? "s" : ""} to go
            </p>
          </div>
        )}

        {/* Reward tiers */}
        <div className="card mb-6 p-5">
          <p className="section-label mb-3">Reward Tiers</p>
          <div className="space-y-2">
            {REWARD_TIERS.map((tier) => {
              const reached = data.totalCompleted >= tier.threshold;
              return (
                <div
                  key={tier.threshold}
                  className="flex items-center gap-3 rounded-lg p-3"
                  style={{
                    background: reached ? "rgba(34,197,94,0.06)" : "var(--color-surface-light)",
                    border: `1px solid ${reached ? "rgba(34,197,94,0.2)" : "var(--color-surface-border)"}`,
                    opacity: reached ? 1 : 0.6,
                  }}
                >
                  <span className="text-xl">{tier.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {tier.threshold} friends
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                      {tier.reward}
                    </p>
                  </div>
                  {reached && (
                    <Check className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Invited friends */}
        {data.referrals.length > 0 && (
          <div className="card p-5">
            <p className="section-label mb-3">
              Your Invites ({data.referrals.length})
            </p>
            <div className="space-y-2">
              {data.referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center gap-3 rounded-lg p-2.5"
                  style={{
                    background: "var(--color-surface-light)",
                    border: "1px solid var(--color-surface-border)",
                  }}
                >
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden shrink-0"
                    style={{
                      background: ref.image ? "transparent" : "var(--color-surface-lighter)",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    {ref.image ? (
                      <img src={ref.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      ref.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                      {ref.name}
                    </p>
                    <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                      Joined {new Date(ref.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span
                    className="badge badge-green"
                    style={{ fontSize: "0.5625rem" }}
                  >
                    {ref.status === "REWARDED" ? "Rewarded" : "Joined"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-12 pt-6 text-center" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
          <Logo size="small" />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <a href="/privacy" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Privacy</a>
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