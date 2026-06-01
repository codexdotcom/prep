"use client";

import { useEffect } from "react";
import { Lightbulb, Loader2, MessageCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useExplanation } from "@/hooks/use-explanation";
import { Markdown } from "@/components/ui/markdown";

interface ExplanationPanelProps {
  questionId: string;
  studentAnswer?: string;
  onOpenChat?: () => void;
}

export function ExplanationPanel({ questionId, studentAnswer, onOpenChat }: ExplanationPanelProps) {
  const { data, loading, error, fetchExplanation } = useExplanation();

  useEffect(() => {
    fetchExplanation(questionId, studentAnswer);
  }, [questionId, studentAnswer, fetchExplanation]);

  if (loading) {
    return (
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--color-surface-light)",
          border: "1px solid var(--color-surface-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-accent-green)" }} />
          <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            Generating explanation...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl p-5"
        style={{
          background: "rgba(239, 68, 68, 0.05)",
          border: "1px solid rgba(239, 68, 68, 0.15)",
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="h-4 w-4" style={{ color: "var(--color-danger-400)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--color-danger-400)" }}>
            {error}
          </span>
        </div>
        <button
          onClick={() => fetchExplanation(questionId, studentAnswer)}
          className="btn-ghost text-xs"
          style={{ color: "var(--color-accent-green)" }}
        >
          <RefreshCw className="h-3 w-3" />
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--color-surface-light)",
        border: "1px solid var(--color-surface-border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--color-surface-border)" }}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Explanation
          </span>
          {data.source === "ai" && (
            <span
              className="badge"
              style={{
                fontSize: "0.5625rem",
                background: "rgba(34, 197, 94, 0.1)",
                color: "var(--color-accent-green)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              AI Generated
            </span>
          )}
        </div>

        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="btn-ghost text-xs"
            style={{ color: "var(--color-accent-green)" }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Ask follow-up
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <Markdown content={data.explanation} />
      </div>
    </div>
  );
}