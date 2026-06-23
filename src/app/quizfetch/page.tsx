"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Sparkles, Upload, FileText, Loader2, CheckCircle2,
  XCircle, ChevronRight, ChevronLeft, RotateCcw, Trash2, Copy,
} from "lucide-react";

interface QuizQuestion {
  id: number;
  body: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
  difficulty: string;
}

interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

type Phase = "upload" | "generating" | "review" | "taking" | "results";

export default function QuizFetchPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("MIXED");

  // Quiz state
  const [phase, setPhase] = useState<Phase>("upload");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState("");

  // Taking state
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  const handleGenerate = async () => {
    if (!text.trim() && !file) {
      setError("Paste some text or upload a file first.");
      return;
    }
    setError("");
    setPhase("generating");

    try {
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      if (file) formData.append("file", file);
      formData.append("questionCount", String(questionCount));
      formData.append("difficulty", difficulty);

      const res = await fetch("/api/quizfetch", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate");

      setQuiz(data);
      setPhase("review");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setPhase("upload");
    }
  };

  const startQuiz = () => {
    setAnswers({});
    setShowExplanation({});
    setCurrentQ(0);
    setPhase("taking");
  };

  const selectAnswer = (questionId: number, option: string) => {
    if (answers[questionId]) return; // already answered
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    setShowExplanation((prev) => ({ ...prev, [questionId]: true }));
  };

  const finishQuiz = () => setPhase("results");

  const resetAll = () => {
    setPhase("upload");
    setQuiz(null);
    setText("");
    setFile(null);
    setAnswers({});
    setShowExplanation({});
    setCurrentQ(0);
    setError("");
  };

  const score = quiz ? quiz.questions.filter((q) => answers[q.id] === q.correctOption).length : 0;
  const totalAnswered = Object.keys(answers).length;

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/tutor")} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "#a855f7" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>QuizFetch</span>
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">

        {/* ═══ UPLOAD PHASE ═══ */}
        {phase === "upload" && (
          <div>
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#f5f5f5" }}>
                <Sparkles className="h-7 w-7" style={{ color: "#a855f7" }} />
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>
                Turn any content into a quiz
              </h1>
              <p className="mt-2 text-sm mx-auto max-w-sm" style={{ color: "#777", lineHeight: 1.6 }}>
                Paste your notes, upload a document, or enter any study material. AI generates practice questions instantly.
              </p>
            </div>

            {/* Text input */}
            <div className="mb-4">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Paste your study material</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste notes, textbook content, lecture transcripts..."
                rows={8}
                className="w-full rounded-xl p-4 text-sm outline-none resize-none"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#111", lineHeight: 1.6 }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#999"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#ddd"; }}
              />
              <p className="text-[0.625rem] mt-1 text-right" style={{ color: "#bbb" }}>
                {text.length.toLocaleString()} characters
              </p>
            </div>

            {/* File upload */}
            <div className="mb-6">
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.doc,.docx" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />

              {file ? (
                <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#fff", border: "1px solid #eee" }}>
                  <FileText className="h-5 w-5 shrink-0" style={{ color: "#a855f7" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#111" }}>{file.name}</p>
                    <p className="text-[0.625rem]" style={{ color: "#999" }}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="p-1" style={{ color: "#999" }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-4 transition-all"
                  style={{ background: "#fff", border: "2px dashed #ddd", color: "#999" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#bbb"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ddd"; }}
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload PDF, TXT, or Markdown</span>
                </button>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Questions</label>
                <select value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full rounded-xl p-3 text-sm outline-none" style={{ background: "#fff", border: "1px solid #ddd", color: "#111", appearance: "none" }}>
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm outline-none" style={{ background: "#fff", border: "1px solid #ddd", color: "#111", appearance: "none" }}>
                  <option value="MIXED">Mixed</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-sm mb-4 text-center" style={{ color: "#ef4444" }}>{error}</p>
            )}

            <button onClick={handleGenerate} disabled={!text.trim() && !file}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all"
              style={{ background: "#111", color: "#fff", opacity: (!text.trim() && !file) ? 0.4 : 1 }}>
              <Sparkles className="h-4 w-4" /> Generate Quiz
            </button>
          </div>
        )}

        {/* ═══ GENERATING PHASE ═══ */}
        {phase === "generating" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: "#a855f7" }} />
            <p className="text-sm font-medium" style={{ color: "#111" }}>Generating your quiz...</p>
            <p className="text-xs mt-1" style={{ color: "#999" }}>AI is reading your content and creating questions</p>
          </div>
        )}

        {/* ═══ REVIEW PHASE ═══ */}
        {phase === "review" && quiz && (
          <div>
            <div className="text-center mb-6">
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>{quiz.title}</h1>
              <p className="text-sm mt-1" style={{ color: "#777" }}>{quiz.questions.length} questions ready</p>
            </div>

            {/* Preview questions */}
            <div className="space-y-2 mb-6">
              {quiz.questions.map((q, i) => {
                const ds = q.difficulty === "EASY" ? "#22c55e" : q.difficulty === "HARD" ? "#ef4444" : "#f59e0b";
                return (
                  <div key={q.id} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold shrink-0 mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "#bbb" }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{q.body}</p>
                        <span className="text-[0.5625rem] font-semibold mt-1 inline-block" style={{ color: ds }}>{q.difficulty}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={resetAll} className="flex-1 rounded-xl py-3 text-sm font-medium" style={{ background: "#fff", border: "1px solid #ddd", color: "#555" }}>
                Start Over
              </button>
              <button onClick={startQuiz} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold" style={{ background: "#111", color: "#fff" }}>
                <Sparkles className="h-4 w-4" /> Take Quiz
              </button>
            </div>
          </div>
        )}

        {/* ═══ TAKING PHASE ═══ */}
        {phase === "taking" && quiz && (
          <div>
            {/* Progress */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#999" }}>
                {currentQ + 1} / {quiz.questions.length}
              </span>
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>
                {score} correct
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 9999, background: "#eee", marginBottom: 24 }}>
              <div style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%`, height: "100%", borderRadius: 9999, background: "#111", transition: "width 0.3s" }} />
            </div>

            {/* Question */}
            {(() => {
              const q = quiz.questions[currentQ];
              const answered = answers[q.id] !== undefined;
              const isCorrect = answers[q.id] === q.correctOption;

              return (
                <div key={q.id}>
                  <p className="text-base mb-6" style={{ color: "#111", lineHeight: 1.6 }}>{q.body}</p>

                  <div className="space-y-2 mb-6">
                    {(["A", "B", "C", "D"] as const).map((key) => {
                      const optionKey = `option${key}` as keyof QuizQuestion;
                      const isSelected = answers[q.id] === key;
                      const isAnswer = q.correctOption === key;

                      let bg = "#fff";
                      let border = "1px solid #eee";
                      let textColor = "#333";

                      if (answered) {
                        if (isAnswer) { bg = "#f0fdf4"; border = "1px solid #bbf7d0"; textColor = "#166534"; }
                        else if (isSelected && !isCorrect) { bg = "#fef2f2"; border = "1px solid #fecaca"; textColor = "#991b1b"; }
                      } else if (isSelected) {
                        bg = "#f5f5f5"; border = "1px solid #ccc";
                      }

                      return (
                        <button
                          key={key}
                          onClick={() => selectAnswer(q.id, key)}
                          disabled={answered}
                          className="w-full flex items-start gap-3 rounded-xl p-4 text-left transition-all"
                          style={{ background: bg, border }}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                            style={{
                              fontFamily: "var(--font-mono)",
                              background: answered && isAnswer ? "#22c55e" : answered && isSelected ? "#ef4444" : "#f5f5f5",
                              color: answered && (isAnswer || isSelected) ? "#fff" : "#555",
                            }}>
                            {answered && isAnswer ? <CheckCircle2 className="h-4 w-4" /> : answered && isSelected && !isCorrect ? <XCircle className="h-4 w-4" /> : key}
                          </span>
                          <span className="text-sm leading-relaxed pt-0.5" style={{ color: textColor }}>{q[optionKey] as string}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {showExplanation[q.id] && (
                    <div className="rounded-xl p-4 mb-6" style={{ background: "#f8f8f8", border: "1px solid #eee" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#555" }}>Explanation</p>
                      <p className="text-sm" style={{ color: "#555", lineHeight: 1.6 }}>{q.explanation}</p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <button onClick={() => setCurrentQ((i) => Math.max(0, i - 1))} disabled={currentQ <= 0}
                      className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium"
                      style={{ background: "#fff", border: "1px solid #ddd", color: "#555", opacity: currentQ <= 0 ? 0.3 : 1 }}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    {currentQ < quiz.questions.length - 1 ? (
                      <button onClick={() => setCurrentQ((i) => i + 1)}
                        className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold"
                        style={{ background: "#111", color: "#fff" }}>
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={finishQuiz}
                        className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold"
                        style={{ background: "#111", color: "#fff" }}>
                        Finish
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══ RESULTS PHASE ═══ */}
        {phase === "results" && quiz && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "#f5f5f5" }}>
              {score >= quiz.questions.length * 0.8 ? "🎯" : score >= quiz.questions.length * 0.5 ? "💪" : "📚"}
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>
              {score >= quiz.questions.length * 0.8 ? "Excellent!" : score >= quiz.questions.length * 0.5 ? "Good effort!" : "Keep studying!"}
            </h1>
            <p className="mt-2" style={{ fontFamily: "var(--font-display)", fontSize: "3rem", color: "#111", lineHeight: 1 }}>
              {score}/{quiz.questions.length}
            </p>
            <p className="text-sm mt-1" style={{ color: "#777" }}>
              {Math.round((score / quiz.questions.length) * 100)}% correct
            </p>

            {/* Per-question review */}
            <div className="mt-8 space-y-2 text-left">
              {quiz.questions.map((q, i) => {
                const answered = answers[q.id];
                const correct = answered === q.correctOption;
                return (
                  <div key={q.id} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                    <div className="flex items-start gap-2">
                      {correct
                        ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                        : <XCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{q.body}</p>
                        {!correct && (
                          <p className="text-xs mt-1" style={{ color: "#999" }}>
                            Your answer: {answered || "skipped"} - Correct: {q.correctOption}
                          </p>
                        )}
                        <p className="text-xs mt-1" style={{ color: "#777" }}>{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={resetAll} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#555" }}>
                <RotateCcw className="h-4 w-4" /> New Quiz
              </button>
              <button onClick={startQuiz} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                style={{ background: "#111", color: "#fff" }}>
                Retake
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 text-center" style={{ borderTop: "1px solid #eee" }}>
          <div className="flex items-center justify-center gap-0.5 mb-3">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111" }}>Jamb</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111", fontWeight: 700 }}>OS</span>
          </div>
          <p className="text-xs" style={{ color: "#bbb" }}>
            &copy; {new Date().getFullYear()} JambOS. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}