"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Send, X, Loader2 } from "lucide-react";

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  totalQuestions: number;
  totalAnswered: number;
  totalFlagged: number;
}

export function SubmitModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  totalQuestions,
  totalAnswered,
  totalFlagged,
}: SubmitModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const unanswered = totalQuestions - totalAnswered;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "var(--color-surface-card)",
          border: "1px solid var(--color-surface-border)",
          boxShadow: "var(--shadow-elevated)",
          animation: "var(--animate-scale-in)",
        }}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background:
                  unanswered > 0
                    ? "rgba(245, 158, 11, 0.1)"
                    : "rgba(34, 197, 94, 0.1)",
              }}
            >
              {unanswered > 0 ? (
                <AlertTriangle
                  className="h-5 w-5"
                  style={{ color: "var(--color-warning-400)" }}
                />
              ) : (
                <Send
                  className="h-5 w-5"
                  style={{ color: "var(--color-accent-green)" }}
                />
              )}
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.125rem",
                color: "var(--color-text-primary)",
              }}
            >
              Submit Test?
            </h3>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "0.25rem" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary */}
        <div
          className="mb-5 rounded-xl p-4 space-y-2"
          style={{
            background: "var(--color-surface-light)",
            border: "1px solid var(--color-surface-border)",
          }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--color-text-tertiary)" }}>Answered</span>
            <span
              className="font-semibold"
              style={{
                color: "var(--color-accent-green)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {totalAnswered}/{totalQuestions}
            </span>
          </div>
          {unanswered > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--color-text-tertiary)" }}>Unanswered</span>
              <span
                className="font-semibold"
                style={{
                  color: "var(--color-warning-400)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {unanswered}
              </span>
            </div>
          )}
          {totalFlagged > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--color-text-tertiary)" }}>Flagged</span>
              <span
                className="font-semibold"
                style={{
                  color: "var(--color-warning-400)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {totalFlagged}
              </span>
            </div>
          )}
        </div>

        {unanswered > 0 && (
          <p
            className="mb-5 text-sm"
            style={{ color: "var(--color-warning-400)", lineHeight: "1.5" }}
          >
            You have {unanswered} unanswered question{unanswered !== 1 ? "s" : ""}.
            Unanswered questions will be marked as incorrect.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}