"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MinusCircle,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { ExplanationPanel } from "@/components/ai/explanation-panel";
import { TutorChat } from "@/components/ai/tutor-chat";

interface ReviewQuestion {
  id: string;
  selectedOption: string | null;
  isCorrect: boolean | null;
  timeSpent: number;
  question: {
    id: string;
    body: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    difficulty: string;
    topic: { name: string };
  };
}

export default function ReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [responses, setResponses] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "wrong" | "correct" | "skipped">("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tests/${sessionId}`);
        const data = await res.json();
        setResponses(data.responses || []);
      } catch {
        console.error("Failed to load review");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
      </div>
    );
  }

  const filtered = responses.filter((r) => {
    if (filter === "wrong") return r.isCorrect === false;
    if (filter === "correct") return r.isCorrect === true;
    if (filter === "skipped") return r.selectedOption === null;
    return true;
  });

  const current = filtered[currentIndex];
  if (!current) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--color-surface)" }}>
        <div className="card text-center p-8">
          <p style={{ color: "var(--color-text-tertiary)" }}>No questions to review.</p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary mt-4">Dashboard</button>
        </div>
      </div>
    );
  }

  const q = current.question;
  const options = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface)" }}>
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
          <button onClick={() => router.back()} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Results</span>
          </button>

          <span
            className="text-sm font-mono"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {currentIndex + 1} / {filtered.length}
          </span>

          <button
            onClick={() => setChatOpen(true)}
            className="btn-primary"
            style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Filters */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {(
            [
              { key: "all", label: "All", count: responses.length },
              { key: "wrong", label: "Wrong", count: responses.filter((r) => r.isCorrect === false).length },
              { key: "correct", label: "Correct", count: responses.filter((r) => r.isCorrect === true).length },
              { key: "skipped", label: "Skipped", count: responses.filter((r) => r.selectedOption === null).length },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setCurrentIndex(0); }}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: filter === key ? "rgba(34, 197, 94, 0.1)" : "var(--color-surface-light)",
                border: `1px solid ${filter === key ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                color: filter === key ? "var(--color-accent-green)" : "var(--color-text-tertiary)",
              }}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Question */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            {current.isCorrect === true && (
              <CheckCircle2 className="h-5 w-5" style={{ color: "var(--color-accent-green)" }} />
            )}
            {current.isCorrect === false && (
              <XCircle className="h-5 w-5" style={{ color: "var(--color-danger-400)" }} />
            )}
            {current.selectedOption === null && (
              <MinusCircle className="h-5 w-5" style={{ color: "var(--color-text-muted)" }} />
            )}
            <span className="badge badge-green" style={{ fontSize: "0.625rem" }}>{q.topic.name}</span>
            <span
              className="text-xs"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
              }}
            >
              {Math.round(current.timeSpent / 1000)}s
            </span>
          </div>

          <p
            className="text-base leading-relaxed mb-6"
            style={{ color: "var(--color-text-primary)" }}
          >
            {q.body}
          </p>

          {/* Options with correct/wrong indicators */}
          <div className="space-y-2 mb-6">
            {(["A", "B", "C", "D"] as const).map((key) => {
              const isCorrect = key === q.correctOption;
              const isSelected = key === current.selectedOption;
              const isWrongSelected = isSelected && !isCorrect;

              let bg = "var(--color-surface-light)";
              let border = "var(--color-surface-border)";
              let letterBg = "var(--color-surface-lighter)";
              let letterColor = "var(--color-text-muted)";

              if (isCorrect) {
                bg = "rgba(34, 197, 94, 0.08)";
                border = "rgba(34, 197, 94, 0.3)";
                letterBg = "var(--color-accent-green)";
                letterColor = "var(--color-surface)";
              } else if (isWrongSelected) {
                bg = "rgba(239, 68, 68, 0.08)";
                border = "rgba(239, 68, 68, 0.3)";
                letterBg = "var(--color-danger-400)";
                letterColor = "white";
              }

              return (
                <div
                  key={key}
                  className="flex items-start gap-3 rounded-xl p-3.5"
                  style={{ background: bg, border: `1.5px solid ${border}` }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                    style={{
                      background: letterBg,
                      color: letterColor,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : isWrongSelected ? <XCircle className="h-3.5 w-3.5" /> : key}
                  </span>
                  <span
                    className="text-sm leading-relaxed pt-0.5"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {options[key]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Explanation */}
        <ExplanationPanel
          questionId={q.id}
          studentAnswer={current.selectedOption || undefined}
          onOpenChat={() => setChatOpen(true)}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex <= 0}
            className="btn-secondary"
            style={{ opacity: currentIndex <= 0 ? 0.3 : 1 }}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(filtered.length - 1, i + 1))}
            disabled={currentIndex >= filtered.length - 1}
            className="btn-primary"
            style={{ opacity: currentIndex >= filtered.length - 1 ? 0.3 : 1 }}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* AI Chat */}
      <TutorChat
        questionId={q.id}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        initialMessage={
          current.isCorrect === false
            ? `I got this question wrong. I picked ${current.selectedOption} but the answer is ${q.correctOption}. Can you help me understand why?`
            : undefined
        }
      />
    </div>
  );
}