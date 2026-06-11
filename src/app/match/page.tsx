"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Heart, X, Bookmark, RotateCcw, Loader2,
  MapPin, GraduationCap, TrendingUp, ChevronRight, Star,
} from "lucide-react";

interface MatchCard {
  id: string;
  universityId: string;
  universityName: string;
  universityShortName: string;
  universityState: string;
  universityType: string;
  courseName: string;
  cutoffScore: number | null;
  matchScore: number;
  admissionChance: number;
}

interface SavedMatch {
  id: string;
  universityName: string;
  universityShortName: string;
  universityState: string;
  courseName: string;
  cutoffScore: number | null;
  matchScore: number;
  action: string;
}

export default function MatchPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"swipe" | "saved">("swipe");
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [predictedScore, setPredictedScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState<"left" | "right" | "up" | null>(null);
  const [saved, setSaved] = useState<SavedMatch[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [dragX, setDragX] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/match/cards");
        const data = await res.json();
        if (res.ok) {
          setCards(data.cards || []);
          setPredictedScore(data.predictedScore || 0);
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const loadSaved = async () => {
    setSavedLoading(true);
    try {
      const res = await fetch("/api/match/saved");
      const data = await res.json();
      if (res.ok) setSaved(data.matches || []);
    } catch {} finally { setSavedLoading(false); }
  };

  useEffect(() => { if (tab === "saved") loadSaved(); }, [tab]);

  const swipe = async (action: "LIKED" | "SKIPPED" | "SAVED") => {
    if (currentIndex >= cards.length) return;
    const card = cards[currentIndex];

    setSwiping(action === "LIKED" ? "right" : action === "SAVED" ? "up" : "left");

    await fetch("/api/match/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ universityId: card.universityId, courseId: card.id, action, matchScore: card.matchScore }),
    });

    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setSwiping(null);
      setDragX(0);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => {
    currentX.current = e.touches[0].clientX - startX.current;
    setDragX(currentX.current);
  };
  const handleTouchEnd = () => {
    if (currentX.current > 80) swipe("LIKED");
    else if (currentX.current < -80) swipe("SKIPPED");
    else setDragX(0);
    currentX.current = 0;
  };

  const getChanceColor = (c: number) => c >= 70 ? "var(--color-accent-green)" : c >= 40 ? "var(--color-warning-400)" : "var(--color-danger-400)";
  const getChanceLabel = (c: number) => c >= 70 ? "Strong" : c >= 40 ? "Moderate" : "Reach";

  const card = currentIndex < cards.length ? cards[currentIndex] : null;
  const nextCard = currentIndex + 1 < cards.length ? cards[currentIndex + 1] : null;

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header className="sticky top-0 z-30" style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--color-surface-light)" }}>
            {[
              { key: "swipe" as const, label: "Discover" },
              { key: "saved" as const, label: "Saved" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className="rounded-md px-4 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: tab === key ? "var(--color-surface-card)" : "transparent",
                  color: tab === key ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                }}>
                {label}
              </button>
            ))}
          </div>
          <div className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}>
            {predictedScore}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-5">
        {/* ═══ SWIPE TAB ═══ */}
        {tab === "swipe" && (
          <>
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
            ) : !card ? (
              <div className="text-center py-16">
                <GraduationCap className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>No more matches</p>
                <p className="text-xs mb-4" style={{ color: "var(--color-text-tertiary)" }}>You have reviewed all available universities</p>
                <button onClick={() => { setCurrentIndex(0); }} className="btn-secondary">
                  <RotateCcw className="h-3.5 w-3.5" /> Start Over
                </button>
              </div>
            ) : (
              <>
                {/* Card stack */}
                <div className="relative" style={{ height: "420px", perspective: "1000px" }}>
                  {/* Background card */}
                  {nextCard && (
                    <div className="absolute inset-0 rounded-2xl p-5" style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)", transform: "scale(0.95) translateY(8px)", opacity: 0.5 }} />
                  )}

                  {/* Main card */}
                  <div
                    ref={cardRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="absolute inset-0 rounded-2xl overflow-hidden transition-transform"
                    style={{
                      background: "var(--color-surface-card)",
                      border: "1px solid var(--color-surface-border)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                      transform: swiping === "right" ? "translateX(120%) rotate(15deg)" :
                        swiping === "left" ? "translateX(-120%) rotate(-15deg)" :
                        swiping === "up" ? "translateY(-120%)" :
                        `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
                      transition: swiping ? "transform 0.3s ease" : dragX ? "none" : "transform 0.2s ease",
                      opacity: swiping ? 0 : 1,
                    }}
                  >
                    {/* Swipe indicators */}
                    {dragX > 40 && (
                      <div className="absolute top-6 left-6 z-10 rounded-xl px-4 py-2 font-bold text-sm rotate-[-15deg]"
                        style={{ background: "rgba(34,197,94,0.15)", border: "2px solid var(--color-accent-green)", color: "var(--color-accent-green)" }}>
                        INTERESTED
                      </div>
                    )}
                    {dragX < -40 && (
                      <div className="absolute top-6 right-6 z-10 rounded-xl px-4 py-2 font-bold text-sm rotate-[15deg]"
                        style={{ background: "rgba(239,68,68,0.15)", border: "2px solid var(--color-danger-400)", color: "var(--color-danger-400)" }}>
                        SKIP
                      </div>
                    )}

                    {/* Card content */}
                    <div className="h-full flex flex-col p-5">
                      {/* Match badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                            style={{ background: "rgba(34,197,94,0.08)", color: "var(--color-accent-green)", fontFamily: "var(--font-mono)" }}>
                            {card.matchScore}%
                          </div>
                          <div>
                            <p className="text-[0.5625rem] font-semibold" style={{ color: "var(--color-accent-green)" }}>Match Score</p>
                            <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>Based on your profile</p>
                          </div>
                        </div>
                        <span className="text-[0.5625rem] rounded-full px-2.5 py-1 font-semibold"
                          style={{ background: `${getChanceColor(card.admissionChance)}15`, color: getChanceColor(card.admissionChance), border: `1px solid ${getChanceColor(card.admissionChance)}30` }}>
                          {getChanceLabel(card.admissionChance)}
                        </span>
                      </div>

                      {/* University name */}
                      <div className="flex-1">
                        <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
                          {card.universityShortName}
                        </p>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", color: "var(--color-text-primary)", lineHeight: 1.3, marginBottom: "0.5rem" }}>
                          {card.universityName}
                        </h2>

                        {/* Course */}
                        <div className="flex items-center gap-2 mb-4">
                          <GraduationCap className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
                          <p className="text-sm font-semibold" style={{ color: "var(--color-accent-green)" }}>{card.courseName}</p>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="rounded-xl p-3" style={{ background: "var(--color-surface-light)" }}>
                            <MapPin className="h-3.5 w-3.5 mb-1" style={{ color: "var(--color-text-muted)" }} />
                            <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{card.universityState}</p>
                            <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>Location</p>
                          </div>
                          <div className="rounded-xl p-3" style={{ background: "var(--color-surface-light)" }}>
                            <TrendingUp className="h-3.5 w-3.5 mb-1" style={{ color: "var(--color-text-muted)" }} />
                            <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{card.cutoffScore || "N/A"}</p>
                            <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>Cutoff Score</p>
                          </div>
                        </div>

                        {/* Admission probability */}
                        <div className="mt-4 rounded-xl p-3.5" style={{ background: `${getChanceColor(card.admissionChance)}08`, border: `1px solid ${getChanceColor(card.admissionChance)}20` }}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Admission Probability</p>
                            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: getChanceColor(card.admissionChance) }}>
                              {card.admissionChance}%
                            </p>
                          </div>
                          <div style={{ height: "4px", borderRadius: "9999px", background: "var(--color-surface-lighter)" }}>
                            <div style={{ width: `${card.admissionChance}%`, height: "100%", borderRadius: "9999px", background: getChanceColor(card.admissionChance), transition: "width 0.5s" }} />
                          </div>
                          <p className="text-[0.5625rem] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                            Your predicted score: {predictedScore} | Cutoff: {card.cutoffScore || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-4 mt-5">
                  <button onClick={() => swipe("SKIPPED")}
                    className="flex h-14 w-14 items-center justify-center rounded-full transition-all"
                    style={{ background: "rgba(239,68,68,0.08)", border: "2px solid rgba(239,68,68,0.2)", color: "var(--color-danger-400)" }}>
                    <X className="h-6 w-6" />
                  </button>
                  <button onClick={() => swipe("SAVED")}
                    className="flex h-11 w-11 items-center justify-center rounded-full transition-all"
                    style={{ background: "rgba(59,130,246,0.08)", border: "2px solid rgba(59,130,246,0.2)", color: "var(--color-info-400)" }}>
                    <Bookmark className="h-5 w-5" />
                  </button>
                  <button onClick={() => swipe("LIKED")}
                    className="flex h-14 w-14 items-center justify-center rounded-full transition-all"
                    style={{ background: "rgba(34,197,94,0.08)", border: "2px solid rgba(34,197,94,0.2)", color: "var(--color-accent-green)" }}>
                    <Heart className="h-6 w-6" />
                  </button>
                </div>

                <p className="text-center text-[0.5625rem] mt-3" style={{ color: "var(--color-text-muted)" }}>
                  {cards.length - currentIndex - 1} more matches | Swipe right to save, left to skip
                </p>
              </>
            )}
          </>
        )}

        {/* ═══ SAVED TAB ═══ */}
        {tab === "saved" && (
          <>
            {savedLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
            ) : saved.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>No saved universities yet</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>Swipe right on universities you are interested in</p>
              </div>
            ) : (
              <div className="space-y-2">
                {saved.map((m) => (
                  <div key={m.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                        style={{ background: "rgba(34,197,94,0.08)", color: "var(--color-accent-green)", fontFamily: "var(--font-mono)" }}>
                        {m.matchScore}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{m.universityShortName}</p>
                        <p className="text-xs" style={{ color: "var(--color-accent-green)" }}>{m.courseName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} />
                          <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>{m.universityState}</span>
                          {m.cutoffScore && (
                            <>
                              <span style={{ color: "var(--color-text-muted)", fontSize: "0.5rem" }}>|</span>
                              <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>Cutoff: {m.cutoffScore}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {m.action === "LIKED" ? <Heart className="h-4 w-4 shrink-0" style={{ color: "var(--color-accent-green)", fill: "var(--color-accent-green)" }} />
                        : <Bookmark className="h-4 w-4 shrink-0" style={{ color: "var(--color-info-400)", fill: "var(--color-info-400)" }} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}