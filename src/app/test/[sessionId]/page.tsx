"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Clock, Flag, Loader2, AlertTriangle,
  CheckCircle2, XCircle, Calculator as CalcIcon, ChevronDown,
  Home, Eye, EyeOff, Brain, Zap,
} from "lucide-react";
import { Calculator } from "@/components/test/calculator";
import { DrillResults } from "@/components/test/drill-results";
import { ExamReport } from "@/components/test/exam-report";
import {
  createInitialState, getNextDifficulty, selectNextQuestion,
  type AdaptiveState,
} from "@/lib/adaptive-engine";
import katex from "katex";
import "katex/dist/katex.min.css";

interface Question {
  id: string;
  index: number;
  subject: string;
  topicId?: string;
  body: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty: string;
}

interface Section { subject: string; label: string; questionCount: number; startIndex: number }
interface Answer { selected: string | null; timeSpent: number; flagged: boolean }

interface ReviewItem {
  id: string;
  subject?: string;
  topicName: string;
  body: string;
  imageUrl?: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  selectedOption: string | null;
  isCorrect: boolean;
  explanation: string | null;
  explanationImageUrl: string | null;
  difficulty: string;
}

interface SubjectScore { subject: string; correct: number; total: number; answered: number; accuracy: number; score: number }
interface TopicScore { topicId: string; topicName: string; correct: number; total: number; answered: number; accuracy: number; mastered: boolean; needsWork: boolean }
interface TopicInsight { topicId: string; topicName: string; subject: string; before: number; after: number; correct: number; total: number; mastered: boolean; needsWork: boolean }
interface DifficultyProfile { easy: number; medium: number; hard: number; easyCorrect: number; mediumCorrect: number; hardCorrect: number }

type Phase = "test" | "confirm" | "result";
type SubmitStage = "idle" | "saving" | "analyzing" | "building" | "done";

function renderInline(text: string): string {
  if (!text) return "";
  let r = text;
  r = r.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => {
    try { return `<div style="margin:8px 0;text-align:center">${katex.renderToString(m.trim(), { displayMode: true, throwOnError: false })}</div>`; }
    catch { return m; }
  });
  r = r.replace(/\$(.+?)\$/g, (_, m) => {
    try { return katex.renderToString(m.trim(), { throwOnError: false }); }
    catch { return m; }
  });
  r = r.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  r = r.replace(/\*(.+?)\*/g, "<em>$1</em>");
  const lines = r.split("\n");
  let result = "";
  let tableRows: string[][] = [];
  const flushTable = () => {
    if (!tableRows.length) return;
    let h = '<table style="border-collapse:collapse;margin:8px 0;font-size:0.8125rem;width:100%">';
    tableRows.forEach((row, ri) => {
      if (row.every((c) => /^[-:]+$/.test(c.trim()))) return;
      const tag = ri === 0 ? "th" : "td";
      h += "<tr>";
      row.forEach((cell) => {
        h += `<${tag} style="border:1px solid #eee;padding:6px 8px;text-align:left;${ri === 0 ? "background:#f9f9f9;font-weight:600;" : ""}">${cell.trim()}</${tag}>`;
      });
      h += "</tr>";
    });
    h += "</table>";
    result += h;
    tableRows = [];
  };
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("|") && t.endsWith("|")) { tableRows.push(t.slice(1, -1).split("|")); }
    else { flushTable(); result += (t || "<br/>") + "\n"; }
  }
  flushTable();
  return result;
}

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const getScoreColor = (s: number) => s >= 70 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444";

export default function TestPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [phase, setPhase] = useState<Phase>("test");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [mode, setMode] = useState("");
  const [totalTime, setTotalTime] = useState(0);
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>(createInitialState());
  const [submitStage, setSubmitStage] = useState<SubmitStage>("idle");

  const [result, setResult] = useState<{
    score?: number;
    accuracy?: number;
    totalCorrect: number;
    totalAnswered: number;
    totalQuestions: number;
    subjectScores?: SubjectScore[];
    topicBreakdown?: TopicScore[];
    topicInsights?: TopicInsight[];
    difficultyProfile?: DifficultyProfile;
    review: ReviewItem[];
  } | null>(null);

  const qStartTime = useRef(Date.now());
  const questionMap = useMemo(() => new Map(allQuestions.map((q) => [q.id, q])), [allQuestions]);

  useEffect(() => {
    const stored = sessionStorage.getItem(`test-${sessionId}`);
    if (!stored) { router.push("/practice"); return; }
    const data = JSON.parse(stored);
    setAllQuestions(data.questions || []);
    setSections(data.sections || []);
    setMode(data.mode || "PRACTICE");
    setTotalTime(data.totalTime || 0);
    setTimeLeft((data.totalTime || 0) * 60);
    setIsAdaptive(!!data.adaptive);
    const qs = data.questions || [];
    setQuestionOrder(qs.map((q: Question) => q.id));
    const init: Record<string, Answer> = {};
    qs.forEach((q: Question) => { init[q.id] = { selected: null, timeSpent: 0, flagged: false }; });
    setAnswers(init);
    qStartTime.current = Date.now();
  }, [sessionId]);

  useEffect(() => {
    if (phase !== "test" || totalTime <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(t); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, totalTime]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const trackTime = () => {
    const currentQId = questionOrder[currentIdx];
    if (currentQId) {
      const elapsed = Math.round((Date.now() - qStartTime.current) / 1000);
      setAnswers((prev) => ({
        ...prev,
        [currentQId]: { ...prev[currentQId], timeSpent: (prev[currentQId]?.timeSpent || 0) + elapsed },
      }));
    }
    qStartTime.current = Date.now();
  };

  const goTo = (idx: number) => { trackTime(); setCurrentIdx(idx); };

  const selectAnswer = (qId: string, option: string) => {
    const currentAnswer = answers[qId]?.selected;
    const newSelected = currentAnswer === option ? null : option;
    setAnswers((prev) => ({ ...prev, [qId]: { ...prev[qId], selected: newSelected } }));

    if (isAdaptive && currentAnswer === null && newSelected !== null && mode !== "MOCK_EXAM") {
      const q = questionMap.get(qId);
      if (q) {
        const nextDiff = getNextDifficulty(adaptiveState);
        const answeredIds = new Set(Object.entries(answers).filter(([, a]) => a.selected).map(([id]) => id));
        answeredIds.add(qId);
        const remaining = allQuestions.filter((rq) => !answeredIds.has(rq.id)).map((rq) => ({ id: rq.id, difficulty: rq.difficulty }));
        const nextId = selectNextQuestion(remaining, nextDiff, answeredIds);
        if (nextId && currentIdx < questionOrder.length - 1) {
          setQuestionOrder((prev) => {
            const newOrder = [...prev];
            const nextIdx = currentIdx + 1;
            const existingIdx = newOrder.indexOf(nextId);
            if (existingIdx > nextIdx) {
              [newOrder[nextIdx], newOrder[existingIdx]] = [newOrder[existingIdx], newOrder[nextIdx]];
            }
            return newOrder;
          });
        }
      }
    }
  };

  const toggleFlag = (qId: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: { ...prev[qId], flagged: !prev[qId]?.flagged } }));
  };

  const handleSubmit = async () => {
    trackTime();
    setSubmitting(true);
    setSubmitStage("saving");

    try {
      const payload: Record<string, { selected: string | null; timeSpent: number }> = {};
      for (const [qId, ans] of Object.entries(answers)) {
        payload[qId] = { selected: ans.selected, timeSpent: ans.timeSpent };
      }

      const endpoint = mode === "TOPIC_DRILL" ? "/api/tests/drill/submit" : "/api/tests/submit";

      // Progress stages on timers (cleared when API responds)
      const t1 = setTimeout(() => setSubmitStage("analyzing"), 1200);
      const t2 = setTimeout(() => setSubmitStage("building"), 3000);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers: payload }),
      });
      const data = await res.json();

      clearTimeout(t1);
      clearTimeout(t2);

      if (res.ok) {
        setSubmitStage("done");
        setResult(data);
        setTimeout(() => {
          setPhase("result");
          sessionStorage.removeItem(`test-${sessionId}`);
        }, 700);
      } else {
        setSubmitStage("idle");
        alert(data.error || "Submit failed");
      }
    } catch {
      setSubmitStage("idle");
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const currentQId = questionOrder[currentIdx];
  const q = currentQId ? questionMap.get(currentQId) : null;
  const answeredCount = Object.values(answers).filter((a) => a.selected).length;
  const flaggedCount = Object.values(answers).filter((a) => a.flagged).length;
  const currentSection = sections.find((s, i) => {
    const next = sections[i + 1];
    return currentIdx >= s.startIndex && (!next || currentIdx < next.startIndex);
  });
  const isDrill = mode === "TOPIC_DRILL";
  const isMock = mode === "MOCK_EXAM";

  if (!q && phase === "test") return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#fafafa" }}>
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#22c55e" }} />
    </div>
  );

  // Submit stage config
  const stageConfig: Record<SubmitStage, { label: string; sub: string }> = {
    idle: { label: "", sub: "" },
    saving: { label: "Saving your answers...", sub: `Processing ${questionOrder.length} questions` },
    analyzing: { label: "Analyzing performance...", sub: "" },
    building: { label: "Building your report...", sub: "Generating insights and score prediction" },
    done: { label: "All done!", sub: "Your JAMB report is ready" },
  };
  const stages: SubmitStage[] = ["saving", "analyzing", "building", "done"];
  const currentStageIdx = stages.indexOf(submitStage);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fafafa" }}>
      {/* ═══════════════ TEST PHASE ═══════════════ */}
      {phase === "test" && q && (
        <>
          <header className="sticky top-0 z-40" style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #eee" }}>
            <div className="mx-auto max-w-4xl px-3 sm:px-4">
              <div className="flex items-center justify-between h-12">
                <div className="flex items-center gap-2.5">
                  {totalTime > 0 && (
                    <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                      style={{ background: timeLeft < 600 ? "#fef2f2" : timeLeft < 1800 ? "#fffbeb" : "#f9f9f9" }}>
                      <Clock className="h-3.5 w-3.5" style={{ color: timeLeft < 600 ? "#ef4444" : timeLeft < 1800 ? "#f59e0b" : "#888" }} />
                      <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: timeLeft < 600 ? "#ef4444" : timeLeft < 1800 ? "#f59e0b" : "#111" }}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  )}
                  {currentSection && <span className="hidden sm:block text-xs font-semibold" style={{ color: "#aaa" }}>{currentSection.label}</span>}
                  {isDrill && <span className="hidden sm:block text-xs font-semibold" style={{ color: "#f59e0b" }}>Topic Drill</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setShowCalc(!showCalc)} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                    style={{ background: showCalc ? "#f0fdf4" : "#f5f5f5", color: showCalc ? "#22c55e" : "#888", border: showCalc ? "1px solid #dcfce7" : "1px solid transparent" }}>
                    <CalcIcon className="h-4 w-4" />
                  </button>
                  <button onClick={() => setShowNav(!showNav)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={{ background: "#f5f5f5", color: "#555" }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{currentIdx + 1}/{questionOrder.length}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button onClick={() => setPhase("confirm")} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "#111", color: "#fff" }}>
                    {isDrill ? "Finish" : "Submit"}
                  </button>
                </div>
              </div>

              {sections.length > 0 && (
                <div className="flex gap-1 pb-2 overflow-x-auto no-scrollbar">
                  {sections.map((sec) => {
                    const isActive = currentSection?.subject === sec.subject;
                    const secAnswered = questionOrder.slice(sec.startIndex, sec.startIndex + sec.questionCount).filter((id) => answers[id]?.selected).length;
                    return (
                      <button key={sec.subject} onClick={() => goTo(sec.startIndex)}
                        className="shrink-0 flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.625rem] font-semibold"
                        style={{ background: isActive ? "#fff" : "transparent", color: isActive ? "#111" : "#bbb", border: isActive ? "1px solid #eee" : "1px solid transparent", boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.04)" : "none" }}>
                        {sec.label}
                        <span style={{ fontFamily: "var(--font-mono)", color: isActive ? "#22c55e" : "#ddd", fontSize: "0.5625rem" }}>{secAnswered}/{sec.questionCount}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ height: "2px", background: "#f3f3f3" }}>
                <div style={{ width: `${((currentIdx + 1) / questionOrder.length) * 100}%`, height: "100%", background: isDrill ? "#f59e0b" : isMock ? "#8b5cf6" : "#22c55e", transition: "width 0.2s" }} />
              </div>
            </div>
          </header>

          {showCalc && (
            <>
              <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setShowCalc(false)} />
              <div className="fixed z-50 top-14 right-3 sm:right-auto sm:left-1/2 sm:-translate-x-1/2">
                <Calculator onClose={() => setShowCalc(false)} />
              </div>
            </>
          )}

          {showNav && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNav(false)} />
              <div className="fixed top-14 left-0 right-0 z-40 mx-auto max-w-4xl px-3 sm:px-4">
                <div className="rounded-2xl p-4 max-h-[60vh] overflow-y-auto" style={{ background: "#fff", border: "1px solid #eee", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
                  <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: "#888" }}>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "#dcfce7" }} /> {answeredCount} answered</span>
                    {flaggedCount > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "#fef3c7" }} /> {flaggedCount} flagged</span>}
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "#f5f5f5" }} /> {questionOrder.length - answeredCount} left</span>
                  </div>
                  {sections.length > 0 ? sections.map((sec) => (
                    <div key={sec.subject} className="mb-3">
                      <p className="text-[0.5625rem] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#ccc" }}>{sec.label}</p>
                      <div className="flex flex-wrap gap-1">
                        {questionOrder.slice(sec.startIndex, sec.startIndex + sec.questionCount).map((id, i) => {
                          const idx = sec.startIndex + i;
                          const ans = answers[id];
                          const isCurrent = idx === currentIdx;
                          return (
                            <button key={id} onClick={() => { goTo(idx); setShowNav(false); }}
                              className="h-7 w-7 rounded-md text-[0.5625rem] font-bold"
                              style={{ fontFamily: "var(--font-mono)", background: isCurrent ? "#111" : ans?.selected ? "#dcfce7" : ans?.flagged ? "#fef3c7" : "#f5f5f5", color: isCurrent ? "#fff" : ans?.selected ? "#16a34a" : ans?.flagged ? "#f59e0b" : "#ccc" }}>
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-wrap gap-1">
                      {questionOrder.map((id, idx) => {
                        const ans = answers[id];
                        return (
                          <button key={id} onClick={() => { goTo(idx); setShowNav(false); }}
                            className="h-7 w-7 rounded-md text-[0.5625rem] font-bold"
                            style={{ fontFamily: "var(--font-mono)", background: idx === currentIdx ? "#111" : ans?.selected ? "#dcfce7" : ans?.flagged ? "#fef3c7" : "#f5f5f5", color: idx === currentIdx ? "#fff" : ans?.selected ? "#16a34a" : "#ccc" }}>
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <main className="flex-1 mx-auto max-w-4xl w-full px-3 sm:px-4 pt-5 pb-28">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold rounded-md px-2 py-1" style={{ fontFamily: "var(--font-mono)", background: "#f5f5f5", color: "#555" }}>Q{currentIdx + 1}</span>
                    <span className="text-[0.6875rem] font-semibold rounded-md px-2 py-0.5" style={{ background: "#f9f9f9", color: "#666", border: "1px solid #eee" }}>{fmt(q.subject)}</span>
                    {q.difficulty && (
                      <span className="text-[0.5625rem] font-semibold rounded-md px-1.5 py-0.5" style={{
                        background: q.difficulty === "EASY" ? "#f0fdf4" : q.difficulty === "HARD" ? "#fef2f2" : "#fffbeb",
                        color: q.difficulty === "EASY" ? "#22c55e" : q.difficulty === "HARD" ? "#ef4444" : "#f59e0b",
                      }}>
                        {q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>
                  <button onClick={() => toggleFlag(q.id)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors"
                    style={{ background: answers[q.id]?.flagged ? "#fef3c7" : "#f9f9f9", color: answers[q.id]?.flagged ? "#f59e0b" : "#bbb", border: `1px solid ${answers[q.id]?.flagged ? "#fde68a" : "#eee"}` }}>
                    <Flag className="h-3 w-3" fill={answers[q.id]?.flagged ? "currentColor" : "none"} />
                    {answers[q.id]?.flagged ? "Flagged" : "Flag"}
                  </button>
                </div>

                {q.imageUrl && (
                  <div className="rounded-xl overflow-hidden mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                    <img src={q.imageUrl} alt="" className="w-full max-h-64 object-contain p-4" />
                  </div>
                )}

                <div className="rounded-2xl p-5 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                  <div className="text-sm leading-[1.85]" style={{ color: "#222" }} dangerouslySetInnerHTML={{ __html: renderInline(q.body) }} />
                </div>

                <div className="space-y-2">
                  {(["A", "B", "C", "D"] as const).map((key) => {
                    const text = (q as any)[`option${key}`];
                    const isSelected = answers[q.id]?.selected === key;
                    return (
                      <button key={key} onClick={() => selectAnswer(q.id, key)}
                        className="w-full flex items-center gap-3 rounded-xl p-4 text-left transition-all"
                        style={{ background: "#fff", border: `1.5px solid ${isSelected ? "#22c55e" : "#eee"}`, boxShadow: isSelected ? "0 0 0 1px rgba(34,197,94,0.1)" : "none" }}>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                          style={{ fontFamily: "var(--font-mono)", background: isSelected ? "#22c55e" : "#f5f5f5", color: isSelected ? "#fff" : "#999" }}>{key}</span>
                        <span className="text-sm leading-relaxed flex-1" style={{ color: isSelected ? "#111" : "#444" }} dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="sticky top-20 rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[0.625rem] font-semibold uppercase tracking-wider" style={{ color: "#aaa" }}>Navigation</p>
                    <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#bbb" }}>{answeredCount}/{questionOrder.length}</span>
                  </div>
                  {sections.length > 0 ? sections.map((sec) => (
                    <div key={sec.subject} className="mb-3">
                      <p className="text-[0.5625rem] font-semibold uppercase mb-1" style={{ color: "#ddd" }}>{sec.label}</p>
                      <div className="flex flex-wrap gap-1">
                        {questionOrder.slice(sec.startIndex, sec.startIndex + sec.questionCount).map((id, i) => {
                          const idx = sec.startIndex + i;
                          const ans = answers[id];
                          return (
                            <button key={id} onClick={() => goTo(idx)} className="h-6 w-6 rounded text-[0.5rem] font-bold"
                              style={{ fontFamily: "var(--font-mono)", background: idx === currentIdx ? "#111" : ans?.selected ? "#dcfce7" : ans?.flagged ? "#fef3c7" : "#f9f9f9", color: idx === currentIdx ? "#fff" : ans?.selected ? "#16a34a" : ans?.flagged ? "#f59e0b" : "#ddd" }}>
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-wrap gap-1">
                      {questionOrder.map((id, idx) => {
                        const ans = answers[id];
                        return (
                          <button key={id} onClick={() => goTo(idx)} className="h-6 w-6 rounded text-[0.5rem] font-bold"
                            style={{ fontFamily: "var(--font-mono)", background: idx === currentIdx ? "#111" : ans?.selected ? "#dcfce7" : "#f9f9f9", color: idx === currentIdx ? "#fff" : ans?.selected ? "#16a34a" : "#ddd" }}>
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {isAdaptive && (
                    <div className="mt-4 pt-3" style={{ borderTop: "1px solid #f5f5f5" }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Zap className="h-3 w-3" style={{ color: "#8b5cf6" }} />
                        <span className="text-[0.625rem] font-semibold" style={{ color: "#8b5cf6" }}>Difficulty</span>
                      </div>
                      <div style={{ height: "4px", borderRadius: "9999px", background: "#f3f3f3" }}>
                        <div style={{ width: `${adaptiveState.ability}%`, height: "100%", borderRadius: "9999px", background: getScoreColor(adaptiveState.ability), transition: "width 0.5s" }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>

          <nav className="fixed bottom-0 left-0 right-0 z-40" style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderTop: "1px solid #eee" }}>
            <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-2.5">
              <button onClick={() => goTo(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold"
                style={{ background: "#f5f5f5", color: currentIdx === 0 ? "#ddd" : "#555" }}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#aaa" }}>{currentIdx + 1} / {questionOrder.length}</span>
              {currentIdx < questionOrder.length - 1 ? (
                <button onClick={() => goTo(currentIdx + 1)} className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: "#111", color: "#fff" }}>
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={() => setPhase("confirm")} className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold"
                  style={{ background: isDrill ? "#f59e0b" : isMock ? "#8b5cf6" : "#22c55e", color: "#fff" }}>
                  {isDrill ? "Finish Drill" : isMock ? "Submit Exam" : "Finish"}
                </button>
              )}
            </div>
          </nav>
        </>
      )}

      {/* ═══════════════ CONFIRM / PROCESSING ═══════════════ */}
      {phase === "confirm" && (
        <div className="flex-1 flex items-center justify-center px-4">
          {submitStage !== "idle" ? (
            <div className="rounded-2xl p-8 max-w-sm w-full text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
              {/* Animated ring */}
              <div className="relative inline-flex items-center justify-center mb-5">
                <svg width="80" height="80" viewBox="0 0 80 80"
                  className={submitStage === "done" ? "" : "animate-spin"} style={{ animationDuration: "2s" }}>
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#f3f3f3" strokeWidth="4" />
                  <circle cx="40" cy="40" r="34" fill="none"
                    stroke={submitStage === "done" ? "#22c55e" : "#8b5cf6"}
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={submitStage === "done" ? 0 : 2 * Math.PI * 34 * 0.7}
                    style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {submitStage === "done" ? (
                    <CheckCircle2 className="h-8 w-8" style={{ color: "#22c55e" }} />
                  ) : (
                    <Brain className="h-6 w-6" style={{ color: "#8b5cf6" }} />
                  )}
                </div>
              </div>

              <p className="text-base font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "#111" }}>
                {stageConfig[submitStage].label}
              </p>
              <p className="text-sm" style={{ color: "#999" }}>
                {stageConfig[submitStage].sub}
              </p>

              {/* Stage dots */}
              <div className="flex items-center justify-center gap-2 mt-5">
                {stages.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full transition-all" style={{
                      background: i <= currentStageIdx ? (s === "done" ? "#22c55e" : "#8b5cf6") : "#eee",
                      transform: i === currentStageIdx ? "scale(1.4)" : "scale(1)",
                      transition: "all 0.3s ease",
                    }} />
                    {i < stages.length - 1 && (
                      <div style={{ width: "16px", height: "1px", background: i < currentStageIdx ? "#ddd" : "#f3f3f3", transition: "background 0.3s" }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: "#fff", border: "1px solid #eee" }}>
              <AlertTriangle className="mx-auto mb-4 h-8 w-8" style={{ color: "#f59e0b" }} />
              <h2 className="text-center text-lg font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "#111" }}>
                {isDrill ? "Finish Drill?" : isMock ? "Submit Mock Exam?" : "Submit?"}
              </h2>
              <div className="space-y-2 mb-6">
                {[
                  { label: "Answered", value: `${answeredCount}/${questionOrder.length}`, color: "#22c55e" },
                  { label: "Unanswered", value: `${questionOrder.length - answeredCount}`, color: questionOrder.length - answeredCount > 0 ? "#ef4444" : "#22c55e" },
                  ...(flaggedCount > 0 ? [{ label: "Flagged", value: `${flaggedCount}`, color: "#f59e0b" }] : []),
                  ...(totalTime > 0 ? [{ label: "Time left", value: formatTime(timeLeft), color: "#888" }] : []),
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-sm" style={{ color: "#444" }}>
                    <span>{label}</span>
                    <span className="font-bold" style={{ fontFamily: "var(--font-mono)", color }}>{value}</span>
                  </div>
                ))}
              </div>
              {questionOrder.length - answeredCount > 0 && (
                <p className="text-sm mb-4 text-center" style={{ color: "#ef4444" }}>
                  You have {questionOrder.length - answeredCount} unanswered question{questionOrder.length - answeredCount > 1 ? "s" : ""}!
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setPhase("test")} className="flex-1 rounded-xl py-3 text-sm font-semibold" style={{ background: "#f5f5f5", color: "#555" }}>
                  Go Back
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1" style={{ background: "#111", color: "#fff" }}>
                  {isDrill ? "Finish" : "Submit"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ RESULTS ═══════════════ */}
      {phase === "result" && result && (
        <main className="flex-1 mx-auto max-w-3xl w-full px-4 pt-6 pb-12">
          {isDrill && result.topicBreakdown ? (
            <DrillResults
              accuracy={result.accuracy ?? result.score ?? 0}
              totalCorrect={result.totalCorrect}
              totalAnswered={result.totalAnswered}
              totalQuestions={result.totalQuestions}
              topicBreakdown={result.topicBreakdown}
              review={result.review}
              subject={result.subjectScores?.[0]?.subject || ""}
            />
          ) : result.subjectScores && result.topicInsights && result.difficultyProfile ? (
            <ExamReport
              score={result.score || 0}
              totalCorrect={result.totalCorrect}
              totalAnswered={result.totalAnswered}
              totalQuestions={result.totalQuestions}
              subjectScores={result.subjectScores}
              topicInsights={result.topicInsights}
              difficultyProfile={result.difficultyProfile}
              review={result.review}
              renderText={renderInline}
            />
          ) : result.subjectScores ? (
            <div>
              <div className="rounded-2xl p-6 mb-6 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#bbb" }}>Score</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", lineHeight: 1, color: getScoreColor((result.score || 0) >= 250 ? 70 : (result.score || 0) >= 180 ? 50 : 30) }}>
                  {result.score || 0}
                </p>
                <p className="text-sm mt-1" style={{ color: "#888" }}>{result.totalCorrect} of {result.totalQuestions} correct</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {result.subjectScores.map((ss) => (
                  <div key={ss.subject} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold" style={{ color: "#222" }}>{fmt(ss.subject)}</p>
                      <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: getScoreColor(ss.accuracy) }}>{ss.correct}/{ss.total}</p>
                    </div>
                    <div style={{ height: "4px", borderRadius: "9999px", background: "#f3f3f3" }}>
                      <div style={{ width: `${ss.score}%`, height: "100%", borderRadius: "9999px", background: getScoreColor(ss.accuracy) }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-6">
                <button onClick={() => router.push("/practice")} className="flex-1 rounded-xl py-3 text-sm font-semibold" style={{ background: "#111", color: "#fff" }}>Practice Again</button>
                <button onClick={() => router.push("/dashboard")} className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5" style={{ background: "#fff", border: "1px solid #eee", color: "#444" }}>
                  <Home className="h-4 w-4" /> Dashboard
                </button>
              </div>
            </div>
          ) : null}
        </main>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}