"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Bookmark,
  Share2,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Loader2,
  Brain,
  Zap,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  FlaskConical,
  Target,
  GraduationCap,
  Filter,
  X,
} from "lucide-react";
import { Markdown } from "@/components/ui/markdown";

interface FeedItem {
  id: string;
  type: string;
  subject: string;
  title: string;
  body: string;
  imageUrl: string | null;
  tags: string[];
  difficulty: string;
  topicName: string | null;
  views: number;
  likes: number;
  saves: number;
  liked: boolean;
  saved: boolean;
}

const TYPE_CONFIG: Record<string, { icon: typeof Brain; label: string; color: string; gradient: string }> = {
  TRICK: {
    icon: Zap,
    label: "Quick Trick",
    color: "var(--color-accent-green)",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(10,31,10,0) 60%)",
  },
  MNEMONIC: {
    icon: Brain,
    label: "Memory Aid",
    color: "var(--color-tier-elite)",
    gradient: "linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(10,31,10,0) 60%)",
  },
  TRAP: {
    icon: AlertTriangle,
    label: "JAMB Trap",
    color: "var(--color-danger-400)",
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(10,31,10,0) 60%)",
  },
  FLASHCARD: {
    icon: BookOpen,
    label: "Flashcard",
    color: "var(--color-info-400)",
    gradient: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(10,31,10,0) 60%)",
  },
  HACK: {
    icon: Target,
    label: "Exam Hack",
    color: "var(--color-warning-400)",
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(10,31,10,0) 60%)",
  },
  FACT: {
    icon: Lightbulb,
    label: "Did You Know",
    color: "var(--color-accent-green)",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(10,31,10,0) 60%)",
  },
  FORMULA: {
    icon: FlaskConical,
    label: "Key Formula",
    color: "var(--color-info-400)",
    gradient: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(10,31,10,0) 60%)",
  },
  MISTAKE: {
    icon: AlertTriangle,
    label: "Common Mistake",
    color: "var(--color-danger-400)",
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(10,31,10,0) 60%)",
  },
};

const SUBJECT_FILTERS = [
  { value: "", label: "All" },
  { value: "MATHEMATICS", label: "Maths" },
  { value: "PHYSICS", label: "Physics" },
  { value: "CHEMISTRY", label: "Chemistry" },
  { value: "BIOLOGY", label: "Biology" },
  { value: "USE_OF_ENGLISH", label: "English" },
  { value: "ECONOMICS", label: "Economics" },
];

export default function FeedPage() {
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewTimers = useRef<Map<string, number>>(new Map());
  const touchStart = useRef<number>(0);

  const fetchFeed = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setFeed([]);
      setCursor(null);
      setCurrentIndex(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (!reset && cursor) params.set("cursor", cursor);
      if (subjectFilter) params.set("subject", subjectFilter);

      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();

      if (reset) {
        setFeed(data.feed || []);
      } else {
        setFeed((prev) => [...prev, ...(data.feed || [])]);
      }
      setCursor(data.nextCursor);
    } catch {
      console.error("Failed to load feed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor, subjectFilter]);

  useEffect(() => {
    fetchFeed(true);
  }, [subjectFilter]);

  // Track view time
  useEffect(() => {
    if (feed.length === 0) return;
    const item = feed[currentIndex];
    if (!item) return;

    const startTime = Date.now();
    viewTimers.current.set(item.id, startTime);

    return () => {
      const start = viewTimers.current.get(item.id);
      if (start) {
        const duration = Math.round((Date.now() - start) / 1000);
        if (duration >= 2) {
          fetch("/api/feed/interact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentId: item.id, action: "view", viewDuration: duration }),
          }).catch(() => {});
        }
      }
    };
  }, [currentIndex, feed]);

  // Load more when near end
  useEffect(() => {
    if (currentIndex >= feed.length - 3 && cursor && !loadingMore) {
      fetchFeed(false);
    }
  }, [currentIndex, feed.length, cursor, loadingMore, fetchFeed]);

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, feed.length - 1));
    setCurrentIndex(clamped);
  };

  const handleLike = async (id: string) => {
    const res = await fetch("/api/feed/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: id, action: "like" }),
    });
    const data = await res.json();

    setFeed((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              liked: data.liked,
              likes: item.likes + (data.liked ? 1 : -1),
            }
          : item
      )
    );
  };

  const handleSave = async (id: string) => {
    const res = await fetch("/api/feed/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: id, action: "save" }),
    });
    const data = await res.json();

    setFeed((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              saved: data.saved,
              saves: item.saves + (data.saved ? 1 : -1),
            }
          : item
      )
    );
  };

  const handleShare = async (item: FeedItem) => {
    const text = `${item.title}\n\n${item.body.slice(0, 100)}...\n\nLearn more on JambOS`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  // Touch/swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goTo(currentIndex + 1);
      else goTo(currentIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") goTo(currentIndex + 1);
      if (e.key === "ArrowUp" || e.key === "k") goTo(currentIndex - 1);
      if (e.key === "l") handleLike(feed[currentIndex]?.id);
      if (e.key === "s") handleSave(feed[currentIndex]?.id);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, feed]);

  // Scroll wheel
  const wheelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelTimeout.current) return;
    if (Math.abs(e.deltaY) > 30) {
      goTo(currentIndex + (e.deltaY > 0 ? 1 : -1));
      wheelTimeout.current = setTimeout(() => {
        wheelTimeout.current = null;
      }, 400);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Loading your feed...</p>
        </div>
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--color-surface)" }}>
        <div className="card text-center p-8 max-w-sm">
          <GraduationCap className="mx-auto mb-4 h-8 w-8" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm mb-4" style={{ color: "var(--color-text-tertiary)" }}>
            No content available yet. Check back soon!
          </p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary">Dashboard</button>
        </div>
      </div>
    );
  }

  const currentItem = feed[currentIndex];
  const config = TYPE_CONFIG[currentItem?.type] || TYPE_CONFIG.FACT;
  const Icon = config.icon;

  const formatSubject = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col"
      style={{ background: "var(--color-surface)" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(to bottom, var(--color-surface), transparent)" }}
      >
        <button onClick={() => router.push("/dashboard")} className="btn-ghost" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)" }}>
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" style={{ color: "var(--color-accent-green)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Learn
          </span>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-ghost"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)" }}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Filters dropdown */}
      {showFilters && (
        <div
          className="absolute top-14 left-0 right-0 z-30 px-4 py-3"
          style={{
            background: "var(--color-surface-card)",
            borderBottom: "1px solid var(--color-surface-border)",
            animation: "var(--animate-slide-up)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              Filter by subject
            </span>
            <button onClick={() => setShowFilters(false)} className="btn-ghost" style={{ padding: "0.25rem" }}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUBJECT_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setSubjectFilter(f.value); setShowFilters(false); }}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: subjectFilter === f.value ? "rgba(34,197,94,0.1)" : "var(--color-surface-lighter)",
                  border: `1px solid ${subjectFilter === f.value ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                  color: subjectFilter === f.value ? "var(--color-accent-green)" : "var(--color-text-tertiary)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card content area */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 overflow-hidden">
        <div
          className="w-full max-w-lg rounded-3xl p-6 sm:p-8 relative"
          style={{
            background: config.gradient + ", var(--color-surface-card)",
            border: `1px solid ${config.color}20`,
            boxShadow: `0 0 40px ${config.color}08`,
            minHeight: "60vh",
            maxHeight: "75vh",
            display: "flex",
            flexDirection: "column",
            animation: "var(--animate-scale-in)",
          }}
          key={currentItem.id}
        >
          {/* Type badge + subject */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `${config.color}15` }}
              >
                <Icon className="h-4 w-4" style={{ color: config.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: config.color }}>
                  {config.label}
                </p>
                <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                  {formatSubject(currentItem.subject)}
                  {currentItem.topicName && ` · ${currentItem.topicName}`}
                </p>
              </div>
            </div>

            <span
              className="text-[0.5625rem] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background:
                  currentItem.difficulty === "EASY"
                    ? "rgba(34,197,94,0.1)"
                    : currentItem.difficulty === "HARD"
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(245,158,11,0.1)",
                color:
                  currentItem.difficulty === "EASY"
                    ? "var(--color-accent-green)"
                    : currentItem.difficulty === "HARD"
                    ? "var(--color-danger-400)"
                    : "var(--color-warning-400)",
              }}
            >
              {currentItem.difficulty}
            </span>
          </div>

          {/* Title */}
          <h2
            className="mb-4 shrink-0"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.375rem",
              lineHeight: 1.3,
              color: "var(--color-text-primary)",
            }}
          >
            {currentItem.title}
          </h2>

          {/* Body */}
          <div className="flex-1 overflow-y-auto pr-1 mb-4" style={{ WebkitOverflowScrolling: "touch" }}>
            <Markdown content={currentItem.body} />
          </div>

          {/* Tags */}
          {currentItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3 shrink-0">
              {currentItem.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2 py-0.5 text-[0.5625rem]"
                  style={{
                    background: "var(--color-surface-lighter)",
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-surface-border)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Engagement bar */}
          <div className="flex items-center justify-between shrink-0 pt-3" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLike(currentItem.id)}
                className="flex items-center gap-1.5 transition-transform active:scale-90"
              >
                <Heart
                  className="h-5 w-5 transition-colors"
                  fill={currentItem.liked ? "var(--color-danger-400)" : "none"}
                  style={{ color: currentItem.liked ? "var(--color-danger-400)" : "var(--color-text-muted)" }}
                />
                {currentItem.likes > 0 && (
                  <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                    {currentItem.likes}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSave(currentItem.id)}
                className="flex items-center gap-1.5 transition-transform active:scale-90"
              >
                <Bookmark
                  className="h-5 w-5 transition-colors"
                  fill={currentItem.saved ? "var(--color-warning-400)" : "none"}
                  style={{ color: currentItem.saved ? "var(--color-warning-400)" : "var(--color-text-muted)" }}
                />
                {currentItem.saves > 0 && (
                  <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                    {currentItem.saves}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleShare(currentItem)}
                className="transition-transform active:scale-90"
              >
                <Share2 className="h-5 w-5" style={{ color: "var(--color-text-muted)" }} />
              </button>
            </div>

            <span className="text-[0.5625rem]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
              {currentIndex + 1}/{feed.length}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation arrows (side) */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex <= 0}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
          style={{
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(8px)",
            color: "var(--color-text-primary)",
            opacity: currentIndex <= 0 ? 0.2 : 0.7,
          }}
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex >= feed.length - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
          style={{
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(8px)",
            color: "var(--color-text-primary)",
            opacity: currentIndex >= feed.length - 1 ? 0.2 : 0.7,
          }}
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {/* Progress dots (left side) */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
        {feed.slice(Math.max(0, currentIndex - 3), currentIndex + 4).map((item, i) => {
          const actualIndex = Math.max(0, currentIndex - 3) + i;
          return (
            <button
              key={item.id}
              onClick={() => goTo(actualIndex)}
              className="rounded-full transition-all"
              style={{
                width: actualIndex === currentIndex ? "4px" : "3px",
                height: actualIndex === currentIndex ? "20px" : "8px",
                background: actualIndex === currentIndex
                  ? "var(--color-accent-green)"
                  : "var(--color-surface-border)",
              }}
            />
          );
        })}
      </div>

      {/* Bottom hint (shows briefly) */}
      <div
        className="absolute bottom-4 left-0 right-0 text-center z-20 pointer-events-none"
      >
        <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
          Swipe up for next · ↑↓ arrows · J/K keys
        </p>
      </div>
    </div>
  );
}