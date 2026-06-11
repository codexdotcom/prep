"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Loader2, GraduationCap, ChevronRight, Clock,
  CheckCircle2, XCircle, Play, MapPin, BookOpen, BarChart3,
  ArrowRight, RotateCcw, Trophy, AlertTriangle,
} from "lucide-react";

interface University {
  id: string;
  name: string;
  shortName: string;
  state: string;
  type: string;
  examCount: number;
}

interface Exam {
  id: string;
  university: string;
  universityShort: string;
  year: number;
  course: string | null;
  duration: number;
  totalQuestions: number;
  attempted: boolean;
  lastScore: number | null;
}

interface QuestionItem {
  id: string;
  subject: string;
  body: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface ReviewItem extends QuestionItem {
  correctOption: string;
  selectedOption: string | null;
  isCorrect: boolean;
  explanation: string | null;
}

type Phase = "universities" | "exams" | "test" | "result";

export default function PostUtmePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("universities");

  // Universities
  const [universities, setUniversities] = useState<University[]>([]);
  const [uniSearch, setUniSearch] = useState("");
  const [uniLoading, setUniLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  // Exams
  const [exams, setExams] = useState<Exam[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);

  // Test
  const [sessionId, setSessionId] = useState("");
  const [examMeta, setExamMeta] = useState<any>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedOption: string; timeSpent: number }>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Result
  const [result, setResult] = useState<{ score: number; totalCorrect: number; totalQuestions: number; review: ReviewItem[] } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct">("all");

  // Load universities
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/post-utme/universities");
        const data = await res.json();
        setUniversities(data.universities || []);
      } catch {} finally { setUniLoading(false); }
    }
    load();
  }, []);

  const filteredUnis = universities.filter((u) =>
    !uniSearch || u.name.toLowerCase().includes(uniSearch.toLowerCase()) || u.shortName.toLowerCase().includes(uniSearch.toLowerCase()) || u.state.toLowerCase().includes(uniSearch.toLowerCase())
  );

  // Load exams for selected university
  const selectUniversity = async (uni: University) => {
    setSelectedUni(uni);
    setPhase("exams");
    setExamsLoading(true);
    try {
      const res = await fetch(`/api/post-utme/exams?universityId=${uni.id}`);
      const data = await res.json();
      setExams(data.exams || []);
    } catch {} finally { setExamsLoading(false); }
  };

  // Start exam
  const startExam = async (examId: string) => {
    try {
      const res = await fetch("/api/post-utme/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.sessionId);
        setExamMeta(data.exam);
        setQuestions(data.questions);
        setAnswers({});
        setCurrentQ(0);
        setTimeLeft(data.exam.duration * 60);
        setTestStarted(true);
        setPhase("test");
      }
    } catch { alert("Failed to start exam"); }
  };

  // Timer
  useEffect(() => {
    if (!testStarted || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(t); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [testStarted]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const selectAnswer = (qId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: { selectedOption: option, timeSpent: 0 } }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setTestStarted(false);
    try {
      const answerList = Object.entries(answers).map(([questionId, a]) => ({ questionId, ...a }));
      const res = await fetch("/api/post-utme/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers: answerList }),
      });
      const data = await res.json();
      if (res.ok) { setResult(data); setPhase("result"); }
    } catch { alert("Submit failed"); }
    finally { setSubmitting(false); }
  };

  const getScoreColor = (s: number) => s >= 70 ? "var(--color-accent-green)" : s >= 50 ? "var(--color-warning-400)" : "var(--color-danger-400)";

  const goBack = () => {
    if (phase === "exams") { setPhase("universities"); setSelectedUni(null); }
    else if (phase === "result") { setPhase("exams"); setResult(null); setShowReview(false); }
    else router.push("/dashboard");
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      {/* Header */}
      {phase !== "test" && (
        <header className="sticky top-0 z-30" style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)", backdropFilter: "blur(12px)" }}>
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <button onClick={goBack} className="btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {phase === "universities" ? "Post-UTME Prep" : phase === "exams" ? selectedUni?.shortName : "Results"}
            </span>
            <div />
          </div>
        </header>
      )}

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* ═══ UNIVERSITY SELECTION ═══ */}
        {phase === "universities" && (
          <>
            <div className="text-center mb-5">
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>Post-UTME Preparation</h1>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>Select your university to practice past Post-UTME questions</p>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
              <input value={uniSearch} onChange={(e) => setUniSearch(e.target.value)} placeholder="Search universities..." className="input-field pl-10" />
            </div>

            {uniLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
            ) : filteredUnis.length === 0 ? (
              <div className="card text-center py-12">
                <GraduationCap className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                  {uniSearch ? "No universities match your search" : "No universities available yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUnis.map((uni) => (
                  <button key={uni.id} onClick={() => selectUniversity(uni)}
                    className="w-full text-left rounded-xl p-4 transition-all group"
                    style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.25)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-surface-border)"; }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(34,197,94,0.06)" }}>
                        <GraduationCap className="h-5 w-5" style={{ color: "var(--color-accent-green)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{uni.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <MapPin className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} />
                          <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>{uni.state}</span>
                          {uni.examCount > 0 && (
                            <>
                              <span style={{ color: "var(--color-text-muted)", fontSize: "0.5rem" }}>|</span>
                              <span className="text-[0.5625rem]" style={{ color: "var(--color-accent-green)" }}>{uni.examCount} exams available</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--color-accent-green)" }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ EXAM LIST ═══ */}
        {phase === "exams" && (
          <>
            <div className="mb-5">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
                {selectedUni?.shortName} Post-UTME
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>{selectedUni?.name}</p>
            </div>

            {examsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
            ) : exams.length === 0 ? (
              <div className="card text-center py-12">
                <BookOpen className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>No Post-UTME exams available for this university yet</p>
                <button onClick={() => setPhase("universities")} className="btn-secondary mt-4">Try another university</button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {exams.map((exam) => (
                  <div key={exam.id} className="rounded-xl p-4" style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          {exam.universityShort} {exam.year}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {exam.course && <span className="text-[0.5625rem]" style={{ color: "var(--color-accent-green)" }}>{exam.course}</span>}
                          <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                            {exam.totalQuestions} questions · {exam.duration} mins
                          </span>
                        </div>
                      </div>
                      {exam.attempted && exam.lastScore !== null && (
                        <div className="text-right">
                          <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: getScoreColor(exam.lastScore) }}>{exam.lastScore}%</p>
                          <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>Last attempt</p>
                        </div>
                      )}
                    </div>

                    <button onClick={() => startExam(exam.id)} className="btn-primary w-full" style={{ padding: "0.625rem" }}>
                      <Play className="h-3.5 w-3.5" />
                      {exam.attempted ? "Retry" : "Start Exam"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ TEST IN PROGRESS ═══ */}
        {phase === "test" && questions.length > 0 && (
          <div>
            {/* Test header */}
            <div className="sticky top-0 z-30 -mx-4 px-4 py-3 mb-4" style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{examMeta?.universityShort} {examMeta?.year}</p>
                  <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>Question {currentQ + 1} of {questions.length}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" style={{ color: timeLeft < 300 ? "var(--color-danger-400)" : "var(--color-warning-400)" }} />
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: timeLeft < 300 ? "var(--color-danger-400)" : "var(--color-warning-400)" }}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-2" style={{ height: "3px", borderRadius: "9999px", background: "var(--color-surface-lighter)" }}>
                <div style={{ width: `${((currentQ + 1) / questions.length) * 100}%`, height: "100%", borderRadius: "9999px", background: "var(--color-accent-green)", transition: "width 0.3s" }} />
              </div>
            </div>

            {/* Question */}
            {(() => {
              const q = questions[currentQ];
              const selected = answers[q.id]?.selectedOption;
              return (
                <div>
                  {q.subject && (
                    <span className="text-[0.5625rem] rounded-full px-2 py-0.5 mb-3 inline-block"
                      style={{ background: "rgba(34,197,94,0.08)", color: "var(--color-accent-green)", border: "1px solid rgba(34,197,94,0.15)" }}>
                      {q.subject}
                    </span>
                  )}
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-text-primary)" }}>{q.body}</p>
                  {q.imageUrl && <img src={q.imageUrl} alt="" className="rounded-xl max-h-48 mb-4 mx-auto" />}

                  <div className="space-y-2 mb-6">
                    {(["A", "B", "C", "D"] as const).map((key) => {
                      const optionText = (q as any)[`option${key}`];
                      const isSelected = selected === key;
                      return (
                        <button key={key} onClick={() => selectAnswer(q.id, key)}
                          className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all"
                          style={{
                            background: isSelected ? "rgba(34,197,94,0.06)" : "var(--color-surface-card)",
                            border: `1.5px solid ${isSelected ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                          }}>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                            style={{
                              fontFamily: "var(--font-mono)",
                              background: isSelected ? "var(--color-accent-green)" : "var(--color-surface-lighter)",
                              color: isSelected ? "white" : "var(--color-text-muted)",
                            }}>
                            {key}
                          </span>
                          <span className="text-sm" style={{ color: isSelected ? "var(--color-accent-green)" : "var(--color-text-secondary)" }}>
                            {optionText}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-2">
                    {currentQ > 0 && (
                      <button onClick={() => setCurrentQ((i) => i - 1)} className="btn-secondary flex-1">
                        <ArrowLeft className="h-4 w-4" /> Previous
                      </button>
                    )}
                    {currentQ < questions.length - 1 ? (
                      <button onClick={() => setCurrentQ((i) => i + 1)} className="btn-primary flex-1">
                        Next <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={handleSubmit} disabled={submitting}
                        className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
                        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "var(--color-accent-green)" }}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Submit Exam
                      </button>
                    )}
                  </div>

                  {/* Question dots */}
                  <div className="flex flex-wrap gap-1.5 mt-6 justify-center">
                    {questions.map((_, i) => (
                      <button key={i} onClick={() => setCurrentQ(i)}
                        className="h-6 w-6 rounded-md text-[0.5rem] font-bold transition-all"
                        style={{
                          fontFamily: "var(--font-mono)",
                          background: i === currentQ ? "var(--color-accent-green)" : answers[questions[i].id] ? "rgba(34,197,94,0.15)" : "var(--color-surface-lighter)",
                          color: i === currentQ ? "white" : answers[questions[i].id] ? "var(--color-accent-green)" : "var(--color-text-muted)",
                        }}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {phase === "result" && result && (
          <>
            {/* Score card */}
            <div className="rounded-2xl p-6 mb-5 text-center" style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}>
              <Trophy className="mx-auto mb-3 h-8 w-8" style={{ color: getScoreColor(result.score) }} />
              <p style={{ fontFamily: "var(--font-display)", fontSize: "3rem", lineHeight: 1, color: getScoreColor(result.score) }}>
                {result.score}%
              </p>
              <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>
                {result.totalCorrect} of {result.totalQuestions} correct
              </p>
              <div className="mt-4" style={{ height: "6px", borderRadius: "9999px", background: "var(--color-surface-lighter)" }}>
                <div style={{ width: `${result.score}%`, height: "100%", borderRadius: "9999px", background: getScoreColor(result.score), transition: "width 1s" }} />
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              <button onClick={() => setShowReview(!showReview)}
                className="btn-secondary flex-1">
                <BarChart3 className="h-4 w-4" /> {showReview ? "Hide" : "Review"} Answers
              </button>
              <button onClick={() => setPhase("exams")} className="btn-primary flex-1">
                <RotateCcw className="h-4 w-4" /> Try Again
              </button>
            </div>

            {/* Review */}
            {showReview && (
              <>
                <div className="flex gap-1 mb-4 p-0.5 rounded-lg" style={{ background: "var(--color-surface-light)" }}>
                  {(["all", "wrong", "correct"] as const).map((f) => (
                    <button key={f} onClick={() => setReviewFilter(f)}
                      className="flex-1 rounded-md py-1.5 text-xs font-semibold transition-all capitalize"
                      style={{ background: reviewFilter === f ? "var(--color-surface-card)" : "transparent", color: reviewFilter === f ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                      {f} {f === "wrong" ? `(${result.totalQuestions - result.totalCorrect})` : f === "correct" ? `(${result.totalCorrect})` : `(${result.totalQuestions})`}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {result.review
                    .filter((r) => reviewFilter === "all" || (reviewFilter === "correct" ? r.isCorrect : !r.isCorrect))
                    .map((r, i) => (
                      <div key={r.id} className="card p-4">
                        <div className="flex items-start gap-2 mb-2">
                          {r.isCorrect ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--color-accent-green)" }} />
                            : <XCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--color-danger-400)" }} />}
                          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{r.body}</p>
                        </div>

                        <div className="space-y-1 ml-6">
                          {(["A", "B", "C", "D"] as const).map((key) => {
                            const text = (r as any)[`option${key}`];
                            const isCorrect = r.correctOption === key;
                            const isSelected = r.selectedOption === key;
                            return (
                              <div key={key} className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg"
                                style={{
                                  background: isCorrect ? "rgba(34,197,94,0.06)" : isSelected && !isCorrect ? "rgba(239,68,68,0.06)" : "transparent",
                                }}>
                                <span className="font-bold w-4" style={{
                                  fontFamily: "var(--font-mono)",
                                  color: isCorrect ? "var(--color-accent-green)" : isSelected ? "var(--color-danger-400)" : "var(--color-text-muted)",
                                }}>{key}</span>
                                <span style={{ color: isCorrect ? "var(--color-accent-green)" : "var(--color-text-secondary)" }}>{text}</span>
                                {isCorrect && <CheckCircle2 className="h-3 w-3 ml-auto" style={{ color: "var(--color-accent-green)" }} />}
                                {isSelected && !isCorrect && <XCircle className="h-3 w-3 ml-auto" style={{ color: "var(--color-danger-400)" }} />}
                              </div>
                            );
                          })}
                        </div>

                        {r.explanation && (
                          <div className="mt-2 ml-6 rounded-lg p-2" style={{ background: "var(--color-surface-light)", border: "1px solid var(--color-surface-border)" }}>
                            <p className="text-[0.625rem]" style={{ color: "var(--color-text-tertiary)" }}>{r.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}