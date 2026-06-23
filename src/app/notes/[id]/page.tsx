"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Loader2, BookOpen, AlertTriangle, Zap, Download,
  Bookmark, BookmarkCheck, ChevronDown, Share2,
  FileText, CheckCircle2, XCircle, RotateCcw,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface NoteData {
  id: string;
  title: string;
  subject: string;
  topicName: string;
  content: string;
  summary: string | null;
  keyFormulas: string[];
  commonMistakes: string[];
  examTips: string[];
  questionCount: number;
  difficulty: string;
  practiceQuestions?: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  bookmarked: boolean;
  createdAt: string;
}

const SUBJECT_COLORS: Record<string, { primary: string; light: string; bg: string }> = {
  MATHEMATICS: { primary: "#6366f1", light: "#e0e7ff", bg: "#eef2ff" },
  PHYSICS: { primary: "#8b5cf6", light: "#ede9fe", bg: "#f5f3ff" },
  CHEMISTRY: { primary: "#ec4899", light: "#fce7f3", bg: "#fdf2f8" },
  BIOLOGY: { primary: "#10b981", light: "#d1fae5", bg: "#ecfdf5" },
  USE_OF_ENGLISH: { primary: "#f59e0b", light: "#fef3c7", bg: "#fffbeb" },
  LITERATURE: { primary: "#f97316", light: "#ffedd5", bg: "#fff7ed" },
  GOVERNMENT: { primary: "#3b82f6", light: "#dbeafe", bg: "#eff6ff" },
  ECONOMICS: { primary: "#14b8a6", light: "#ccfbf1", bg: "#f0fdfa" },
  COMMERCE: { primary: "#06b6d4", light: "#cffafe", bg: "#ecfeff" },
  ACCOUNTING: { primary: "#8b5cf6", light: "#ede9fe", bg: "#f5f3ff" },
  GEOGRAPHY: { primary: "#22c55e", light: "#dcfce7", bg: "#f0fdf4" },
  AGRICULTURAL_SCIENCE: { primary: "#84cc16", light: "#ecfccb", bg: "#f7fee7" },
  CRS: { primary: "#a855f7", light: "#f3e8ff", bg: "#faf5ff" },
  IRS: { primary: "#a855f7", light: "#f3e8ff", bg: "#faf5ff" },
};

function getColors(subject: string) {
  return SUBJECT_COLORS[subject] || { primary: "#6366f1", light: "#e0e7ff", bg: "#eef2ff" };
}

function renderContent(text: string, accentColor: string): string {
  let result = text;
  // Remove [PRACTICE] blocks
  result = result.replace(/\[PRACTICE\][\s\S]*?\[\/PRACTICE\]/g, "");
  // Display math
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return `<div class="nr-math-block">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch { return `<code>${math}</code>`; }
  });
  // Inline math
  result = result.replace(/\$(.+?)\$/g, (_, math) => {
    try { return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); }
    catch { return `<code>${math}</code>`; }
  });
  // Code blocks
  result = result.replace(/```([\s\S]*?)```/g, '<pre class="nr-pre">$1</pre>');
  // Headings
  result = result.replace(/^### (.+)$/gm, `<h3 class="nr-h3" style="--accent: ${accentColor}">$1</h3>`);
  result = result.replace(/^## (.+)$/gm, `<h2 class="nr-h2">$1</h2>`);
  // Bold, italic, inline code
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong class="nr-bold">$1</strong>');
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  result = result.replace(/`([^`]+)`/g, '<code class="nr-code">$1</code>');
  // Blockquotes (> lines)
  result = result.replace(/^>\s?(.+)$/gm, `<div class="nr-callout" style="--accent: ${accentColor}">$1</div>`);
  // Tables
  result = result.replace(
    /^(\|.+\|)\n(\|[-:| ]+\|)\n((?:\|.+\|\n?)*)/gm,
    (_, header, _sep, body) => {
      const headers = header.split("|").filter(Boolean).map((h: string) => h.trim());
      const rows = body.trim().split("\n").map((row: string) =>
        row.split("|").filter(Boolean).map((c: string) => c.trim())
      );
      let html = `<div class="nr-table-wrap"><table class="nr-table" style="--accent: ${accentColor}"><thead><tr>`;
      headers.forEach((h: string) => { html += `<th>${h}</th>`; });
      html += "</tr></thead><tbody>";
      rows.forEach((row: string[]) => {
        html += "<tr>";
        row.forEach((c: string) => { html += `<td>${c}</td>`; });
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      return html;
    }
  );
  // Lists
  result = result.replace(/^[-*] (.+)$/gm, '<li class="nr-li">$1</li>');
  result = result.replace(/((?:<li class="nr-li">.*<\/li>\s*)+)/g, '<ul class="nr-ul">$1</ul>');
  result = result.replace(/^\d+\.\s(.+)$/gm, '<li class="nr-oli">$1</li>');
  result = result.replace(/((?:<li class="nr-oli">.*<\/li>\s*)+)/g, '<ol class="nr-ol">$1</ol>');
  // Paragraphs
  result = result.replace(/\n\n/g, '<div style="height:0.75rem"></div>');
  result = result.replace(/\n/g, "<br/>");
  return result;
}

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function NoteReaderPage() {
  const router = useRouter();
  const params = useParams();
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Practice quiz
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number | null>>({});
  const [practiceRevealed, setPracticeRevealed] = useState<Set<number>>(new Set());
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/notes/${params.id}`);
        const data = await res.json();
        if (res.ok) { setNote(data); setBookmarked(data.bookmarked); }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [params.id]);

  const colors = note ? getColors(note.subject) : { primary: "#6366f1", light: "#e0e7ff", bg: "#eef2ff" };

  const toggleBookmark = async () => {
    if (!note) return;
    setBookmarked(!bookmarked);
    setBookmarkLoading(true);
    try {
      const res = await fetch(`/api/notes/${note.id}/bookmark`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setBookmarked(data.bookmarked);
      else setBookmarked(!bookmarked);
    } catch { setBookmarked(!bookmarked); }
    finally { setBookmarkLoading(false); }
  };

  const handleDownload = async () => {
    if (!note) return;
    setDownloading(true);
    try {
      const { generateNotePDF } = await import("@/lib/generate-note-pdf");
      generateNotePDF(note);
    } catch (err) {
      console.error("PDF failed:", err);
      alert("PDF download failed.");
    } finally { setDownloading(false); }
  };

  const handleShare = async () => {
    if (!note) return;
    const url = `${window.location.origin}/notes/${note.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: `${note.topicName} — JAMB Study Notes` });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const selectPracticeAnswer = (qIdx: number, optIdx: number) => {
    if (practiceRevealed.has(qIdx)) return;
    setPracticeAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const revealPracticeAnswer = (qIdx: number) => {
    setPracticeRevealed((prev) => new Set(prev).add(qIdx));
  };

  const checkAllAnswers = () => {
    if (!note?.practiceQuestions) return;
    const allRevealed = new Set<number>();
    let correct = 0;
    note.practiceQuestions.forEach((pq, i) => {
      allRevealed.add(i);
      if (practiceAnswers[i] === pq.correctIndex) correct++;
    });
    setPracticeRevealed(allRevealed);
    setQuizScore({ correct, total: note.practiceQuestions.length });
  };

  const resetQuiz = () => {
    setPracticeAnswers({});
    setPracticeRevealed(new Set());
    setQuizScore(null);
  };

  const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#f7f7f8" }}>
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#bbb" }} />
    </div>
  );

  if (!note) return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#f7f7f8" }}>
      <div className="rounded-2xl p-10 text-center max-w-sm" style={{ background: "#fff", border: "1px solid #eaeaea" }}>
        <AlertTriangle className="mx-auto mb-3 h-6 w-6" style={{ color: "#ef4444" }} />
        <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Note not found</p>
        <button onClick={() => router.push("/notes")}
          className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold"
          style={{ background: "#f5f5f5", color: "#555" }}>
          Back to Notes
        </button>
      </div>
    </div>
  );

  const sections = [
    { id: "formulas", label: "Key Formulas", count: note.keyFormulas.length, icon: FileText, items: note.keyFormulas, color: "#6366f1" },
    { id: "mistakes", label: "Common Mistakes", count: note.commonMistakes.length, icon: AlertTriangle, items: note.commonMistakes, color: "#ef4444" },
    { id: "tips", label: "Exam Tips", count: note.examTips.length, icon: Zap, items: note.examTips, color: "#f59e0b" },
  ].filter((s) => s.count > 0);

  const hasPractice = note.practiceQuestions && note.practiceQuestions.length > 0;
  const answeredAll = hasPractice && Object.keys(practiceAnswers).length === note.practiceQuestions!.length;

  return (
    <div className="min-h-screen pb-12" style={{ background: "#f7f7f8" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .nr-h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 2rem 0 0.75rem;
          padding-bottom: 0.625rem;
          border-bottom: 2px solid ${colors.light};
          letter-spacing: -0.01em;
        }
        .nr-h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #2a2a2a;
          margin: 1.5rem 0 0.5rem;
          padding-left: 0.875rem;
          border-left: 3px solid var(--accent, ${colors.primary});
        }
        .nr-bold { color: #1a1a1a; font-weight: 600; }
        .nr-ul, .nr-ol { margin: 0.75rem 0; padding-left: 0; list-style: none; }
        .nr-li, .nr-oli { position: relative; padding-left: 1.375rem; margin: 0.625rem 0; line-height: 1.75; color: #444; }
        .nr-li::before {
          content: "";
          position: absolute;
          left: 0.25rem;
          top: 0.65em;
          width: 6px;
          height: 6px;
          background: ${colors.primary};
          border-radius: 50%;
          opacity: 0.6;
        }
        .nr-oli { counter-increment: note-counter; }
        .nr-ol { counter-reset: note-counter; }
        .nr-oli::before {
          content: counter(note-counter) ".";
          position: absolute;
          left: 0;
          font-weight: 700;
          font-size: 0.8125rem;
          color: ${colors.primary};
          font-family: var(--font-mono);
        }
        .nr-math-block {
          margin: 1.25rem 0;
          padding: 1.25rem;
          text-align: center;
          background: ${colors.bg};
          border-radius: 1rem;
          border: 1px solid ${colors.light};
          overflow-x: auto;
        }
        .nr-code {
          padding: 0.125rem 0.4rem;
          background: #f0f0f2;
          border-radius: 0.375rem;
          font-family: var(--font-mono);
          font-size: 0.85em;
          color: ${colors.primary};
        }
        .nr-pre {
          margin: 1rem 0;
          padding: 1.25rem;
          background: #1e1e2e;
          color: #cdd6f4;
          border-radius: 1rem;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          overflow-x: auto;
          white-space: pre;
          line-height: 1.65;
          border: 1px solid #313244;
        }
        .nr-table-wrap { overflow-x: auto; margin: 1.25rem 0; border-radius: 1rem; border: 1px solid #eaeaea; }
        .nr-table { border-collapse: collapse; width: 100%; font-size: 0.8125rem; }
        .nr-table th {
          background: var(--accent, ${colors.primary});
          color: #fff;
          font-weight: 600;
          text-align: left;
          padding: 10px 14px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .nr-table th:first-child { border-radius: 0.75rem 0 0 0; }
        .nr-table th:last-child { border-radius: 0 0.75rem 0 0; }
        .nr-table td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: #444; }
        .nr-table tr:last-child td { border-bottom: none; }
        .nr-table tr:hover td { background: ${colors.bg}; }
        .nr-callout {
          margin: 0.75rem 0;
          padding: 0.75rem 1rem;
          background: ${colors.bg};
          border-left: 3px solid var(--accent, ${colors.primary});
          border-radius: 0 0.75rem 0.75rem 0;
          font-size: 0.875rem;
          color: #444;
          line-height: 1.7;
        }
      ` }} />

      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: "rgba(247,247,248,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid #ebebeb" }}>
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/notes")} style={{ color: "#888" }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1">
            <button onClick={toggleBookmark} disabled={bookmarkLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ color: bookmarked ? "#f59e0b" : "#ccc" }}>
              {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
            <button onClick={handleDownload} disabled={downloading}
              className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "#ccc" }}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </button>
            <button onClick={handleShare}
              className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "#ccc" }}>
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* Hero */}
        <div className="rounded-2xl p-5 sm:p-6 mb-5 relative overflow-hidden"
          style={{ background: "#fff", border: "1px solid #eaeaea" }}>
          {/* Accent stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: colors.primary }} />

          <div className="flex items-center gap-2 mb-3 mt-1">
            <span className="text-[0.6875rem] font-semibold rounded-lg px-2.5 py-1"
              style={{ background: colors.bg, color: colors.primary }}>
              {fmt(note.subject)}
            </span>
            
          </div>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.25, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
            {note.topicName}
          </h1>

          {note.summary && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "#777" }}>
              {note.summary}
            </p>
          )}
        </div>

        {/* Quick-access cards */}
        {sections.length > 0 && (
          <div className="space-y-2 mb-5">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isOpen = expandedSection === sec.id;
              return (
                <div key={sec.id} className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #eaeaea" }}>
                  <button onClick={() => toggleSection(sec.id)}
                    className="w-full flex items-center justify-between p-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ background: `${sec.color}10` }}>
                        <Icon className="h-4 w-4" style={{ color: sec.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{sec.label}</p>
                        <p className="text-[0.6875rem]" style={{ color: "#bbb" }}>{sec.count} items</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 transition-transform"
                      style={{ color: "#ccc", transform: isOpen ? "rotate(180deg)" : "none" }} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-2">
                      {sec.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                          style={{ background: "#f9f9f9" }}>
                          <span className="text-xs font-bold shrink-0 mt-0.5 w-5 text-center"
                            style={{ color: sec.color, fontFamily: "var(--font-mono)", opacity: 0.6 }}>
                            {i + 1}
                          </span>
                          <div className="text-[0.8125rem] leading-relaxed flex-1" style={{ color: "#555" }}
                            dangerouslySetInnerHTML={{ __html: renderContent(item, colors.primary) }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Main content */}
        <div className="rounded-2xl p-5 sm:p-7 mb-5" style={{ background: "#fff", border: "1px solid #eaeaea" }}>
          <div className="text-[0.9375rem] leading-[1.85]" style={{ color: "#444" }}
            dangerouslySetInnerHTML={{ __html: renderContent(note.content, colors.primary) }} />
        </div>

        {/* Practice questions */}
        {hasPractice && (
          <div className="rounded-2xl p-5 sm:p-6 mb-5" style={{ background: "#fff", border: "1px solid #eaeaea" }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: colors.bg }}>
                  <BookOpen className="h-4 w-4" style={{ color: colors.primary }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Test Yourself</p>
                  <p className="text-[0.6875rem]" style={{ color: "#bbb" }}>
                    {note.practiceQuestions!.length} questions
                  </p>
                </div>
              </div>
              {quizScore && (
                <button onClick={resetQuiz}
                  className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5"
                  style={{ background: "#f5f5f5", color: "#888" }}>
                  <RotateCcw className="h-3 w-3" /> Try Again
                </button>
              )}
            </div>

            {/* Score */}
            {quizScore && (
              <div className="rounded-xl p-5 mb-5 text-center" style={{
                background: quizScore.correct / quizScore.total >= 0.7 ? "#f0fdf4" :
                  quizScore.correct / quizScore.total >= 0.5 ? "#fffbeb" : "#fef2f2",
                border: `1px solid ${
                  quizScore.correct / quizScore.total >= 0.7 ? "#bbf7d0" :
                  quizScore.correct / quizScore.total >= 0.5 ? "#fde68a" : "#fecaca"
                }`,
              }}>
                <p className="text-3xl font-bold" style={{
                  color: quizScore.correct / quizScore.total >= 0.7 ? "#16a34a" :
                    quizScore.correct / quizScore.total >= 0.5 ? "#d97706" : "#dc2626",
                  letterSpacing: "-0.02em",
                }}>
                  {quizScore.correct}/{quizScore.total}
                </p>
                <p className="text-xs mt-1.5" style={{ color: "#888" }}>
                  {quizScore.correct / quizScore.total >= 0.8
                    ? "Excellent! You know this topic well."
                    : quizScore.correct / quizScore.total >= 0.6
                    ? "Good effort. Review the ones you missed."
                    : "Keep studying. Re-read the notes and try again."}
                </p>
              </div>
            )}

            {/* Questions */}
            <div className="space-y-6">
              {note.practiceQuestions!.map((pq, qi) => {
                const answered = practiceAnswers[qi] !== undefined && practiceAnswers[qi] !== null;
                const revealed = practiceRevealed.has(qi);
                const isCorrect = answered && practiceAnswers[qi] === pq.correctIndex;
                return (
                  <div key={qi}>
                    <p className="text-sm font-semibold mb-3 flex items-start gap-2" style={{ color: "#1a1a1a" }}>
                      <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-[0.6875rem] font-bold"
                        style={{ background: colors.bg, color: colors.primary, fontFamily: "var(--font-mono)" }}>
                        {qi + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{pq.question}</span>
                    </p>
                    <div className="space-y-2 ml-8">
                      {pq.options.map((opt, oi) => {
                        const isSelected = practiceAnswers[qi] === oi;
                        const isRight = oi === pq.correctIndex;
                        let bg = "#f9f9f9";
                        let border = "#eaeaea";
                        let textColor = "#444";
                        let labelColor = "#bbb";

                        if (revealed) {
                          if (isRight) {
                            bg = "#f0fdf4"; border = "#bbf7d0"; textColor = "#166534"; labelColor = "#16a34a";
                          } else if (isSelected && !isRight) {
                            bg = "#fef2f2"; border = "#fecaca"; textColor = "#991b1b"; labelColor = "#dc2626";
                          }
                        } else if (isSelected) {
                          bg = colors.bg; border = colors.primary; textColor = "#1a1a1a"; labelColor = colors.primary;
                        }

                        return (
                          <button key={oi} onClick={() => selectPracticeAnswer(qi, oi)}
                            className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left text-sm transition-all"
                            style={{ background: bg, border: `1.5px solid ${border}`, color: textColor }}>
                            <span className="text-xs font-bold w-5 text-center"
                              style={{ fontFamily: "var(--font-mono)", color: labelColor }}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="flex-1 leading-relaxed">{opt}</span>
                            {revealed && isRight && <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#22c55e" }} />}
                            {revealed && isSelected && !isRight && <XCircle className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />}
                          </button>
                        );
                      })}
                    </div>
                    {answered && !revealed && (
                      <button onClick={() => revealPracticeAnswer(qi)}
                        className="ml-8 mt-2.5 text-xs font-semibold rounded-lg px-3 py-1.5"
                        style={{ background: colors.bg, color: colors.primary }}>
                        Check answer
                      </button>
                    )}
                    {revealed && (
                      <div className="ml-8 mt-2.5 rounded-xl p-3.5"
                        style={{ background: isCorrect ? "#f0fdf4" : "#fef2f2", border: `1px solid ${isCorrect ? "#dcfce7" : "#fee2e2"}` }}>
                        <p className="text-xs font-semibold mb-1"
                          style={{ color: isCorrect ? "#16a34a" : "#dc2626" }}>
                          {isCorrect ? "Correct!" : "Not quite."}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: "#666" }}>
                          {pq.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Check all button */}
            {!quizScore && (
              <button onClick={checkAllAnswers} disabled={!answeredAll}
                className="w-full mt-6 rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: answeredAll ? colors.primary : "#e5e5e5",
                  color: answeredAll ? "#fff" : "#aaa",
                }}>
                <CheckCircle2 className="h-4 w-4" />
                Check All ({Object.keys(practiceAnswers).length}/{note.practiceQuestions!.length})
              </button>
            )}
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex gap-2 mb-3">
          <button onClick={toggleBookmark} disabled={bookmarkLoading}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "#fff", border: "1px solid #eaeaea", color: bookmarked ? "#f59e0b" : "#555" }}>
            {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {bookmarked ? "Saved" : "Save"}
          </button>
          <button onClick={handleDownload} disabled={downloading}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "#fff", border: "1px solid #eaeaea", color: "#555" }}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </button>
          <button onClick={handleShare}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "#fff", border: "1px solid #eaeaea", color: "#555" }}>
            <Share2 className="h-4 w-4" /> {shareCopied ? "Copied!" : "Share"}
          </button>
        </div>

        <button onClick={() => router.push("/practice")}
          className="w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 mb-2"
          style={{ background: "#1a1a1a", color: "#fff" }}>
          <BookOpen className="h-4 w-4" /> Practice This Topic
        </button>
        <button onClick={() => router.push("/notes")}
          className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "#f0f0f0", color: "#666" }}>
          More Notes
        </button>
      </div>
    </div>
  );
}