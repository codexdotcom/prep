"use client";

import { useState } from "react";
import {
  Loader2, Sparkles, CheckCircle2, XCircle,
  AlertTriangle, RotateCcw, PenTool,
} from "lucide-react";
import { FeatureGate } from "@/components/ui/feature-gate";
import { FeatureHeader } from "@/components/ui/feature-header";
import { PageFooter } from "@/components/ui/page-footer";
import { useUsage } from "@/hooks/use-usage";

interface Category { name: string; score: number; maxScore: number; comment: string }
interface Correction { original: string; corrected: string; rule: string }
interface GradeResult {
  overallScore: number; maxScore: number; grade: string; summary: string;
  categories: Category[]; strengths: string[]; improvements: string[];
  corrections: Correction[]; wordCount: number; rewrittenParagraph: string;
}

type Phase = "write" | "grading" | "result";

function EssayGraderContent() {
  const usage = useUsage("essay");

  const [essay, setEssay] = useState("");
  const [essayPrompt, setEssayPrompt] = useState("");
  const [essayType, setEssayType] = useState("jamb");
  const [phase, setPhase] = useState<Phase>("write");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState("");

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;

  const handleGrade = async () => {
    if (essay.trim().length < 50) { setError("Write at least 50 characters."); return; }
    setError(""); setPhase("grading");
    try {
      const res = await fetch("/api/essay-grader/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essay, prompt: essayPrompt, type: essayType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grade");
      setResult(data);
      setPhase("result");
      await usage.record();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setPhase("write");
    }
  };

  const resetAll = () => { setPhase("write"); setResult(null); setEssay(""); setEssayPrompt(""); setError(""); };

  const scoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    return pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      {usage.limit > 0 && (
        <div className="flex items-center justify-end mb-4">
          <span className="text-[0.625rem] px-2 py-0.5 rounded-md" style={{ background: "#f5f5f5", color: "#999", fontFamily: "var(--font-mono)" }}>
            {usage.remaining === -1 ? "Unlimited" : `${usage.remaining} left today`}
          </span>
        </div>
      )}

      {phase === "write" && (
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-semibold" style={{ color: "#111" }}>Grade your essay</h1>
            <p className="text-sm mt-1" style={{ color: "#888" }}>
              AI grades like a real JAMB examiner with detailed feedback, corrections, and a rewritten paragraph.
            </p>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#444" }}>Essay prompt or topic (optional)</label>
            <input value={essayPrompt} onChange={(e) => setEssayPrompt(e.target.value)}
              placeholder="e.g. Write an essay on the importance of education"
              className="w-full rounded-lg p-3 text-sm outline-none"
              style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#aaa"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#e0e0e0"; }} />
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#444" }}>Your essay</label>
            <textarea value={essay} onChange={(e) => setEssay(e.target.value)}
              placeholder="Write or paste your essay here..."
              rows={12} className="w-full rounded-lg p-4 text-sm outline-none resize-none"
              style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111", lineHeight: 1.8 }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#aaa"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#e0e0e0"; }} />
            <div className="flex justify-between mt-1">
              <span className="text-[0.625rem]" style={{ color: wordCount < 100 ? "#dc2626" : "#bbb" }}>
                {wordCount} words {wordCount < 100 && "(aim for 250+)"}
              </span>
              <span className="text-[0.625rem]" style={{ color: "#bbb" }}>{essay.length.toLocaleString()} chars</span>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#444" }}>Exam type</label>
            <div className="flex gap-2">
              {[
                { value: "jamb", label: "JAMB", sub: "Out of 40" },
                { value: "waec", label: "WAEC", sub: "Out of 20" },
                { value: "general", label: "General", sub: "Out of 100" },
              ].map(({ value, label, sub }) => (
                <button key={value} onClick={() => setEssayType(value)}
                  className="flex-1 rounded-lg py-2.5 text-center transition-all"
                  style={{
                    background: essayType === value ? "#111" : "#fff",
                    color: essayType === value ? "#fff" : "#555",
                    border: `1px solid ${essayType === value ? "#111" : "#e0e0e0"}`,
                  }}>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[0.5625rem] mt-0.5" style={{ color: essayType === value ? "rgba(255,255,255,0.5)" : "#bbb" }}>{sub}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm mb-3 text-center" style={{ color: "#dc2626" }}>{error}</p>}

          <button onClick={handleGrade} disabled={essay.trim().length < 50}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-all"
            style={{ background: "#111", color: "#fff", opacity: essay.trim().length < 50 ? 0.35 : 1 }}>
            Grade My Essay
          </button>
        </div>
      )}

      {phase === "grading" && (
        <div className="flex flex-col items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin mb-3" style={{ color: "#e11d48" }} />
          <p className="text-sm" style={{ color: "#555" }}>Analyzing content, grammar, structure, and style...</p>
        </div>
      )}

      {phase === "result" && result && (
        <div>
          {/* Score */}
          <div className="rounded-xl p-6 mb-5 text-center" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
            <p className="text-[0.625rem] uppercase tracking-wider mb-2" style={{ color: "#aaa" }}>Overall Score</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "3rem", lineHeight: 1, color: scoreColor(result.overallScore, result.maxScore) }}>
              {result.overallScore}
            </p>
            <p className="text-sm mt-1" style={{ color: "#aaa" }}>out of {result.maxScore}</p>
            <div className="inline-block mt-2.5 rounded-md px-3 py-1" style={{ background: "#f5f5f5" }}>
              <span className="text-base font-bold" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{result.grade}</span>
            </div>
            <p className="text-sm mt-3 mx-auto max-w-md" style={{ color: "#555", lineHeight: 1.6 }}>{result.summary}</p>
            <p className="text-xs mt-1.5" style={{ color: "#ccc" }}>{result.wordCount} words</p>
          </div>

          {/* Categories */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
            <p className="text-xs font-medium mb-3" style={{ color: "#666" }}>Score Breakdown</p>
            <div className="space-y-3">
              {result.categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: "#333" }}>{cat.name}</span>
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: scoreColor(cat.score, cat.maxScore) }}>
                      {cat.score}/{cat.maxScore}
                    </span>
                  </div>
                  <div style={{ height: 3, borderRadius: 99, background: "#eee" }}>
                    <div style={{ width: `${(cat.score / cat.maxScore) * 100}%`, height: "100%", borderRadius: 99, background: scoreColor(cat.score, cat.maxScore), transition: "width 0.5s" }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#888", lineHeight: 1.5 }}>{cat.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "#666" }}>Strengths</p>
            <div className="space-y-1.5">
              {result.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                  <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "#666" }}>Areas to Improve</p>
            <div className="space-y-1.5">
              {result.improvements.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
                  <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Corrections */}
          {result.corrections.length > 0 && (
            <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <p className="text-xs font-medium mb-3" style={{ color: "#666" }}>Grammar Corrections</p>
              <div className="space-y-2.5">
                {result.corrections.map((c, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ background: "#fafafa" }}>
                    <div className="flex items-start gap-2 mb-1">
                      <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                      <p className="text-sm" style={{ color: "#991b1b", textDecoration: "line-through" }}>{c.original}</p>
                    </div>
                    <div className="flex items-start gap-2 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                      <p className="text-sm" style={{ color: "#166534" }}>{c.corrected}</p>
                    </div>
                    <p className="text-[0.625rem] ml-6 mt-0.5" style={{ color: "#aaa" }}>{c.rule}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewritten */}
          {result.rewrittenParagraph && (
            <div className="rounded-xl p-4 mb-5" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "#666" }}>Improved version of your weakest paragraph</p>
              <p className="text-sm" style={{ color: "#333", lineHeight: 1.7, fontStyle: "italic" }}>
                "{result.rewrittenParagraph}"
              </p>
            </div>
          )}

          <div className="flex gap-2.5">
            <button onClick={resetAll} className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm"
              style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555" }}>
              <RotateCcw className="h-3.5 w-3.5" /> Grade Another
            </button>
            <button onClick={() => { setPhase("write"); setResult(null); }}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
              style={{ background: "#111", color: "#fff" }}>
              <PenTool className="h-3.5 w-3.5" /> Revise & Regrade
            </button>
          </div>
        </div>
      )}

      <PageFooter />
    </div>
  );
}

export default function EssayGraderPage() {
  const header = <FeatureHeader title="Essay Grader" icon={<PenTool className="h-4 w-4" style={{ color: "#e11d48" }} />} />;
  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      {header}
      <FeatureGate feature="essay" header={header}>
        <EssayGraderContent />
      </FeatureGate>
    </div>
  );
}