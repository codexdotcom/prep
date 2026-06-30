"use client";

import { useState, useRef } from "react";
import { Sparkles, Upload, FileText, Loader2, CheckCircle2, XCircle, ChevronRight, ChevronLeft, RotateCcw, Trash2 } from "lucide-react";
import { FeatureGate } from "@/components/ui/feature-gate";
import { FeatureHeader } from "@/components/ui/feature-header";
import { PageFooter } from "@/components/ui/page-footer";
import { useUsage } from "@/hooks/use-usage";

interface QuizQuestion { id: number; body: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string; difficulty: string }
interface Quiz { title: string; questions: QuizQuestion[] }
type Phase = "upload" | "generating" | "taking" | "results";

function QuizFetchContent() {
  const usage = useUsage("quizfetch");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("MIXED");
  const [phase, setPhase] = useState<Phase>("upload");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  const handleGenerate = async () => {
    if (!text.trim() && !file) { setError("Paste some text or upload a file first."); return; }
    setError(""); setPhase("generating");
    try {
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      if (file) formData.append("file", file);
      formData.append("questionCount", String(questionCount));
      formData.append("difficulty", difficulty);
      const res = await fetch("/api/quizfetch", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setQuiz(data); setAnswers({}); setShowExplanation({}); setCurrentQ(0); setPhase("taking");
      await usage.record();
    } catch (err: any) { setError(err.message); setPhase("upload"); }
  };

  const selectAnswer = (qId: number, opt: string) => {
    if (answers[qId]) return;
    setAnswers((p) => ({ ...p, [qId]: opt }));
    setShowExplanation((p) => ({ ...p, [qId]: true }));
  };

  const score = quiz ? quiz.questions.filter((q) => answers[q.id] === q.correctOption).length : 0;

  const resetAll = () => { setPhase("upload"); setQuiz(null); setText(""); setFile(null); setAnswers({}); setShowExplanation({}); setCurrentQ(0); setError(""); };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      

      {phase === "upload" && (
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-semibold" style={{ color: "#111" }}>Turn any content into a quiz</h1>
            <p className="text-sm mt-1" style={{ color: "#888" }}>Paste notes or upload a document. AI generates practice questions.</p>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#444" }}>Study material</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Paste notes, textbook excerpts, or any content you want quizzed on..."
              rows={7} className="w-full rounded-xl p-4 text-sm outline-none resize-none"
              style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111", lineHeight: 1.6 }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#aaa"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#e0e0e0"; }} />
          </div>

          <div className="mb-5">
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
            {file ? (
              <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
                <FileText className="h-4 w-4 shrink-0" style={{ color: "#a855f7" }} />
                <span className="text-sm flex-1 truncate" style={{ color: "#111" }}>{file.name}</span>
                <button onClick={() => setFile(null)} style={{ color: "#bbb" }}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-3.5 text-sm transition-colors"
                style={{ border: "1px dashed #d0d0d0", color: "#999", background: "#fcfcfc" }}>
                <Upload className="h-4 w-4" /> Or upload a file (PDF, TXT)
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#444" }}>Questions</label>
              <select value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full rounded-lg p-2.5 text-sm outline-none" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}>
                {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#444" }}>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-lg p-2.5 text-sm outline-none" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}>
                {["MIXED", "EASY", "MEDIUM", "HARD"].map((d) => <option key={d} value={d}>{d[0] + d.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-sm mb-3 text-center" style={{ color: "#dc2626" }}>{error}</p>}

          <button onClick={handleGenerate} disabled={!text.trim() && !file}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-all"
            style={{ background: "#111", color: "#fff", opacity: (!text.trim() && !file) ? 0.35 : 1 }}>
            Generate Quiz
          </button>
        </div>
      )}

      {phase === "generating" && (
        <div className="flex flex-col items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin mb-3" style={{ color: "#a855f7" }} />
          <p className="text-sm" style={{ color: "#555" }}>Creating questions from your content...</p>
        </div>
      )}

      {phase === "taking" && quiz && (() => {
        const q = quiz.questions[currentQ];
        const answered = answers[q.id] !== undefined;
        const isCorrect = answers[q.id] === q.correctOption;
        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#aaa" }}>{currentQ + 1} / {quiz.questions.length}</span>
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{score} correct</span>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: "#eee", marginBottom: 20 }}>
              <div style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%`, height: "100%", borderRadius: 99, background: "#111", transition: "width 0.3s" }} />
            </div>

            <p className="text-[0.9375rem] mb-5" style={{ color: "#111", lineHeight: 1.65 }}>{q.body}</p>

            <div className="space-y-2 mb-5">
              {(["A", "B", "C", "D"] as const).map((key) => {
                const optKey = `option${key}` as keyof typeof q;
                const isSelected = answers[q.id] === key;
                const isAnswer = q.correctOption === key;
                let bg = "#fff"; let border = "1px solid #e8e8e8"; let tc = "#333";
                if (answered && isAnswer) { bg = "#f0fdf4"; border = "1px solid #86efac"; tc = "#166534"; }
                else if (answered && isSelected && !isCorrect) { bg = "#fef2f2"; border = "1px solid #fca5a5"; tc = "#991b1b"; }
                return (
                  <button key={key} onClick={() => selectAnswer(q.id, key)} disabled={answered}
                    className="w-full flex items-start gap-3 rounded-lg p-3.5 text-left transition-all"
                    style={{ background: bg, border }}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-semibold"
                      style={{ fontFamily: "var(--font-mono)", background: answered && isAnswer ? "#22c55e" : answered && isSelected ? "#ef4444" : "#f3f3f3", color: answered && (isAnswer || isSelected) ? "#fff" : "#666" }}>
                      {answered && isAnswer ? <CheckCircle2 className="h-3.5 w-3.5" /> : answered && isSelected && !isCorrect ? <XCircle className="h-3.5 w-3.5" /> : key}
                    </span>
                    <span className="text-sm pt-0.5" style={{ color: tc }}>{q[optKey] as string}</span>
                  </button>
                );
              })}
            </div>

            {showExplanation[q.id] && (
              <div className="rounded-lg p-3.5 mb-5" style={{ background: "#f9f9f9", border: "1px solid #eee" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "#666" }}>Explanation</p>
                <p className="text-sm" style={{ color: "#444", lineHeight: 1.6 }}>{q.explanation}</p>
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setCurrentQ((i) => Math.max(0, i - 1))} disabled={currentQ <= 0}
                className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm"
                style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555", opacity: currentQ <= 0 ? 0.3 : 1 }}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              {currentQ < quiz.questions.length - 1 ? (
                <button onClick={() => setCurrentQ((i) => i + 1)}
                  className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold" style={{ background: "#111", color: "#fff" }}>
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={() => setPhase("results")}
                  className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#111", color: "#fff" }}>Finish</button>
              )}
            </div>
          </div>
        );
      })()}

      {phase === "results" && quiz && (
        <div>
          <div className="text-center mb-8">
            <p className="text-3xl mb-1" style={{ fontFamily: "var(--font-display)", color: "#111" }}>{score}/{quiz.questions.length}</p>
            <p className="text-sm" style={{ color: "#888" }}>{Math.round((score / quiz.questions.length) * 100)}% correct</p>
          </div>
          <div className="space-y-2 mb-6">
            {quiz.questions.map((q) => {
              const ans = answers[q.id]; const correct = ans === q.correctOption;
              return (
                <div key={q.id} className="rounded-lg p-3.5" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
                  <div className="flex items-start gap-2">
                    {correct ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#22c55e" }} /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{q.body}</p>
                      {!correct && <p className="text-xs mt-1" style={{ color: "#aaa" }}>Your answer: {ans || "skipped"} | Correct: {q.correctOption}</p>}
                      <p className="text-xs mt-1" style={{ color: "#888" }}>{q.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2.5">
            <button onClick={resetAll} className="flex-1 rounded-lg py-2.5 text-sm" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555" }}>New Quiz</button>
            <button onClick={() => { setAnswers({}); setShowExplanation({}); setCurrentQ(0); setPhase("taking"); }}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold" style={{ background: "#111", color: "#fff" }}>Retake</button>
          </div>
        </div>
      )}

      <PageFooter />
    </div>
  );
}

export default function QuizFetchPage() {
  const header = <FeatureHeader title="QuizFetch" icon={<Sparkles className="h-4 w-4" style={{ color: "#a855f7" }} />} />;
  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      {header}
      <FeatureGate feature="quizfetch" header={header}>
        <QuizFetchContent />
      </FeatureGate>
    </div>
  );
}