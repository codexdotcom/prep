"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trophy,
  MapPin,
  GraduationCap,
  Globe,
  BookOpen,
  Share2,
  Loader2,
  Crown,
  Medal,
  ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useShare } from "@/hooks/use-share";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";

interface RankingEntry {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  score: number;
  level?: number;
  state?: string | null;
  school?: string | null;
  isCurrentUser?: boolean;
  questionsAnswered?: number;
}

interface RankingsData {
  rankings: RankingEntry[];
  myRank: number | null;
  myScore: number;
  myLevel?: number;
  percentile: number | null;
  totalRanked: number;
  type: string;
  label: string;
  subject?: string;
  userState?: string | null;
  userSchool?: string | null;
}

const RANK_ICONS = ["👑", "🥈", "🥉"];

const TABS = [
  { key: "national", label: "National", icon: Globe },
  { key: "state", label: "State", icon: MapPin },
  { key: "school", label: "School", icon: GraduationCap },
  { key: "subject", label: "Subject", icon: BookOpen },
];

export default function RankingsPage() {
  const router = useRouter();
  const { shareCard, sharing } = useShare();
  const [data, setData] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("national");
  const [selectedSubject, setSelectedSubject] = useState("MATHEMATICS");

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: activeTab });
      if (activeTab === "subject") params.set("subject", selectedSubject);

      const res = await fetch(`/api/rankings?${params}`);
      const d = await res.json();
      if (res.ok) setData(d);
    } catch {
      console.error("Failed to load rankings");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedSubject]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
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
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Rankings
            </span>
          </div>
          <button
            onClick={() => shareCard({ type: "rank" })}
            disabled={sharing}
            className="btn-ghost"
          >
            <Share2 className={`h-4 w-4 ${sharing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* My rank card */}
        {data && data.myRank && (
          <div
            className="card mb-6 p-5 text-center"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
              Your {data.label} Rank
            </p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "3rem",
                lineHeight: 1,
                color: "var(--color-accent-green)",
              }}
            >
              #{data.myRank}
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--color-text-tertiary)" }}>
              out of {data.totalRanked.toLocaleString()} students
              {data.percentile !== null && (
                <span style={{ color: "var(--color-accent-green)" }}>
                  {" "}· Top {100 - data.percentile}%
                </span>
              )}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-1 mb-4 p-1 rounded-xl overflow-x-auto"
          style={{ background: "var(--color-surface-light)" }}
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 shrink-0 flex-1 justify-center rounded-lg py-2 text-xs font-semibold transition-all"
              style={{
                background: activeTab === key ? "var(--color-surface-card)" : "transparent",
                color: activeTab === key ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                boxShadow: activeTab === key ? "var(--shadow-card)" : "none",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Subject selector (when subject tab) */}
        {activeTab === "subject" && (
          <div className="flex flex-wrap gap-1.5 mb-4" style={{ animation: "var(--animate-fade-in)" }}>
            {JAMB_SUBJECTS.slice(0, 10).map((subj) => (
              <button
                key={subj.value}
                onClick={() => setSelectedSubject(subj.value)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: selectedSubject === subj.value ? "rgba(34,197,94,0.1)" : "var(--color-surface-light)",
                  border: `1px solid ${selectedSubject === subj.value ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                  color: selectedSubject === subj.value ? "var(--color-accent-green)" : "var(--color-text-tertiary)",
                }}
              >
                {subj.label}
              </button>
            ))}
          </div>
        )}

        {/* No state/school info notice */}
        {activeTab === "state" && data && !data.userState && (
          <div
            className="rounded-xl p-4 mb-4 text-sm text-center"
            style={{
              background: "rgba(245,158,11,0.05)",
              border: "1px solid rgba(245,158,11,0.15)",
              color: "var(--color-warning-400)",
            }}
          >
            Add your state in your profile to see state rankings.
          </div>
        )}

        {activeTab === "school" && data && !data.userSchool && (
          <div
            className="rounded-xl p-4 mb-4 text-sm text-center"
            style={{
              background: "rgba(245,158,11,0.05)",
              border: "1px solid rgba(245,158,11,0.15)",
              color: "var(--color-warning-400)",
            }}
          >
            Add your school name in your profile to see school rankings.
          </div>
        )}

        {/* Rankings list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} />
          </div>
        ) : !data || data.rankings.length === 0 ? (
          <div className="card text-center py-12">
            <Crown className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              {activeTab === "subject"
                ? "Not enough students have answered 10+ questions in this subject yet."
                : "No rankings available yet. Start practicing to get on the board!"}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Top 3 podium */}
            {data.rankings.length >= 3 && activeTab !== "subject" && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 0, 2].map((podiumIndex) => {
                  const entry = data.rankings[podiumIndex];
                  if (!entry) return null;

                  const isFirst = podiumIndex === 0;

                  return (
                    <div
                      key={entry.userId}
                      className="rounded-xl p-3 text-center"
                      style={{
                        background: entry.isCurrentUser
                          ? "rgba(34,197,94,0.06)"
                          : "var(--color-surface-card)",
                        border: `1px solid ${
                          entry.isCurrentUser
                            ? "rgba(34,197,94,0.2)"
                            : "var(--color-surface-border)"
                        }`,
                        marginTop: isFirst ? "0" : "1rem",
                      }}
                    >
                      <div className="text-2xl mb-1">{RANK_ICONS[entry.rank - 1]}</div>
                      <div
                        className="mx-auto mb-2 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
                        style={{
                          background: entry.image ? "transparent" : "var(--color-surface-lighter)",
                          color: "var(--color-text-tertiary)",
                        }}
                      >
                        {entry.image ? (
                          <img src={entry.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          entry.name.charAt(0)
                        )}
                      </div>
                      <p
                        className="text-xs font-semibold truncate"
                        style={{
                          color: entry.isCurrentUser
                            ? "var(--color-accent-green)"
                            : "var(--color-text-primary)",
                        }}
                      >
                        {entry.name}
                      </p>
                      <p
                        className="text-sm font-bold mt-0.5"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-accent-green)",
                        }}
                      >
                        {entry.score.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            {data.rankings
              .slice(activeTab !== "subject" && data.rankings.length >= 3 ? 3 : 0)
              .map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{
                    background: entry.isCurrentUser
                      ? "rgba(34,197,94,0.06)"
                      : "var(--color-surface-card)",
                    border: `1px solid ${
                      entry.isCurrentUser
                        ? "rgba(34,197,94,0.2)"
                        : "var(--color-surface-border)"
                    }`,
                  }}
                >
                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {entry.rank <= 3 ? (
                      <span className="text-lg">{RANK_ICONS[entry.rank - 1]}</span>
                    ) : (
                      <span
                        className="text-sm font-bold"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
                    style={{
                      background: entry.image ? "transparent" : "var(--color-surface-lighter)",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    {entry.image ? (
                      <img src={entry.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      entry.name.charAt(0)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{
                        color: entry.isCurrentUser
                          ? "var(--color-accent-green)"
                          : "var(--color-text-primary)",
                      }}
                    >
                      {entry.name}
                      {entry.isCurrentUser && (
                        <span className="text-xs ml-1" style={{ color: "var(--color-accent-dim)" }}>(You)</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                      {entry.level && <span>Lv {entry.level}</span>}
                      {entry.state && (
                        <>
                          <span>·</span>
                          <span>{entry.state}</span>
                        </>
                      )}
                      {activeTab === "subject" && entry.questionsAnswered && (
                        <>
                          <span>·</span>
                          <span>{entry.questionsAnswered} answered</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <span
                    className="text-sm font-bold shrink-0"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-accent-green)",
                    }}
                  >
                    {activeTab === "subject"
                      ? `${entry.score}%`
                      : entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
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