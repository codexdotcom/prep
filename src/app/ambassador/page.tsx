"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Award, Users, TrendingUp, Copy, CheckCircle2,
  Loader2, Star, Zap, Gift, Shield, Crown, Trophy,
  ChevronRight, ChevronDown, ChevronUp, Share2, Target,
} from "lucide-react";
import { NIGERIAN_STATES } from "@/lib/data/nigerian-states";
import { AMBASSADOR_TIERS, getTier, getNextTier, formatNaira, potentialEarnings, type TierKey } from "@/lib/ambassador";

interface AmbassadorData {
  id: string;
  code: string;
  displayName: string;
  schoolName: string;
  schoolState: string;
  tier: TierKey;
  isSchoolCaptain: boolean;
  totalSignups: number;
  verifiedReferrals: number;
  premiumConversions: number;
  totalEarnings: number;
  pendingPayout: number;
  monthlyReferrals: number;
  monthlyEarnings: number;
  recruits: Array<{
    id: string;
    status: string;
    profileCompleted: boolean;
    firstTestTaken: boolean;
    upgradedToPremium: boolean;
    totalEarned: number;
    createdAt: string;
    recruitUser: { name: string };
  }>;
}

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  schoolName: string;
  schoolState: string;
  tier: string;
  referrals: number;
  earnings: number;
  isSchoolCaptain: boolean;
  isMe: boolean;
}

export default function AmbassadorPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"dashboard" | "leaderboard" | "tiers">("dashboard");
  const [data, setData] = useState<AmbassadorData | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAmbassador, setIsAmbassador] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [expandedRecruit, setExpandedRecruit] = useState<string | null>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbType, setLbType] = useState<"all_time" | "monthly">("all_time");
  const [lbLoading, setLbLoading] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);

  // Apply form
  const [schoolName, setSchoolName] = useState("");
  const [schoolState, setSchoolState] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ambassador");
        const d = await res.json();
        if (d.ambassador) {
          setData(d.ambassador);
          setRank(d.rank);
          setChallenge(d.challenge);
          setIsAmbassador(true);
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const loadLeaderboard = async () => {
    setLbLoading(true);
    try {
      const res = await fetch(`/api/ambassador/leaderboard?type=${lbType}`);
      const d = await res.json();
      setLeaderboard(d.leaderboard || []);
      setMyRank(d.myRank);
    } catch {} finally { setLbLoading(false); }
  };

  useEffect(() => { if (tab === "leaderboard") loadLeaderboard(); }, [tab, lbType]);

  const handleApply = async () => {
    if (!schoolName || !schoolState) return;
    setApplying(true);
    try {
      const res = await fetch("/api/ambassador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolName, schoolState, schoolCity, bio }),
      });
      const d = await res.json();
      if (res.ok) { setData(d.ambassador); setIsAmbassador(true); setShowApply(false); }
      else alert(d.error);
    } catch {} finally { setApplying(false); }
  };

  const copyLink = () => {
    if (!data) return;
    navigator.clipboard.writeText(`jambos.ng/join?amb=${data.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!data) return;
    const text = `Join me on JambOS — the smartest way to prepare for JAMB! Use my link to sign up:\n\njambos.ng/join?amb=${data.code}\n\nFree JAMB practice, AI tutor, score prediction, and more.`;
    if (navigator.share) {
      try { await navigator.share({ text, title: "Join JambOS" }); } catch {}
    } else { copyLink(); }
  };

  const currentTier = data ? getTier(data.tier) : AMBASSADOR_TIERS[0];
  const nextTier = data ? getNextTier(data.tier) : AMBASSADOR_TIERS[1];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBSCRIBED": return "var(--color-accent-green)";
      case "VERIFIED": case "ACTIVE": return "var(--color-info-400)";
      case "PROFILED": return "var(--color-warning-400)";
      default: return "var(--color-text-muted)";
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>;

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header className="sticky top-0 z-30" style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {isAmbassador ? currentTier.title : "Ambassador Program"}
          </span>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* ═══ NOT AN AMBASSADOR ═══ */}
        {!isAmbassador && !showApply && (
          <>
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "rgba(34,197,94,0.1)" }}>
                <Shield className="h-8 w-8" style={{ color: "var(--color-accent-green)" }} />
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
                JambOS Admission Ambassadors
              </h1>
              <p className="text-sm mt-2 mx-auto max-w-md" style={{ color: "var(--color-text-tertiary)" }}>
                Represent JambOS in your school. Help your classmates prepare for JAMB. Earn real money for every student you bring.
              </p>
            </div>

            {/* Earnings highlight */}
            <div className="rounded-2xl p-5 mb-6 text-center" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(167,139,250,0.04) 100%)", border: "1px solid rgba(34,197,94,0.12)" }}>
              <p className="text-[0.625rem] uppercase tracking-widest mb-2" style={{ color: "var(--color-accent-green)" }}>Top ambassadors earn</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-text-primary)" }}>₦2,000,000+</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>per year at Legend tier</p>
            </div>

            {/* How it works */}
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>How It Works</p>
            <div className="space-y-2 mb-6">
              {[
                { step: "1", title: "Share your link", desc: "Get a unique referral link for your school" },
                { step: "2", title: "Students sign up & take a test", desc: "You get paid only when they actually use JambOS" },
                { step: "3", title: "Earn per verified referral", desc: "₦300–₦2,000 per student depending on your tier" },
                { step: "4", title: "Earn more when they upgrade", desc: "₦1,000–₦2,500 bonus when referrals go Premium" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-3 card p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-accent-green)", fontFamily: "var(--font-mono)" }}>
                    {step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</p>
                    <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tier preview */}
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>Ambassador Tiers</p>
            <div className="space-y-2 mb-6">
              {AMBASSADOR_TIERS.filter((t) => t.key !== "STARTER").map((t) => (
                <div key={t.key} className="card p-3.5 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${t.color}20` }}>
                    <Star className="h-5 w-5" style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{t.label}</p>
                    <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                      {t.min}+ verified referrals · {formatNaira(t.perVerified)}/referral
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold" style={{ color: t.color }}>{potentialEarnings(t.key)}</p>
                    <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>potential</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowApply(true)} className="btn-primary w-full" style={{ padding: "0.875rem" }}>
              <Zap className="h-4 w-4" /> Apply as Ambassador
            </button>
          </>
        )}

        {/* ═══ APPLY FORM ═══ */}
        {!isAmbassador && showApply && (
          <div className="card p-5 max-w-lg mx-auto">
            <button onClick={() => setShowApply(false)} className="btn-ghost mb-3" style={{ padding: "0.25rem" }}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Apply as Admission Ambassador</h2>
            <div className="space-y-3">
              <div><label className="label">School Name *</label><input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. Kings College Lagos" className="input-field" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">State *</label><select value={schoolState} onChange={(e) => setSchoolState(e.target.value)} className="input-field" style={{ appearance: "none" }}><option value="">Select</option>{NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div><label className="label">City</label><input value={schoolCity} onChange={(e) => setSchoolCity(e.target.value)} placeholder="e.g. Lagos Island" className="input-field" /></div>
              </div>
              <div><label className="label">Why you? (optional)</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about your influence in your school..." className="input-field" rows={3} style={{ resize: "vertical" }} /></div>
              <button onClick={handleApply} disabled={applying || !schoolName || !schoolState} className="btn-primary w-full">
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Submit Application
              </button>
            </div>
          </div>
        )}

        {/* ═══ AMBASSADOR DASHBOARD ═══ */}
        {isAmbassador && data && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "var(--color-surface-light)" }}>
              {[
                { key: "dashboard" as const, label: "Dashboard" },
                { key: "leaderboard" as const, label: "Leaderboard" },
                { key: "tiers" as const, label: "Tiers" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)} className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                  style={{ background: tab === key ? "var(--color-surface-card)" : "transparent", color: tab === key ? "var(--color-text-primary)" : "var(--color-text-tertiary)", boxShadow: tab === key ? "var(--shadow-card)" : "none" }}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "dashboard" && (
              <>
                {/* Tier card */}
                <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--color-surface-card)", border: `1px solid ${currentTier.color}40` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${currentTier.color}20` }}>
                      <Award className="h-6 w-6" style={{ color: currentTier.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: currentTier.color }}>{currentTier.title}</p>
                      <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                        {data.schoolName} · {data.schoolState} {data.isSchoolCaptain && "· School Captain"}
                      </p>
                    </div>
                    {rank && (
                      <div className="text-center">
                        <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>#{rank}</p>
                        <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>National</p>
                      </div>
                    )}
                  </div>

                  {/* Share link */}
                  <div className="rounded-xl p-3 flex items-center gap-2 mb-4" style={{ background: "var(--color-surface-light)", border: "1px solid var(--color-surface-border)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.5rem] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Your link</p>
                      <p className="text-xs font-semibold truncate" style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}>
                        jambos.ng/join?amb={data.code}
                      </p>
                    </div>
                    <button onClick={copyLink} className="btn-ghost" style={{ padding: "0.375rem" }}>
                      {copied ? <CheckCircle2 className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button onClick={shareLink} className="btn-ghost" style={{ padding: "0.375rem" }}>
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: "Total Signups", value: data.totalSignups, icon: Users, color: "var(--color-text-secondary)" },
                      { label: "Verified", value: data.verifiedReferrals, icon: CheckCircle2, color: "var(--color-accent-green)" },
                      { label: "Premium Upgrades", value: data.premiumConversions, icon: Crown, color: "var(--color-warning-400)" },
                      { label: "Total Earnings", value: formatNaira(data.totalEarnings), icon: Gift, color: "var(--color-accent-green)" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--color-surface-light)" }}>
                        <Icon className="mx-auto mb-1 h-3.5 w-3.5" style={{ color }} />
                        <p className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color }}>{value}</p>
                        <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pending payout */}
                  {data.pendingPayout > 0 && (
                    <div className="rounded-xl p-3 text-center mb-4" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
                      <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>Pending Payout</p>
                      <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-accent-green)" }}>{formatNaira(data.pendingPayout)}</p>
                    </div>
                  )}

                  {/* Next tier progress */}
                  {nextTier && (
                    <div>
                      <div className="flex justify-between text-[0.5625rem] mb-1.5">
                        <span style={{ color: currentTier.color }}>{currentTier.label}</span>
                        <span style={{ color: "var(--color-text-muted)" }}>
                          {nextTier.label} — {nextTier.min - data.verifiedReferrals} more verified referrals
                        </span>
                      </div>
                      <div style={{ height: "6px", borderRadius: "9999px", background: "var(--color-surface-lighter)" }}>
                        <div style={{
                          width: `${Math.min((data.verifiedReferrals / nextTier.min) * 100, 100)}%`,
                          height: "100%", borderRadius: "9999px",
                          background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})`,
                          transition: "width 0.5s",
                        }} />
                      </div>
                      <p className="text-[0.5rem] mt-1" style={{ color: "var(--color-text-muted)" }}>
                        Next tier unlocks {formatNaira(nextTier.perVerified)}/referral
                      </p>
                    </div>
                  )}
                </div>

                {/* Monthly stats */}
                <div className="card p-4 mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[0.5625rem] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>This Month</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{data.monthlyReferrals} referrals · {formatNaira(data.monthlyEarnings)}</p>
                  </div>
                  <TrendingUp className="h-5 w-5" style={{ color: data.monthlyReferrals > 0 ? "var(--color-accent-green)" : "var(--color-text-muted)" }} />
                </div>

                {/* Monthly challenge */}
                {challenge && (
                  <div className="card p-4 mb-5" style={{ borderColor: "rgba(245,158,11,0.2)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4" style={{ color: "var(--color-warning-400)" }} />
                      <p className="text-xs font-semibold" style={{ color: "var(--color-warning-400)" }}>{challenge.title}</p>
                    </div>
                    <p className="text-[0.625rem] mb-2" style={{ color: "var(--color-text-tertiary)" }}>{challenge.description}</p>
                    <div className="flex gap-2 text-center">
                      {[
                        { place: "1st", prize: formatNaira(challenge.prize1), color: "#FFD700" },
                        { place: "2nd", prize: formatNaira(challenge.prize2), color: "#C0C0C0" },
                        { place: "3rd", prize: formatNaira(challenge.prize3), color: "#CD7F32" },
                      ].map(({ place, prize, color }) => (
                        <div key={place} className="flex-1 rounded-lg p-2" style={{ background: "var(--color-surface-light)" }}>
                          <p className="text-[0.5rem] font-bold" style={{ color }}>{place}</p>
                          <p className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{prize}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recruits */}
                {data.recruits.length > 0 && (
                  <>
                    <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
                      Recent Recruits ({data.recruits.length})
                    </p>
                    <div className="space-y-1.5">
                      {data.recruits.map((r) => (
                        <div key={r.id} className="card p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>{r.recruitUser.name || "Student"}</p>
                              <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                                {new Date(r.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {r.totalEarned > 0 && (
                                <span className="text-[0.5625rem] font-bold" style={{ color: "var(--color-accent-green)" }}>+{formatNaira(r.totalEarned)}</span>
                              )}
                              <span className="text-[0.5625rem] rounded-full px-2 py-0.5 font-semibold"
                                style={{ background: `${getStatusColor(r.status)}15`, color: getStatusColor(r.status) }}>
                                {r.status}
                              </span>
                            </div>
                          </div>
                          {/* Progress dots */}
                          <div className="flex items-center gap-1 mt-2">
                            {[
                              { done: true, label: "Signed up" },
                              { done: r.profileCompleted, label: "Profile" },
                              { done: r.firstTestTaken, label: "First test" },
                              { done: r.upgradedToPremium, label: "Premium" },
                            ].map(({ done, label }, i) => (
                              <div key={label} className="flex items-center gap-1">
                                <div className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: done ? "rgba(34,197,94,0.1)" : "var(--color-surface-lighter)" }}>
                                  {done ? <CheckCircle2 className="h-2.5 w-2.5" style={{ color: "var(--color-accent-green)" }} />
                                    : <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-surface-border)" }} />}
                                </div>
                                <span className="text-[0.4375rem]" style={{ color: done ? "var(--color-accent-green)" : "var(--color-text-muted)" }}>{label}</span>
                                {i < 3 && <div className="w-3 h-[1px]" style={{ background: done ? "var(--color-accent-green)" : "var(--color-surface-border)" }} />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ═══ LEADERBOARD TAB ═══ */}
            {tab === "leaderboard" && (
              <>
                <div className="flex gap-1 mb-4 p-0.5 rounded-lg" style={{ background: "var(--color-surface-light)" }}>
                  {[
                    { key: "all_time" as const, label: "All Time" },
                    { key: "monthly" as const, label: "This Month" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setLbType(key)} className="flex-1 rounded-md py-1.5 text-xs font-semibold transition-all"
                      style={{ background: lbType === key ? "var(--color-surface-card)" : "transparent", color: lbType === key ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                      {label}
                    </button>
                  ))}
                </div>

                {myRank && (
                  <div className="card p-3 mb-4 flex items-center justify-between" style={{ borderColor: "rgba(34,197,94,0.2)" }}>
                    <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Your rank</span>
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}>#{myRank}</span>
                  </div>
                )}

                {lbLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
                ) : (
                  <div className="space-y-1.5">
                    {leaderboard.map((entry) => {
                      const tier = getTier(entry.tier);
                      return (
                        <div key={entry.rank} className="card p-3 flex items-center gap-3"
                          style={{ borderColor: entry.isMe ? "rgba(34,197,94,0.2)" : undefined, background: entry.isMe ? "rgba(34,197,94,0.02)" : undefined }}>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                            style={{
                              fontFamily: "var(--font-mono)",
                              background: entry.rank <= 3 ? `${["#FFD700", "#C0C0C0", "#CD7F32"][entry.rank - 1]}20` : "var(--color-surface-light)",
                              color: entry.rank <= 3 ? ["#FFD700", "#C0C0C0", "#CD7F32"][entry.rank - 1] : "var(--color-text-muted)",
                            }}>
                            {entry.rank}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: entry.isMe ? "var(--color-accent-green)" : "var(--color-text-primary)" }}>
                              {entry.displayName} {entry.isMe && "(You)"}
                            </p>
                            <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                              {entry.schoolName} · {entry.schoolState}
                              {entry.isSchoolCaptain && " · Captain"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: tier.color }}>{entry.referrals}</p>
                            <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>{formatNaira(entry.earnings)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ═══ TIERS TAB ═══ */}
            {tab === "tiers" && (
              <div className="space-y-3">
                {AMBASSADOR_TIERS.filter((t) => t.key !== "STARTER").map((t) => {
                  const isCurrent = data.tier === t.key;
                  const isUnlocked = data.verifiedReferrals >= t.min;
                  return (
                    <div key={t.key} className="card p-4" style={{ borderColor: isCurrent ? `${t.color}40` : undefined, background: isCurrent ? `${t.color}04` : undefined }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${t.color}20` }}>
                          <Star className="h-5 w-5" style={{ color: t.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold" style={{ color: t.color }}>{t.label}</p>
                            {isCurrent && <span className="text-[0.5rem] rounded-full px-1.5 py-0.5 font-bold" style={{ background: `${t.color}20`, color: t.color }}>CURRENT</span>}
                            {isUnlocked && !isCurrent && <CheckCircle2 className="h-3 w-3" style={{ color: t.color }} />}
                          </div>
                          <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>{t.min}+ verified referrals</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: t.color }}>{potentialEarnings(t.key)}</p>
                          <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>potential</p>
                        </div>
                      </div>

                      {/* Earnings breakdown */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-lg p-2 text-center" style={{ background: "var(--color-surface-light)" }}>
                          <p className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{formatNaira(t.perVerified)}</p>
                          <p className="text-[0.4375rem]" style={{ color: "var(--color-text-muted)" }}>per verified</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: "var(--color-surface-light)" }}>
                          <p className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{t.perPremium > 0 ? formatNaira(t.perPremium) : "—"}</p>
                          <p className="text-[0.4375rem]" style={{ color: "var(--color-text-muted)" }}>per premium</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: "var(--color-surface-light)" }}>
                          <p className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{t.perSchool > 0 ? formatNaira(t.perSchool) : "—"}</p>
                          <p className="text-[0.4375rem]" style={{ color: "var(--color-text-muted)" }}>per school</p>
                        </div>
                      </div>

                      {/* Rewards */}
                      <div className="space-y-1">
                        {t.rewards.map((r, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: isUnlocked ? t.color : "var(--color-surface-border)" }} />
                            <span className="text-[0.625rem]" style={{ color: isUnlocked ? "var(--color-text-secondary)" : "var(--color-text-muted)" }}>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}