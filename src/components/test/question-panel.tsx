"use client";

import { Flag, ChevronLeft, ChevronRight } from "lucide-react";

interface TestQuestion {
  id: string;
  subject: string;
  body: string;
  imageUrl?: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  topic?: { name: string } | null;
  difficulty?: string;
}

interface QuestionPanelProps {
  question: TestQuestion;
  questionNumber: number;
  selectedOption: "A" | "B" | "C" | "D" | null;
  isFlagged: boolean;
  onSelect: (option: "A" | "B" | "C" | "D") => void;
  onFlag: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function QuestionPanel({
  question, questionNumber, selectedOption, isFlagged,
  onSelect, onFlag, onNext, onPrev, hasPrev, hasNext,
}: QuestionPanelProps) {
  if (!question) return null;

  const options = { A: question.optionA, B: question.optionB, C: question.optionC, D: question.optionD };
  const difficulty = question.difficulty || "MEDIUM";

  return (
    <div style={{ animation: "var(--animate-fade-in)" }}>
      {/* Question metadata */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="badge badge-muted" style={{ fontFamily: "var(--font-mono)" }}>Q{questionNumber}</span>
          <span className="badge badge-green">{question.topic?.name || fmt(question.subject || "")}</span>
          {difficulty && (
            <span className="badge" style={{
              background: difficulty === "EASY" ? "rgba(34,197,94,0.1)" : difficulty === "HARD" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
              color: difficulty === "EASY" ? "var(--color-accent-glow)" : difficulty === "HARD" ? "var(--color-danger-400)" : "var(--color-warning-400)",
              border: `1px solid ${difficulty === "EASY" ? "rgba(34,197,94,0.2)" : difficulty === "HARD" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
            }}>
              {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
            </span>
          )}
        </div>
        <button onClick={onFlag} className="btn-ghost" style={{ color: isFlagged ? "var(--color-warning-400)" : undefined }} title={isFlagged ? "Unflag" : "Flag"}>
          <Flag className="h-4 w-4" fill={isFlagged ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Question body */}
      <div className="mb-8" style={{ fontSize: "1.0625rem", lineHeight: "1.75", color: "var(--color-text-primary)" }}>
        <p>{question.body}</p>
        {question.imageUrl && (
          <div className="mt-4 overflow-hidden rounded-lg" style={{ background: "var(--color-surface-lighter)", border: "1px solid var(--color-surface-border)" }}>
            <img src={question.imageUrl} alt="" className="mx-auto max-h-64 object-contain p-4" />
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {OPTION_KEYS.map((key) => {
          const isSelected = selectedOption === key;
          return (
            <button key={key} onClick={() => onSelect(key)}
              className="group flex w-full items-start gap-4 rounded-xl p-4 text-left transition-all duration-150"
              style={{
                background: isSelected ? "rgba(34,197,94,0.08)" : "var(--color-surface-light)",
                border: `1.5px solid ${isSelected ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                boxShadow: isSelected ? "var(--shadow-glow)" : "none",
              }}
              onMouseEnter={(e) => { if (!isSelected) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.3)"; (e.currentTarget as HTMLElement).style.background = "var(--color-surface-lighter)"; } }}
              onMouseLeave={(e) => { if (!isSelected) { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-surface-border)"; (e.currentTarget as HTMLElement).style.background = "var(--color-surface-light)"; } }}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-colors"
                style={{ background: isSelected ? "var(--color-accent-green)" : "var(--color-surface-lighter)", color: isSelected ? "var(--color-surface)" : "var(--color-text-tertiary)", fontFamily: "var(--font-mono)" }}>
                {key}
              </span>
              <span className="pt-1 text-[0.9375rem] leading-relaxed" style={{ color: isSelected ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                {options[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button onClick={onPrev} disabled={!hasPrev} className="btn-secondary" style={{ opacity: hasPrev ? 1 : 0.3, pointerEvents: hasPrev ? "auto" : "none" }}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button onClick={onNext} disabled={!hasNext} className="btn-primary" style={{ opacity: hasNext ? 1 : 0.3, pointerEvents: hasNext ? "auto" : "none" }}>
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}