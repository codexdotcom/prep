"use client";

import { X, Flag, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import type { TestQuestion, AnswerState } from "@/types/test";

interface QuestionNavigatorProps {
  totalQuestions: number;
  answers: AnswerState;
  questions: TestQuestion[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export function QuestionNavigator({
  totalQuestions,
  answers,
  questions,
  currentIndex,
  onSelect,
  onClose,
}: QuestionNavigatorProps) {
  // Group by subject for mock exams
  const subjects = [...new Set(questions.map((q) => q.subject))];
  const hasMultipleSubjects = subjects.length > 1;

  const getStatus = (qid: string) => {
    const answer = answers[qid];
    if (!answer) return "unanswered";
    if (answer.flagged && answer.selected) return "flagged-answered";
    if (answer.flagged) return "flagged";
    if (answer.selected) return "answered";
    return "unanswered";
  };

  const renderGrid = (startIndex: number, qs: TestQuestion[]) => (
    <div className="grid grid-cols-5 gap-2">
      {qs.map((q, i) => {
        const globalIndex = questions.indexOf(q);
        const status = getStatus(q.id);
        const isCurrent = globalIndex === currentIndex;

        let bg = "var(--color-surface-lighter)";
        let border = "var(--color-surface-border)";
        let textColor = "var(--color-text-tertiary)";

        if (isCurrent) {
          bg = "rgba(34, 197, 94, 0.15)";
          border = "var(--color-accent-green)";
          textColor = "var(--color-accent-green)";
        } else if (status === "answered" || status === "flagged-answered") {
          bg = "rgba(34, 197, 94, 0.08)";
          border = "rgba(34, 197, 94, 0.3)";
          textColor = "var(--color-accent-glow)";
        } else if (status === "flagged") {
          bg = "rgba(245, 158, 11, 0.08)";
          border = "rgba(245, 158, 11, 0.3)";
          textColor = "var(--color-warning-400)";
        }

        return (
          <button
            key={q.id}
            onClick={() => onSelect(globalIndex)}
            className="relative flex h-10 w-full items-center justify-center rounded-lg text-xs font-semibold transition-all duration-100"
            style={{
              background: bg,
              border: `1px solid ${border}`,
              color: textColor,
              fontFamily: "var(--font-mono)",
            }}
          >
            {globalIndex + 1}
            {(status === "flagged" || status === "flagged-answered") && (
              <Flag
                className="absolute -right-0.5 -top-0.5 h-3 w-3"
                fill="currentColor"
                style={{ color: "var(--color-warning-400)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );

  const answered = Object.values(answers).filter((a) => a.selected).length;
  const flagged = Object.values(answers).filter((a) => a.flagged).length;
  const unanswered = totalQuestions - answered;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--color-surface-border)" }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Questions
        </span>
        <button onClick={onClose} className="btn-ghost lg:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Summary */}
      <div
        className="flex items-center gap-4 px-4 py-3 text-xs"
        style={{
          borderBottom: "1px solid var(--color-surface-border)",
          color: "var(--color-text-tertiary)",
        }}
      >
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" style={{ color: "var(--color-accent-green)" }} />
          {answered} done
        </span>
        <span className="flex items-center gap-1">
          <Circle className="h-3 w-3" />
          {unanswered} left
        </span>
        {flagged > 0 && (
          <span className="flex items-center gap-1">
            <Flag className="h-3 w-3" style={{ color: "var(--color-warning-400)" }} />
            {flagged}
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {hasMultipleSubjects ? (
          subjects.map((subject) => {
            const subjectQs = questions.filter((q) => q.subject === subject);
            return (
              <div key={subject} className="mb-5">
                <p
                  className="section-label mb-2"
                  style={{ fontSize: "0.625rem" }}
                >
                  {subject.replace(/_/g, " ")}
                </p>
                {renderGrid(0, subjectQs)}
              </div>
            );
          })
        ) : (
          renderGrid(0, questions)
        )}
      </div>

      {/* Legend */}
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid var(--color-surface-border)" }}
      >
        <div className="grid grid-cols-2 gap-2 text-[0.6875rem]" style={{ color: "var(--color-text-tertiary)" }}>
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded"
              style={{
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid var(--color-accent-green)",
              }}
            />
            Current
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded"
              style={{
                background: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            />
            Answered
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded"
              style={{
                background: "var(--color-surface-lighter)",
                border: "1px solid var(--color-surface-border)",
              }}
            />
            Unanswered
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded"
              style={{
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
              }}
            />
            Flagged
          </span>
        </div>
      </div>
    </div>
  );
}