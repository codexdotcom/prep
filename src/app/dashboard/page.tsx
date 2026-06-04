"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Brain,
  BookOpen,
  BarChart3,
  Target,
  Zap,
  LogOut,
  ChevronRight,
  Trophy,
  Flame,
  Calendar,
  Database,
  Crown,
  GraduationCap,
  Gift,
  Settings,
  User,
  Star,
  TrendingUp,
  MessageCircle,
  Sparkles,
  ArrowUpRight,
  Play,
  Clock,
} from "lucide-react";

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

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
      } catch {
        setStats({
          predictedScore: 0, totalTests: 0, accuracy: 0, targetScore: 250,
          streak: 0, level: 1, totalXP: 0, hasData: false,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const userImage = session?.user?.image;
  const userInitial = (session?.user?.name || session?.user?.email || "U").charAt(0).toUpperCase();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const getScoreColor = (score: number) => {
    if (score >= 280) return "var(--color-accent-green)";
    if (score >= 220) return "var(--color-warning-400)";
    return "var(--color-danger-400)";
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 70) return "var(--color-accent-green)";
    if (acc >= 50) return "var(--color-warning-400)";
    return "var(--color-danger-400)";
  };

  // Score ring SVG
  const ScoreRing = ({ score, target }: { score: number; target: number }) => {
    const pct = Math.min((score / target) * 100, 100);
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    const color = getScoreColor(score);

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width="92" height="92" viewBox="0 0 92 92">
          <circle cx="46" cy="46" r={radius} fill="none" stroke="var(--color-surface-border)" strokeWidth="5" />
          <circle
            cx="46" cy="46" r={radius} fill="none"
            stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            transform="rotate(-90 46 46)"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", color, lineHeight: 1 }}>
            {score}
          </span>
          <span className="text-[0.5rem] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            /{target}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: "var(--color-surface)" }}>
      {/* ═══ Header ═══ */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(10, 31, 10, 0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--color-surface-border)",
        }}
      >
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--color-text-primary)" }}>
              Prep
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--color-accent-green)" }}>
              Genius
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* XP badge */}
            {stats && stats.totalXP > 0 && (
              <button
                onClick={() => router.push("/rewards")}
                className="flex items-center gap-1 rounded-full px-2 py-1 transition-all"
                style={{
                  background: "rgba(34, 197, 94, 0.08)",
                  border: "1px solid rgba(34, 197, 94, 0.15)",
                }}
              >
                <Zap className="h-2.5 w-2.5" style={{ color: "var(--color-accent-green)" }} />
                <span className="text-[0.5625rem] font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}>
                  {stats.totalXP.toLocaleString()}
                </span>
              </button>
            )}

            {/* Settings */}
            <button
              onClick={() => router.push("/settings")}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Avatar */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center"
              >
                {userImage ? (
                  <img
                    src={userImage}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                    style={{ border: "2px solid var(--color-surface-border)" }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[0.625rem] font-bold"
                    style={{
                      background: "rgba(34, 197, 94, 0.1)",
                      color: "var(--color-accent-green)",
                    }}
                  >
                    {userInitial}
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div
                    className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl overflow-hidden"
                    style={{
                      background: "var(--color-surface-card)",
                      border: "1px solid var(--color-surface-border)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                      animation: "var(--animate-scale-in)",
                    }}
                  >
                    <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--color-surface-border)" }}>
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                        {session?.user?.name || "Student"}
                      </p>
                      <p className="text-[0.5625rem] truncate mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {session?.user?.email}
                      </p>
                    </div>

                    {[
                      { icon: User, label: "Edit Profile", href: "/settings" },
                      { icon: Crown, label: "Subscription", href: "/subscription" },
                    ].map(({ icon: Icon, label, href }) => (
                      <button
                        key={label}
                        onClick={() => { setShowProfileMenu(false); router.push(href); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors"
                        style={{ color: "var(--color-text-secondary)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface-lighter)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: "var(--color-text-muted)" }} />
                        {label}
                      </button>
                    ))}

                    <div style={{ borderTop: "1px solid var(--color-surface-border)" }}>
                      <button
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors"
                        style={{ color: "var(--color-danger-400)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.04)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* ═══ Greeting ═══ */}
        <p className="text-sm mb-5" style={{ color: "var(--color-text-tertiary)" }}>
          {greeting}, <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{firstName}</span>
        </p>

        {/* ═══ Score Card (if data) ═══ */}
        {!loading && stats?.hasData && (
          <div
            className="rounded-2xl p-4 mb-5 flex items-center gap-5"
            style={{
              background: "var(--color-surface-card)",
              border: "1px solid var(--color-surface-border)",
            }}
          >
            <ScoreRing score={stats.predictedScore} target={400} />

            <div className="flex-1 min-w-0">
              <p className="text-[0.625rem] uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                Predicted JAMB Score
              </p>

              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Accuracy</p>
                  <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: getAccuracyColor(stats.accuracy) }}>
                    {stats.accuracy}%
                  </p>
                </div>
                <div style={{ width: "1px", height: "24px", background: "var(--color-surface-border)" }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Streak</p>
                  <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-warning-400)" }}>
                    {stats.streak}d
                  </p>
                </div>
                <div style={{ width: "1px", height: "24px", background: "var(--color-surface-border)" }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Level</p>
                  <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-tier-elite)" }}>
                    {stats.level}
                  </p>
                </div>
              </div>

              {/* Target bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[0.5625rem] mb-1">
                  <span style={{ color: "var(--color-text-muted)" }}>Target: {stats.targetScore}</span>
                  <span style={{ color: getScoreColor(stats.predictedScore) }}>
                    {stats.predictedScore >= stats.targetScore ? "On track" : `${stats.targetScore - stats.predictedScore} to go`}
                  </span>
                </div>
                <div style={{ height: "3px", borderRadius: "9999px", background: "var(--color-surface-lighter)" }}>
                  <div
                    style={{
                      width: `${Math.min((stats.predictedScore / stats.targetScore) * 100, 100)}%`,
                      height: "100%",
                      borderRadius: "9999px",
                      background: getScoreColor(stats.predictedScore),
                      transition: "width 1s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ No Data — First Time ═══ */}
        {!loading && !stats?.hasData && (
          <button
            onClick={() => router.push("/diagnostic")}
            className="w-full rounded-2xl p-5 mb-5 text-left transition-all"
            style={{
              background: "rgba(34, 197, 94, 0.04)",
              border: "1px solid rgba(34, 197, 94, 0.12)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34, 197, 94, 0.3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34, 197, 94, 0.12)"; }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(34, 197, 94, 0.1)" }}
              >
                <Brain className="h-6 w-6" style={{ color: "var(--color-accent-green)" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  Take your diagnostic test
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                  40 questions. 30 minutes. We map your strengths so you study smarter.
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: "var(--color-accent-green)" }} />
            </div>
          </button>
        )}

        {/* ═══ Daily Challenge Banner ═══ */}
        <button
          onClick={() => router.push("/challenge")}
          className="w-full rounded-xl p-3.5 mb-5 text-left transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)",
            border: "1px solid rgba(34, 197, 94, 0.15)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34, 197, 94, 0.35)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34, 197, 94, 0.15)"; }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "rgba(34, 197, 94, 0.12)" }}
            >
              <Play className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: "var(--color-accent-green)" }}>
                Daily Challenge
              </p>
              <p className="text-[0.625rem]" style={{ color: "var(--color-text-tertiary)" }}>
                7 questions. Compete for today's leaderboard.
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-accent-green)" }} />
          </div>
        </button>

        {/* ═══ Quick Grid (2x2) ═══ */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {[
            { icon: BookOpen, title: "Practice", sub: "CBT Simulator", href: "/practice", color: "#22c55e" },
            { icon: Calendar, title: "Study Plan", sub: "Today's tasks", href: "/study", color: "#f59e0b" },
            { icon: Sparkles, title: "Learn Feed", sub: "Tips & tricks", href: "/feed", color: "#60a5fa" },
            { icon: MessageCircle, title: "AI Tutor", sub: "Ask anything", href: "/tutor", color: "#a78bfa" },
          ].map(({ icon: Icon, title, sub, href, color }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="rounded-xl p-3.5 text-left transition-all"
              style={{
                background: "var(--color-surface-card)",
                border: "1px solid var(--color-surface-border)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-surface-border)";
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
            >
              <Icon className="h-5 w-5 mb-2" style={{ color }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {title}
              </p>
              <p className="text-[0.625rem] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {sub}
              </p>
            </button>
          ))}
        </div>

        {/* ═══ Progress & Insights ═══ */}
        <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
          Progress
        </p>
        <div className="space-y-1.5 mb-5">
          {[
            { icon: BarChart3, title: "Analytics", href: "/analytics", color: "#a78bfa" },
            { icon: GraduationCap, title: "Reality Mode", href: "/reality", color: "#f59e0b" },
            { icon: TrendingUp, title: "Rankings", href: "/rankings", color: "#60a5fa" },
            { icon: Brain, title: "Diagnostic", href: "/diagnostic", color: "#22c55e" },
          ].map(({ icon: Icon, title, href, color }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface-card)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
              <span className="flex-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{title}</span>
              <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--color-surface-border)" }} />
            </button>
          ))}
        </div>

        {/* ═══ Social ═══ */}
        <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
          Rewards & Social
        </p>
        <div className="space-y-1.5 mb-5">
          {[
            { icon: Trophy, title: "Rewards & Missions", href: "/rewards", color: "#f59e0b" },
            { icon: Gift, title: "Invite Friends", href: "/referral", color: "#a78bfa" },
           
          ].map(({ icon: Icon, title, href, color }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface-card)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
              <span className="flex-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{title}</span>
              <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--color-surface-border)" }} />
            </button>
          ))}
        </div>

        {/* ═══ Revision Schedule (compact) ═══ */}
        <button
          onClick={() => router.push("/study/schedule")}
          className="w-full rounded-xl p-3.5 mb-5 text-left transition-all"
          style={{
            background: "var(--color-surface-card)",
            border: "1px solid var(--color-surface-border)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(59, 130, 246, 0.3)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-surface-border)"; }}
        >
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4" style={{ color: "var(--color-info-400)" }} />
            <span className="flex-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Revision Timetable</span>
            <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--color-surface-border)" }} />
          </div>
        </button>

      

        {/* ═══ Footer ═══ */}
        <footer className="pt-4 pb-2 text-center" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
          <div className="flex items-center justify-center gap-3 text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
            <a href="/privacy" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Privacy</a>
            <span style={{ opacity: 0.3 }}>|</span>
            <a href="/terms" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Terms</a>
          </div>
        </footer>
      </div>
    </div>
  );
}