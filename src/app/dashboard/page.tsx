"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Brain, BookOpen, BarChart3, Target, Zap, LogOut, ChevronRight, Trophy,
  Flame, Calendar, Crown, GraduationCap, Gift, Settings, User,
  TrendingUp, MessageCircle, Sparkles, Play, Clock, Compass,
  ArrowUpRight, Loader2, RotateCcw, FileText, Shield, Building2,
  ClipboardList, Users, Home, Award, Heart, Menu, X,
} from "lucide-react";
import { Footer } from "@/components/ui/footer";

interface QuickStats {
  predictedScore: number;
  totalTests: number;
  accuracy: number;
  targetScore: number;
  streak: number;
  level: number;
  totalXP: number;
  hasData: boolean;
}

interface SimResult {
  subjects: Array<{ subject: string; currentAccuracy: number; adjustedAccuracy: number; currentScore: number; adjustedScore: number; improvement: number }>;
  currentPredicted: number;
  adjustedPredicted: number;
  totalImprovement: number;
  targetScore: number;
}

interface TrajectoryData {
  currentScore: number;
  targetScore: number;
  gap: number;
  weeksNeeded: number;
  milestones: Array<{ week: number; expectedScore: number; focus: string; tasks: string[] }>;
  subjectBreakdown: Array<{ subject: string; accuracy: number; gap: number; weakTopics: string[] }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const [simAdjustments, setSimAdjustments] = useState<Record<string, number>>({});
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [showSim, setShowSim] = useState(false);

  const [trajData, setTrajData] = useState<TrajectoryData | null>(null);
  const [trajLoading, setTrajLoading] = useState(false);
  const [showTraj, setShowTraj] = useState(false);
  const [trajTarget, setTrajTarget] = useState(300);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [analyticsRes, xpRes] = await Promise.all([
          fetch("/api/analytics/diagnostic").then((r) => r.json()).catch(() => null),
          fetch("/api/gamification/profile").then((r) => r.json()).catch(() => null),
        ]);
        const hasData = analyticsRes?.hasData;
        setStats({
          predictedScore: hasData ? analyticsRes.overview.predictedJambScore : 0,
          totalTests: hasData ? analyticsRes.overview.totalTestsTaken : 0,
          accuracy: hasData ? analyticsRes.overview.overallAccuracy : 0,
          targetScore: hasData ? analyticsRes.overview.targetScore : 250,
          streak: xpRes?.streak?.currentStreak || 0,
          level: xpRes?.xp?.level || 1,
          totalXP: xpRes?.xp?.totalXP || 0,
          hasData: !!hasData,
        });
        if (hasData) setTrajTarget(analyticsRes.overview.targetScore || 300);
      } catch {
        setStats({ predictedScore: 0, totalTests: 0, accuracy: 0, targetScore: 250, streak: 0, level: 1, totalXP: 0, hasData: false });
      } finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const userImage = session?.user?.image;
  const userInitial = (session?.user?.name || session?.user?.email || "U").charAt(0).toUpperCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const getScoreColor = (s: number) => s >= 280 ? "#22c55e" : s >= 220 ? "#f59e0b" : "#ef4444";
  const getAccColor = (a: number) => a >= 70 ? "#22c55e" : a >= 50 ? "#f59e0b" : "#ef4444";
  const fmt = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const runSim = useCallback(async (adj: Record<string, number>) => {
    setSimLoading(true);
    try {
      const res = await fetch("/api/simulator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adjustments: adj }) });
      const d = await res.json();
      if (res.ok) setSimResult(d);
    } catch {} finally { setSimLoading(false); }
  }, []);

  const runTraj = useCallback(async () => {
    setTrajLoading(true);
    try {
      const res = await fetch("/api/trajectory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetScore: trajTarget }) });
      const d = await res.json();
      if (res.ok) setTrajData(d);
    } catch {} finally { setTrajLoading(false); }
  }, [trajTarget]);

  const NAV_ITEMS = [
    { label: "Learn", items: [
      { icon: BookOpen, title: "Practice CBT", href: "/practice", desc: "Past questions simulator" },
      { icon: FileText, title: "Smart Notes", href: "/notes", desc: "AI-generated study notes" },
      { icon: Sparkles, title: "Learn Feed", href: "/feed", desc: "Quick tips and tricks" },
      { icon: MessageCircle, title: "AI Tutor", href: "/tutor", desc: "Ask anything" },
      { icon: Calendar, title: "Study Plan", href: "/study", desc: "Personalized schedule" },
    ]},
    { label: "Progress", items: [
      { icon: BarChart3, title: "Analytics", href: "/analytics", desc: "Performance breakdown" },
      { icon: TrendingUp, title: "Rankings", href: "/rankings", desc: "See where you stand" },
      { icon: Brain, title: "Diagnostic", href: "/diagnostic", desc: "Full assessment" },
    ]},
    { label: "Discover", items: [
      { icon: GraduationCap, title: "Post-UTME", href: "/post-utme", desc: "University-specific prep" },
      { icon: Heart, title: "Uni Match", href: "/match", desc: "Find your best fit" },
      { icon: ClipboardList, title: "Track Admission", href: "/admission", desc: "Monitor your status" },
      { icon: Compass, title: "Career Discovery", href: "/career", desc: "Find your path" },
      { icon: GraduationCap, title: "Reality Mode", href: "/reality", desc: "Admission probability" },
      { icon: Award, title: "Scholarships", href: "/scholarships", desc: "Find funding" },
    ]},
    { label: "Community", items: [
      { icon: Trophy, title: "Rewards", href: "/rewards", desc: "XP and achievements" },
      { icon: Gift, title: "Invite Friends", href: "/referral", desc: "Earn free premium" },
      { icon: Shield, title: "Ambassador", href: "/ambassador", desc: "Represent your school" },
      { icon: Users, title: "Find a Tutor", href: "/tutors", desc: "Book a session" },
      { icon: Building2, title: "Tutorial Center", href: "/center", desc: "School portal" },
    ]},
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fafafa" }}>
      {/* ═══ Top Bar ═══ */}
      <header className="sticky top-0 z-40" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #eee" }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMobileNav(true)} className="sm:hidden flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "#666" }}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-0.5">
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "#111" }}>Jamb</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "#22c55e" }}>OS</span>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {[
              { label: "Practice", href: "/practice", icon: BookOpen },
              { label: "Notes", href: "/notes", icon: FileText },
              { label: "Analytics", href: "/analytics", icon: BarChart3 },
              { label: "Tutor", href: "/tutor", icon: MessageCircle },
            ].map(({ label, href, icon: Icon }) => (
              <button key={href} onClick={() => router.push(href)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ color: "#555" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0f0"; (e.currentTarget as HTMLElement).style.color = "#111"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#555"; }}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {stats && stats.totalXP > 0 && (
              <button onClick={() => router.push("/rewards")} className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: "#f0fdf4", border: "1px solid #dcfce7" }}>
                <Zap className="h-3 w-3" style={{ color: "#22c55e" }} />
                <span className="text-[0.625rem] font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#22c55e" }}>{stats.totalXP.toLocaleString()}</span>
              </button>
            )}
            <button onClick={() => router.push("/settings")} className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "#999" }}>
              <Settings className="h-4 w-4" />
            </button>
            <button onClick={() => router.push("/settings")}>
              {userImage ? <img src={userImage} alt="" className="h-8 w-8 rounded-full object-cover" style={{ border: "2px solid #eee" }} referrerPolicy="no-referrer" />
                : <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ background: "#f0fdf4", color: "#22c55e" }}>{userInitial}</div>}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ Mobile Slide Nav ═══ */}
      {showMobileNav && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setShowMobileNav(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-50 w-72 overflow-y-auto" style={{ background: "#fff", boxShadow: "4px 0 24px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid #eee" }}>
              <div className="flex items-center gap-0.5">
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "#111" }}>Jamb</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "#22c55e" }}>OS</span>
              </div>
              <button onClick={() => setShowMobileNav(false)} className="h-8 w-8 flex items-center justify-center rounded-lg" style={{ color: "#999" }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid #f3f3f3" }}>
              <p className="text-sm font-semibold" style={{ color: "#111" }}>{session?.user?.name || "Student"}</p>
              <p className="text-[0.625rem] mt-0.5" style={{ color: "#999" }}>{session?.user?.email}</p>
            </div>
            <div className="p-3">
              {NAV_ITEMS.map(({ label, items }) => (
                <div key={label} className="mb-3">
                  <p className="text-[0.5625rem] font-semibold uppercase tracking-widest px-2 mb-1.5" style={{ color: "#bbb" }}>{label}</p>
                  {items.map(({ icon: Icon, title, href, desc }) => (
                    <button key={href} onClick={() => { router.push(href); setShowMobileNav(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8f8f8"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <Icon className="h-4 w-4 shrink-0" style={{ color: "#888" }} />
                      <div>
                        <p className="text-sm" style={{ color: "#333" }}>{title}</p>
                        <p className="text-[0.5625rem]" style={{ color: "#aaa" }}>{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
              <div style={{ borderTop: "1px solid #f3f3f3", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
                {[
                  { icon: Settings, title: "Settings", href: "/settings" },
                  { icon: Crown, title: "Subscription", href: "/subscription" },
                ].map(({ icon: Icon, title, href }) => (
                  <button key={href} onClick={() => { router.push(href); setShowMobileNav(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left" style={{ color: "#555" }}>
                    <Icon className="h-4 w-4" style={{ color: "#aaa" }} /><span className="text-sm">{title}</span>
                  </button>
                ))}
                <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left" style={{ color: "#ef4444" }}>
                  <LogOut className="h-4 w-4" /><span className="text-sm">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ Main Content ═══ */}
      <main className="mx-auto max-w-5xl w-full px-4 sm:px-6 pt-6 pb-24 sm:pb-12 flex-1">
        <p className="text-sm mb-6" style={{ color: "#888" }}>
          {greeting}, <span style={{ color: "#111", fontWeight: 600 }}>{firstName}</span>
        </p>

        {/* Score + Daily Challenge */}
        {!loading && stats?.hasData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="sm:col-span-2 rounded-2xl p-5 flex items-center gap-5" style={{ background: "#fff", border: "1px solid #eee" }}>
              {(() => {
                const size = 88; const r = (size - 10) / 2; const circ = 2 * Math.PI * r;
                const pct = Math.min((stats.predictedScore / 400) * 100, 100);
                const offset = circ - (pct / 100) * circ;
                const color = getScoreColor(stats.predictedScore);
                return (
                  <div className="relative shrink-0">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f3f3" strokeWidth="5" />
                      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset 1s ease" }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color, lineHeight: 1 }}>{stats.predictedScore}</span>
                      <span className="text-[0.5rem]" style={{ color: "#bbb" }}>/400</span>
                    </div>
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <p className="text-[0.625rem] uppercase tracking-wider mb-3" style={{ color: "#aaa" }}>Predicted JAMB Score</p>
                <div className="flex items-center gap-5">
                  {[
                    { label: "Accuracy", value: `${stats.accuracy}%`, color: getAccColor(stats.accuracy) },
                    { label: "Streak", value: `${stats.streak} days`, color: "#f59e0b" },
                    { label: "Level", value: `${stats.level}`, color: "#8b5cf6" },
                  ].map(({ label, value, color }, i) => (
                    <div key={label} className="flex items-center gap-5">
                      {i > 0 && <div style={{ width: "1px", height: "24px", background: "#eee" }} />}
                      <div>
                        <p className="text-[0.625rem]" style={{ color: "#aaa" }}>{label}</p>
                        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[0.5625rem] mb-1">
                    <span style={{ color: "#bbb" }}>Target: {stats.targetScore}</span>
                    <span style={{ color: getScoreColor(stats.predictedScore) }}>
                      {stats.predictedScore >= stats.targetScore ? "On track" : `${stats.targetScore - stats.predictedScore} points to go`}
                    </span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "9999px", background: "#f3f3f3" }}>
                    <div style={{ width: `${Math.min((stats.predictedScore / stats.targetScore) * 100, 100)}%`, height: "100%", borderRadius: "9999px", background: getScoreColor(stats.predictedScore), transition: "width 1s" }} />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => router.push("/challenge")} className="rounded-2xl p-5 text-left transition-all flex flex-col justify-between"
              style={{ background: "#111" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#1a1a1a"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#111"; }}>
              <Play className="h-5 w-5 mb-3" style={{ color: "#22c55e" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#fff" }}>Daily Challenge</p>
                <p className="text-[0.625rem] mt-0.5" style={{ color: "#888" }}>7 questions. Compete nationally.</p>
              </div>
              <ChevronRight className="h-4 w-4 mt-3" style={{ color: "#555" }} />
            </button>
          </div>
        )}

        {/* No Data CTA */}
        {!loading && !stats?.hasData && (
          <button onClick={() => router.push("/diagnostic")} className="w-full rounded-2xl p-6 mb-6 text-left" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: "#f0fdf4" }}>
                <Brain className="h-6 w-6" style={{ color: "#22c55e" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "#111" }}>Take your diagnostic test</p>
                <p className="text-xs mt-0.5" style={{ color: "#999" }}>40 questions, 30 minutes — find out where you stand</p>
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0" style={{ color: "#22c55e" }} />
            </div>
          </button>
        )}

        {/* Simulator + Trajectory */}
        {stats?.hasData && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => { setShowSim(!showSim); if (!showSim && !simResult) runSim({}); setShowTraj(false); }}
              className="rounded-2xl p-4 text-left transition-all"
              style={{ background: showSim ? "#f0fdf4" : "#fff", border: `1px solid ${showSim ? "#bbf7d0" : "#eee"}` }}>
              <TrendingUp className="h-4 w-4 mb-2" style={{ color: "#22c55e" }} />
              <p className="text-sm font-semibold" style={{ color: "#111" }}>What If?</p>
              <p className="text-[0.625rem]" style={{ color: "#999" }}>Simulate score changes</p>
            </button>
            <button onClick={() => { setShowTraj(!showTraj); if (!showTraj && !trajData) runTraj(); setShowSim(false); }}
              className="rounded-2xl p-4 text-left transition-all"
              style={{ background: showTraj ? "#fffbeb" : "#fff", border: `1px solid ${showTraj ? "#fde68a" : "#eee"}` }}>
              <Target className="h-4 w-4 mb-2" style={{ color: "#f59e0b" }} />
              <p className="text-sm font-semibold" style={{ color: "#111" }}>Road to {trajTarget}+</p>
              <p className="text-[0.625rem]" style={{ color: "#999" }}>Weekly roadmap</p>
            </button>
          </div>
        )}

        {/* Inline Simulator */}
        {showSim && (
          <div className="rounded-2xl mb-6 p-5" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>Score Simulator</p>
              <button onClick={() => { setSimAdjustments({}); runSim({}); }} className="flex items-center gap-1 text-[0.625rem]" style={{ color: "#999" }}><RotateCcw className="h-3 w-3" /> Reset</button>
            </div>
            {simLoading && !simResult ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "#22c55e" }} /></div>
            ) : simResult && (
              <>
                <div className="flex items-center justify-center gap-6 mb-5">
                  <div className="text-center">
                    <p className="text-[0.5625rem]" style={{ color: "#bbb" }}>Current</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", lineHeight: 1, color: "#ccc" }}>{simResult.currentPredicted}</p>
                  </div>
                  {simResult.totalImprovement > 0 && <p className="text-sm font-bold" style={{ color: "#22c55e" }}>+{simResult.totalImprovement}</p>}
                  <div className="text-center">
                    <p className="text-[0.5625rem]" style={{ color: "#bbb" }}>Projected</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", lineHeight: 1, color: getScoreColor(simResult.adjustedPredicted) }}>{simResult.adjustedPredicted}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {simResult.subjects.map((subj) => (
                    <div key={subj.subject}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: "#555" }}>{fmt(subj.subject)}</span>
                        <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: (simAdjustments[subj.subject] || 0) > 0 ? "#22c55e" : "#bbb" }}>
                          {subj.currentAccuracy}%{(simAdjustments[subj.subject] || 0) > 0 && ` → ${subj.adjustedAccuracy}%`}
                        </span>
                      </div>
                      <input type="range" min={0} max={Math.min(50, 100 - subj.currentAccuracy)} value={simAdjustments[subj.subject] || 0}
                        onChange={(e) => { const adj = { ...simAdjustments, [subj.subject]: parseInt(e.target.value) }; setSimAdjustments(adj); runSim(adj); }}
                        className="w-full accent-green-500" style={{ height: "4px" }} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Inline Trajectory */}
        {showTraj && (
          <div className="rounded-2xl mb-6 p-5" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>Road to {trajTarget}+</p>
              <div className="flex gap-1">
                {[250, 280, 300, 320, 350].map((t) => (
                  <button key={t} onClick={() => { setTrajTarget(t); setTimeout(runTraj, 50); }}
                    className="rounded-md px-2 py-0.5 text-[0.5625rem] font-semibold" style={{ background: trajTarget === t ? "#fef3c7" : "transparent", color: trajTarget === t ? "#f59e0b" : "#ccc" }}>{t}</button>
                ))}
              </div>
            </div>
            {trajLoading && !trajData ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "#f59e0b" }} /></div>
            ) : trajData && (
              <>
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-[0.5625rem]" style={{ color: "#bbb" }}>Now</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", lineHeight: 1, color: getScoreColor(trajData.currentScore) }}>{trajData.currentScore}</p>
                  </div>
                  <TrendingUp className="h-4 w-4" style={{ color: "#f59e0b" }} />
                  <div className="text-center">
                    <p className="text-[0.5625rem]" style={{ color: "#bbb" }}>Target</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", lineHeight: 1, color: "#22c55e" }}>{trajData.targetScore}</p>
                  </div>
                </div>
                <p className="text-xs text-center mb-4" style={{ color: "#999" }}>
                  {trajData.gap > 0 ? `${trajData.gap} points to close in ~${trajData.weeksNeeded} weeks` : "You are at your target"}
                </p>
                <div className="space-y-2 mb-4">
                  {trajData.subjectBreakdown.sort((a, b) => b.gap - a.gap).slice(0, 4).map((s) => (
                    <div key={s.subject} className="flex items-center gap-3">
                      <span className="text-[0.625rem] w-20 truncate" style={{ color: "#777" }}>{fmt(s.subject)}</span>
                      <div className="flex-1" style={{ height: "4px", borderRadius: "9999px", background: "#f3f3f3" }}>
                        <div style={{ width: `${s.accuracy}%`, height: "100%", borderRadius: "9999px", background: s.gap > 10 ? "#ef4444" : s.gap > 0 ? "#f59e0b" : "#22c55e" }} />
                      </div>
                      <span className="text-[0.5625rem] font-semibold w-8 text-right" style={{ fontFamily: "var(--font-mono)", color: "#aaa" }}>{s.accuracy}%</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {trajData.milestones.slice(0, 3).map((m) => (
                    <div key={m.week} className="flex items-center gap-2 rounded-lg p-2" style={{ background: "#fafafa" }}>
                      <span className="flex h-6 w-6 items-center justify-center rounded text-[0.5625rem] font-bold" style={{ fontFamily: "var(--font-mono)", background: "#fef3c7", color: "#f59e0b" }}>W{m.week}</span>
                      <span className="text-xs flex-1" style={{ color: "#666" }}>{fmt(m.focus)} focus</span>
                      <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: getScoreColor(m.expectedScore) }}>{m.expectedScore}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push("/trajectory")} className="text-xs font-semibold mt-3 w-full text-center" style={{ color: "#f59e0b" }}>View full roadmap →</button>
              </>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: BookOpen, title: "Practice", sub: "CBT Simulator", href: "/practice", accent: "#22c55e", bg: "#f0fdf4" },
            { icon: Calendar, title: "Study Plan", sub: "Today's tasks", href: "/study", accent: "#f59e0b", bg: "#fffbeb" },
            { icon: MessageCircle, title: "AI Tutor", sub: "Ask anything", href: "/tutor", accent: "#8b5cf6", bg: "#f5f3ff" },
            { icon: FileText, title: "Smart Notes", sub: "AI study notes", href: "/notes", accent: "#3b82f6", bg: "#eff6ff" },
          ].map(({ icon: Icon, title, sub, href, accent, bg }) => (
            <button key={href} onClick={() => router.push(href)} className="rounded-2xl p-4 text-left transition-all"
              style={{ background: "#fff", border: "1px solid #eee" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = bg; (e.currentTarget as HTMLElement).style.borderColor = `${accent}30`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#eee"; }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl mb-3" style={{ background: bg }}>
                <Icon className="h-4 w-4" style={{ color: accent }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "#111" }}>{title}</p>
              <p className="text-[0.625rem] mt-0.5" style={{ color: "#aaa" }}>{sub}</p>
            </button>
          ))}
        </div>

        {/* Feature Lists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            {[
              { label: "PROGRESS", items: [
                { icon: BarChart3, title: "Analytics", href: "/analytics", color: "#8b5cf6" },
                { icon: TrendingUp, title: "Rankings", href: "/rankings", color: "#3b82f6" },
                { icon: GraduationCap, title: "Reality Mode", href: "/reality", color: "#f59e0b" },
                { icon: Compass, title: "Career Discovery", href: "/career", color: "#22c55e" },
                { icon: Brain, title: "Diagnostic Test", href: "/diagnostic", color: "#3b82f6" },
              ]},
              { label: "AFTER JAMB", items: [
                { icon: GraduationCap, title: "Post-UTME Prep", href: "/post-utme", color: "#ec4899" },
                { icon: Heart, title: "Uni Match", href: "/match", color: "#f43f5e" },
                { icon: ClipboardList, title: "Track Admission", href: "/admission", color: "#3b82f6" },
                { icon: Award, title: "Scholarships", href: "/scholarships", color: "#f59e0b" },
              ]},
            ].map(({ label, items }) => (
              <div key={label} className="mb-5">
                <p className="text-[0.5625rem] font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: "#ccc" }}>{label}</p>
                <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #eee" }}>
                  {items.map(({ icon: Icon, title, href, color }, i) => (
                    <button key={href} onClick={() => router.push(href)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                      style={{ borderTop: i > 0 ? "1px solid #f5f5f5" : "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                      <span className="flex-1 text-sm" style={{ color: "#333" }}>{title}</span>
                      <ChevronRight className="h-3.5 w-3.5" style={{ color: "#ddd" }} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            {[
              { label: "REWARDS", items: [
                { icon: Trophy, title: "Rewards & Missions", href: "/rewards", color: "#f59e0b" },
                { icon: Gift, title: "Invite Friends", href: "/referral", color: "#8b5cf6" },
                { icon: Crown, title: "Subscription", href: "/subscription", color: "#f59e0b" },
              ]},
              { label: "COMMUNITY", items: [
                { icon: Users, title: "Find a Tutor", href: "/tutors", color: "#f59e0b" },
                { icon: Shield, title: "Ambassador", href: "/ambassador", color: "#22c55e" },
                { icon: Building2, title: "Tutorial Center", href: "/center", color: "#3b82f6" },
              ]},
            ].map(({ label, items }) => (
              <div key={label} className="mb-5">
                <p className="text-[0.5625rem] font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: "#ccc" }}>{label}</p>
                <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #eee" }}>
                  {items.map(({ icon: Icon, title, href, color }, i) => (
                    <button key={href} onClick={() => router.push(href)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                      style={{ borderTop: i > 0 ? "1px solid #f5f5f5" : "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                      <span className="flex-1 text-sm" style={{ color: "#333" }}>{title}</span>
                      <ChevronRight className="h-3.5 w-3.5" style={{ color: "#ddd" }} />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              {[
                { icon: Clock, title: "Revision Timetable", href: "/study/schedule", color: "#3b82f6" },
                { icon: Sparkles, title: "Learn Feed", href: "/feed", color: "#22c55e" },
              ].map(({ icon: Icon, title, href, color }) => (
                <button key={href} onClick={() => router.push(href)} className="flex w-full items-center gap-3 py-2 text-left">
                  <Icon className="h-4 w-4" style={{ color }} />
                  <span className="text-sm" style={{ color: "#333" }}>{title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ═══ Footer ═══ */}
      <div className="hidden sm:block">
        <Footer />
      </div>

      {/* ═══ Mobile Bottom Tab Bar ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid #eee" }}>
        <div className="flex items-center justify-around py-1.5 px-2">
          {[
            { icon: Home, label: "Home", href: "/dashboard" },
            { icon: BookOpen, label: "Practice", href: "/practice" },
            { icon: MessageCircle, label: "Tutor", href: "/tutor" },
            { icon: BarChart3, label: "Progress", href: "/analytics" },
            { icon: User, label: "Profile", href: "/settings" },
          ].map(({ icon: Icon, label, href }) => {
            const isActive = href === "/dashboard";
            return (
              <button key={href} onClick={() => router.push(href)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors"
                style={{ color: isActive ? "#22c55e" : "#bbb" }}>
                <Icon className="h-5 w-5" />
                <span className="text-[0.5rem] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}