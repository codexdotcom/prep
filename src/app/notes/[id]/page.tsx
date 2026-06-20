"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Loader2, BookOpen, AlertTriangle, Zap, Download,
  Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Share2,
  FileText, CheckCircle2, XCircle, Play, Pause,
  Headphones, PenLine, Gamepad2, ImageIcon,
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
  learningStyle?: string;
  audioUrl?: string | null;
  practiceQuestions?: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  bookmarked: boolean;
  createdAt: string;
}

function renderContent(text: string): string {
  let result = text;
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try { return `<div class="note-math-block">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`; }
    catch { return `<code>${math}</code>`; }
  });
  result = result.replace(/\$(.+?)\$/g, (_, math) => {
    try { return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); }
    catch { return `<code>${math}</code>`; }
  });
  result = result.replace(/^### (.+)$/gm, '<h3 class="note-h3">$1</h3>');
  result = result.replace(/^## (.+)$/gm, '<h2 class="note-h2">$1</h2>');
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong class="note-bold">$1</strong>');
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  result = result.replace(/`(.+?)`/g, '<code class="note-code">$1</code>');
  result = result.replace(/^[-*] (.+)$/gm, '<li class="note-li">$1</li>');
  result = result.replace(/((?:<li class="note-li">.*<\/li>\s*)+)/g, '<ul class="note-ul">$1</ul>');
  result = result.replace(/^\d+\.\s(.+)$/gm, '<li class="note-oli">$1</li>');
  result = result.replace(/((?:<li class="note-oli">.*<\/li>\s*)+)/g, '<ol class="note-ol">$1</ol>');
  result = result.replace(/\n\n/g, '<div style="height:0.5rem"></div>');
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number | null>>({});
  const [practiceRevealed, setPracticeRevealed] = useState<Set<number>>(new Set());

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
    const text = `Studying ${note.topicName} (${fmt(note.subject)}) with AI notes on JambOS.\n\n${note.summary || ""}\n\njambos.ng`;
    if (navigator.share) {
      try { await navigator.share({ text, title: note.title }); } catch {}
    } else { await navigator.clipboard.writeText(text); }
  };

  const toggleAudio = () => {
    if (!note?.audioUrl) return;
    if (audioRef) {
      if (audioPlaying) { audioRef.pause(); setAudioPlaying(false); }
      else { audioRef.play(); setAudioPlaying(true); }
    } else {
      const audio = new Audio(note.audioUrl);
      audio.onended = () => setAudioPlaying(false);
      audio.play();
      setAudioRef(audio);
      setAudioPlaying(true);
    }
  };

  const selectPracticeAnswer = (qIdx: number, optIdx: number) => {
    if (practiceRevealed.has(qIdx)) return;
    setPracticeAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const revealPracticeAnswer = (qIdx: number) => {
    setPracticeRevealed((prev) => new Set(prev).add(qIdx));
  };

  const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#fafafa" }}>
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#888" }} />
    </div>
  );

  if (!note) return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#fafafa" }}>
      <div className="rounded-xl p-8 text-center max-w-sm" style={{ background: "#fff", border: "1px solid #eee" }}>
        <AlertTriangle className="mx-auto mb-3 h-6 w-6" style={{ color: "#ef4444" }} />
        <p className="text-sm font-semibold" style={{ color: "#111" }}>Note not found</p>
        <button onClick={() => router.push("/notes")} className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ background: "#f5f5f5", color: "#555" }}>
          Back to Notes
        </button>
      </div>
    </div>
  );

  const sections = [
    { id: "formulas", label: "Key Formulas", count: note.keyFormulas.length, icon: FileText, items: note.keyFormulas },
    { id: "mistakes", label: "Common Mistakes", count: note.commonMistakes.length, icon: XCircle, items: note.commonMistakes },
    { id: "tips", label: "Exam Tips", count: note.examTips.length, icon: Zap, items: note.examTips },
  ].filter((s) => s.count > 0);

  const isAudioStyle = note.learningStyle === "auditory";
  const isInteractive = note.learningStyle === "kinesthetic";

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .note-h2 { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: #111; margin: 1.75rem 0 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee; }
        .note-h3 { font-family: var(--font-display); font-size: 1.05rem; font-weight: 600; color: #333; margin: 1.5rem 0 0.5rem; padding-left: 0.75rem; border-left: 3px solid #111; }
        .note-bold { color: #111; font-weight: 600; }
        .note-ul, .note-ol { margin: 0.75rem 0; padding-left: 0; list-style: none; }
        .note-li, .note-oli { position: relative; padding-left: 1.25rem; margin: 0.5rem 0; line-height: 1.7; }
        .note-li::before { content: ""; position: absolute; left: 0.25rem; top: 0.6em; width: 5px; height: 5px; background: #111; border-radius: 50%; }
        .note-oli { counter-increment: note-counter; }
        .note-ol { counter-reset: note-counter; }
        .note-oli::before { content: counter(note-counter) "."; position: absolute; left: 0; font-weight: 600; font-size: 0.8125rem; color: #111; font-family: var(--font-mono); }
        .note-math-block { margin: 1rem 0; padding: 1rem 1.25rem; text-align: center; background: #f5f5f5; border-radius: 0.75rem; border: 1px solid #eee; overflow-x: auto; }
        .note-code { padding: 0.1rem 0.35rem; background: #f0f0f0; border-radius: 0.25rem; font-family: var(--font-mono); font-size: 0.85em; color: #333; }
      ` }} />

      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #eee" }}>
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/notes")} style={{ color: "#666" }}><ArrowLeft className="h-4 w-4" /></button>
          <div className="flex items-center gap-1">
            <button onClick={toggleBookmark} disabled={bookmarkLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ color: bookmarked ? "#f59e0b" : "#bbb" }}>
              {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
            <button onClick={handleDownload} disabled={downloading}
              className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "#bbb" }}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </button>
            <button onClick={handleShare} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "#bbb" }}>
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs" style={{ color: "#888" }}>{fmt(note.subject)}</span>
          {note.learningStyle && (
            <>
              <span className="text-xs" style={{ color: "#ddd" }}>·</span>
              <span className="text-xs capitalize" style={{ color: "#888" }}>{note.learningStyle} mode</span>
            </>
          )}
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", lineHeight: 1.3, color: "#111", marginBottom: "0.25rem" }}>
          {note.topicName}
        </h1>
        <p className="text-xs mb-5" style={{ color: "#aaa" }}>AI-generated study notes</p>

        {/* Audio player for auditory learners */}
        {isAudioStyle && note.audioUrl && (
          <div className="rounded-xl p-4 mb-5 flex items-center gap-4" style={{ background: "#fff", border: "1px solid #eee" }}>
            <button onClick={toggleAudio}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors"
              style={{ background: "#111", color: "#fff" }}>
              {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#111" }}>Listen to this note</p>
              <p className="text-xs" style={{ color: "#888" }}>AI-narrated explanation with key phrase emphasis</p>
            </div>
            <Headphones className="h-4 w-4 shrink-0" style={{ color: "#bbb" }} />
          </div>
        )}

        {/* Summary */}
        {note.summary && (
          <div className="rounded-xl p-4 mb-5 relative overflow-hidden" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: "#111" }} />
            <p className="text-[0.625rem] font-bold uppercase tracking-widest mb-2 pl-3" style={{ color: "#888" }}>Key Takeaway</p>
            <p className="text-sm leading-relaxed pl-3" style={{ color: "#555" }}>{note.summary}</p>
          </div>
        )}

        {/* Accordion sections */}
        <div className="space-y-2 mb-5">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isOpen = expandedSection === sec.id;
            return (
              <div key={sec.id} className="rounded-xl overflow-hidden" style={{ background: "#fff", border: "1px solid #eee" }}>
                <button onClick={() => toggleSection(sec.id)}
                  className="w-full flex items-center justify-between p-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#f5f5f5" }}>
                      <Icon className="h-4 w-4" style={{ color: "#555" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#111" }}>{sec.label}</p>
                      <p className="text-[0.625rem]" style={{ color: "#aaa" }}>{sec.count} items</p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform" style={{ color: "#bbb", transform: isOpen ? "rotate(180deg)" : "none" }} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {sec.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-lg p-3" style={{ background: "#fafafa" }}>
                        <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: "#aaa", fontFamily: "var(--font-mono)" }}>{i + 1}.</span>
                        <div className="text-xs leading-relaxed flex-1" style={{ color: "#555" }}
                          dangerouslySetInnerHTML={{ __html: renderContent(item) }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div className="rounded-xl p-5 sm:p-6 mb-5" style={{ background: "#fff", border: "1px solid #eee" }}>
          <div className="text-sm leading-[1.8]" style={{ color: "#444" }}
            dangerouslySetInnerHTML={{ __html: renderContent(note.content) }} />
        </div>

        {/* Interactive practice questions for kinesthetic learners */}
        {isInteractive && note.practiceQuestions && note.practiceQuestions.length > 0 && (
          <div className="rounded-xl p-5 mb-5" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="h-4 w-4" style={{ color: "#333" }} />
              <p className="text-sm font-bold" style={{ color: "#111" }}>Test yourself</p>
            </div>
            <div className="space-y-5">
              {note.practiceQuestions.map((pq, qi) => {
                const answered = practiceAnswers[qi] !== undefined && practiceAnswers[qi] !== null;
                const revealed = practiceRevealed.has(qi);
                const isCorrect = answered && practiceAnswers[qi] === pq.correctIndex;
                return (
                  <div key={qi}>
                    <p className="text-sm font-semibold mb-2" style={{ color: "#222" }}>
                      <span className="text-xs font-bold mr-1.5" style={{ fontFamily: "var(--font-mono)", color: "#aaa" }}>Q{qi + 1}</span>
                      {pq.question}
                    </p>
                    <div className="space-y-1.5">
                      {pq.options.map((opt, oi) => {
                        const isSelected = practiceAnswers[qi] === oi;
                        const isRight = oi === pq.correctIndex;
                        let bg = "#fafafa";
                        let border = "#eee";
                        let textColor = "#333";
                        if (revealed) {
                          if (isRight) { bg = "#f0fdf4"; border = "#bbf7d0"; textColor = "#166534"; }
                          else if (isSelected && !isRight) { bg = "#fef2f2"; border = "#fecaca"; textColor = "#991b1b"; }
                        } else if (isSelected) {
                          bg = "#f5f5f5"; border = "#333"; textColor = "#111";
                        }
                        return (
                          <button key={oi} onClick={() => selectPracticeAnswer(qi, oi)}
                            className="w-full flex items-center gap-2 rounded-lg p-3 text-left text-sm transition-all"
                            style={{ background: bg, border: `1.5px solid ${border}`, color: textColor }}>
                            <span className="text-xs font-bold w-5" style={{ fontFamily: "var(--font-mono)", color: "#bbb" }}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {revealed && isRight && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#22c55e" }} />}
                            {revealed && isSelected && !isRight && <XCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "#ef4444" }} />}
                          </button>
                        );
                      })}
                    </div>
                    {answered && !revealed && (
                      <button onClick={() => revealPracticeAnswer(qi)}
                        className="mt-2 text-xs font-semibold" style={{ color: "#111" }}>
                        Check answer
                      </button>
                    )}
                    {revealed && (
                      <div className="mt-2 rounded-lg p-3" style={{ background: "#fafafa", border: "1px solid #f3f3f3" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: isCorrect ? "#16a34a" : "#dc2626" }}>
                          {isCorrect ? "Correct!" : "Not quite."}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: "#666" }}>{pq.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex gap-2 mb-3">
          <button onClick={toggleBookmark} disabled={bookmarkLoading}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "#fff", border: "1px solid #eee", color: bookmarked ? "#f59e0b" : "#555" }}>
            {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {bookmarked ? "Saved" : "Save"}
          </button>
          <button onClick={handleDownload} disabled={downloading}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "#fff", border: "1px solid #eee", color: "#555" }}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </button>
          <button onClick={handleShare}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "#fff", border: "1px solid #eee", color: "#555" }}>
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        <button onClick={() => router.push("/practice")}
          className="w-full rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 mb-2"
          style={{ background: "#111", color: "#fff" }}>
          <BookOpen className="h-4 w-4" /> Practice This Topic
        </button>
        <button onClick={() => router.push("/notes")}
          className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "#f5f5f5", color: "#555" }}>
          More Notes
        </button>
      </div>
    </div>
  );
}