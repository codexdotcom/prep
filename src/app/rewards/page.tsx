"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trophy,
  Flame,
  Star,
  Target,
  Zap,
  Crown,
  Medal,
  ChevronRight,
  Loader2,
  Lock,
  CheckCircle2,
  Gift,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface GamificationData {
  xp: {
    total: number;
    weekly: number;
    monthly: number;
    level: number;
    current: number;
    required: number;
    percentage: number;
  };
  streak: { current: number; longest: number; totalDays: number };
  missions: Array<{
    id: string;
    missionType: string;
    title: string;
    description: string;
    target: number;
    progress: number;
    xpReward: number;
    status: string;
  }>;
  achievements: Array<{
    key: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    xpReward: number;
    unlockedAt: string;
  }>;
  newAchievements: Array<{
    key: string;
    title: string;
    icon: string;
    xpReward: number;
  }>;
}

export default function RewardsPage() {
  const router = useRouter();
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewAchievement, setShowNewAchievement] = useState<typeof data extends null ? never : NonNullable<typeof data>["newAchievements"][0] | null>(null);
  const [activeTab, setActiveTab] = useState<"missions" | "achievements" | "leaderboard">("missions");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/gamification/profile");
        const d = await res.json();
        if (res.ok) {
          setData(d);
          if (d.newAchievements?.length > 0) {
            setShowNewAchievement(d.newAchievements[0]);
          }
        }
      } catch {
        console.error("Failed to load gamification data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
      </div>
    );
  }

  if (!data) return null;

  const { xp, streak, missions } = data;

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      {/* Achievement unlock popup */}
      {showNewAchievement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowNewAchievement(null)}
        >
          <div
            className="text-center p-8 rounded-2xl max-w-xs w-full"
            style={{
              background: "var(--color-surface-card)",
              border: "1px solid var(--color-surface-border)",
              boxShadow: "var(--shadow-glow-lg)",
              animation: "var(--animate-scale-in)",
            }}
          >
            <div className="text-5xl mb-4">{showNewAchievement.icon}</div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-accent-green)" }}>
              Achievement Unlocked!
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              {showNewAchievement.title}
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--color-accent-green)" }}>
              +{showNewAchievement.xpReward} XP
            </p>
            <p className="mt-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
              Tap anywhere to dismiss
            </p>
          </div>
        </div>
      )}

      {/* Header */}
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
            <Trophy className="h-4 w-4" style={{ color: "var(--color-warning-400)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Rewards</span>
          </div>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* XP + Level card */}
        <div className="card mb-6 p-5" style={{ boxShadow: "var(--shadow-glow)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-accent-green)" }}>
                Level {xp.level}
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-text-primary)", lineHeight: 1.2 }}>
                {xp.total.toLocaleString()} XP
              </p>
            </div>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "rgba(34, 197, 94, 0.1)" }}
            >
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-accent-green)" }}>
                {xp.level}
              </span>
            </div>
          </div>

          {/* XP progress bar */}
          <div className="mb-2">
            <div className="progress-track" style={{ height: "10px" }}>
              <div
                className="progress-fill"
                style={{
                  width: `${xp.percentage}%`,
                  background: "linear-gradient(90deg, var(--color-accent-dim), var(--color-accent-green))",
                }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[0.625rem]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
            <span>{xp.current} / {xp.required}</span>
            <span>Level {xp.level + 1}</span>
          </div>

          {/* Weekly / Streak row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
            <div className="text-center">
              <Zap className="mx-auto mb-1 h-4 w-4" style={{ color: "var(--color-info-400)" }} />
              <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                {xp.weekly}
              </p>
              <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>This week</p>
            </div>
            <div className="text-center">
              <Flame className="mx-auto mb-1 h-4 w-4" style={{ color: "var(--color-warning-400)" }} />
              <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                {streak.current}
              </p>
              <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>Day streak</p>
            </div>
            <div className="text-center">
              <Star className="mx-auto mb-1 h-4 w-4" style={{ color: "var(--color-tier-elite)" }} />
              <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                {streak.longest}
              </p>
              <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>Best streak</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "var(--color-surface-light)" }}>
          {(["missions", "achievements", "leaderboard"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all capitalize"
              style={{
                background: activeTab === tab ? "var(--color-surface-card)" : "transparent",
                color: activeTab === tab ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                boxShadow: activeTab === tab ? "var(--shadow-card)" : "none",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Missions tab */}
        {activeTab === "missions" && (
          <div className="space-y-2">
            {missions.length === 0 ? (
              <div className="card text-center py-8">
                <Gift className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                  No missions today. Check back tomorrow!
                </p>
              </div>
            ) : (
              missions.map((mission) => {
                const isCompleted = mission.status === "COMPLETED";
                const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));

                return (
                  <div
                    key={mission.id}
                    className="card p-4"
                    style={{ opacity: isCompleted ? 0.6 : 1 }}
                  >
                    <div className="flex items-start gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-accent-green)" }} />
                      ) : (
                        <Target className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-warning-400)" }} />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p
                            className="text-sm font-semibold"
                            style={{
                              color: "var(--color-text-primary)",
                              textDecoration: isCompleted ? "line-through" : "none",
                            }}
                          >
                            {mission.title}
                          </p>
                          <span
                            className="text-xs font-semibold"
                            style={{
                              fontFamily: "var(--font-mono)",
                              color: "var(--color-accent-green)",
                            }}
                          >
                            +{mission.xpReward} XP
                          </span>
                        </div>
                        <p className="text-xs mb-2" style={{ color: "var(--color-text-tertiary)" }}>
                          {mission.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 progress-track" style={{ height: "6px" }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${pct}%`,
                                background: isCompleted ? "var(--color-accent-green)" : "var(--color-warning-400)",
                              }}
                            />
                          </div>
                          <span
                            className="text-[0.625rem] font-semibold shrink-0"
                            style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                          >
                            {mission.progress}/{mission.target}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Achievements tab */}
        {activeTab === "achievements" && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {data.achievements.map((a) => (
              <div
                key={a.key}
                className="card p-3 text-center"
                style={{ boxShadow: "none" }}
              >
                <div className="text-2xl mb-1">{a.icon}</div>
                <p
                  className="text-[0.6875rem] font-semibold leading-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {a.title}
                </p>
                <p
                  className="text-[0.5625rem] mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {a.description}
                </p>
              </div>
            ))}

            {data.achievements.length === 0 && (
              <div className="col-span-full card text-center py-8">
                <Lock className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                  No achievements yet. Start practicing to unlock them!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard tab */}
        {activeTab === "leaderboard" && <LeaderboardView />}

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

function LeaderboardView() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [period, setPeriod] = useState<"WEEKLY" | "MONTHLY" | "ALL_TIME">("WEEKLY");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/gamification/leaderboard?period=${period}`);
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch {
        console.error("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  const RANK_ICONS = ["👑", "🥈", "🥉"];

  return (
    <div>
      {/* Period selector */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: "var(--color-surface-lighter)" }}>
        {(["WEEKLY", "MONTHLY", "ALL_TIME"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="flex-1 rounded-md py-1.5 text-[0.6875rem] font-semibold transition-all"
            style={{
              background: period === p ? "var(--color-surface-card)" : "transparent",
              color: period === p ? "var(--color-text-primary)" : "var(--color-text-muted)",
            }}
          >
            {p === "ALL_TIME" ? "All Time" : p.charAt(0) + p.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="card text-center py-8">
          <Crown className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            No entries yet. Be the first on the board!
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {leaderboard.map((entry) => (
            <div
              key={entry.userId}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{
                background: entry.isCurrentUser ? "rgba(34, 197, 94, 0.06)" : "var(--color-surface-card)",
                border: `1px solid ${entry.isCurrentUser ? "rgba(34, 197, 94, 0.2)" : "var(--color-surface-border)"}`,
              }}
            >
              {/* Rank */}
              <div className="w-8 text-center shrink-0">
                {entry.rank <= 3 ? (
                  <span className="text-lg">{RANK_ICONS[entry.rank - 1]}</span>
                ) : (
                  <span
                    className="text-sm font-bold"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                  >
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div
                  className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: entry.image ? "transparent" : "var(--color-surface-lighter)",
                    color: "var(--color-text-tertiary)",
                    overflow: "hidden",
                  }}
                >
                  {entry.image ? (
                    <img src={entry.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    entry.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{
                      color: entry.isCurrentUser ? "var(--color-accent-green)" : "var(--color-text-primary)",
                    }}
                  >
                    {entry.name} {entry.isCurrentUser && "(You)"}
                  </p>
                  {entry.level && (
                    <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>
                      Level {entry.level}
                    </p>
                  )}
                </div>
              </div>

              {/* Score */}
              <span
                className="text-sm font-bold shrink-0"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}
              >
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}