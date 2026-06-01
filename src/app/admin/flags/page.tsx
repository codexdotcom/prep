"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Loader2,
  Eye,
} from "lucide-react";

interface Flag {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  question: {
    id: string;
    body: string;
    subject: string;
    correctOption: string;
    topic: { name: string };
  };
  user: { name: string | null; email: string | null };
}

const REASON_LABELS: Record<string, string> = {
  WRONG_ANSWER: "Wrong Answer",
  UNCLEAR_QUESTION: "Unclear",
  DUPLICATE: "Duplicate",
  OUTDATED: "Outdated",
  TYPO: "Typo",
  OTHER: "Other",
};

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("OPEN");

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/flags?status=${activeStatus}`);
      const data = await res.json();
      setFlags(data.flags || []);
      setStatusCounts(data.statusCounts || {});
    } catch {
      console.error("Failed to load flags");
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  const handleResolve = async (id: string, status: string, resolution?: string) => {
    try {
      await fetch(`/api/admin/flags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution }),
      });
      fetchFlags();
    } catch {
      alert("Failed to update");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>
        Flagged Questions
      </h1>

      {/* Status tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {(["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              background: activeStatus === status ? "rgba(34, 197, 94, 0.1)" : "var(--color-surface-light)",
              border: `1px solid ${activeStatus === status ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
              color: activeStatus === status ? "var(--color-accent-green)" : "var(--color-text-tertiary)",
            }}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} />
        </div>
      ) : flags.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle2 className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-accent-green)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            No {activeStatus.toLowerCase()} flags
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div key={flag.id} className="card p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="h-4 w-4 shrink-0 mt-1"
                  style={{
                    color: flag.reason === "WRONG_ANSWER"
                      ? "var(--color-danger-400)"
                      : "var(--color-warning-400)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="badge"
                      style={{
                        fontSize: "0.625rem",
                        background: "rgba(245, 158, 11, 0.1)",
                        color: "var(--color-warning-400)",
                        border: "1px solid rgba(245, 158, 11, 0.2)",
                      }}
                    >
                      {REASON_LABELS[flag.reason] || flag.reason}
                    </span>
                    <span className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>
                      by {flag.user.name || flag.user.email || "Unknown"} ·{" "}
                      {new Date(flag.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <p className="text-sm mb-1 line-clamp-2" style={{ color: "var(--color-text-primary)" }}>
                    {flag.question.body}
                  </p>

                  <p className="text-xs mb-1" style={{ color: "var(--color-text-tertiary)" }}>
                    {flag.question.topic.name} · Correct: {flag.question.correctOption}
                  </p>

                  {flag.description && (
                    <div
                      className="mt-2 rounded-lg p-2.5 text-xs"
                      style={{
                        background: "var(--color-surface-light)",
                        border: "1px solid var(--color-surface-border)",
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      <MessageCircle className="inline h-3 w-3 mr-1" style={{ color: "var(--color-text-muted)" }} />
                      {flag.description}
                    </div>
                  )}

                  {flag.status === "OPEN" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleResolve(flag.id, "REVIEWING")}
                        className="btn-secondary"
                        style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
                      >
                        <Eye className="h-3 w-3" />
                        Review
                      </button>
                      <button
                        onClick={() => handleResolve(flag.id, "RESOLVED", "Fixed")}
                        className="btn-primary"
                        style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Resolve
                      </button>
                      <button
                        onClick={() => handleResolve(flag.id, "DISMISSED", "Not an issue")}
                        className="btn-ghost"
                        style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem", color: "var(--color-danger-400)" }}
                      >
                        <XCircle className="h-3 w-3" />
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}