"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Loader2, BookOpen, AlertTriangle, Zap, Download,
  Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Share2,
  FileText, CheckCircle2, XCircle,
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
  bookmarked: boolean;
  createdAt: string;
}

function renderContent(text: string): string {
  let result = text;

  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return `<div class="note-math-block">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch { return `<code>${math}</code>`; }
  });

  result = result.replace(/\$(.+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch { return `<code>${math}</code>`; }
  });

  result = result.replace(/^### (.+)$/gm, '<h3 class="note-h3">$1</h3>');
  result = result.replace(/^## (.+)$/gm, '<h2 class="note-h2">$1</h2>');
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong class="note-bold">$1</strong>');
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  result = result.replace(/`(.+?)`/g, '<code class="note-inline-code">$1</code>');

  result = result.replace(/^[-*] (.+)$/gm, '<li class="note-li">$1</li>');
  result = result.replace(/((?:<li class="note-li">.*<\/li>\s*)+)/g, '<ul class="note-ul">$1</ul>');

  result = result.replace(/^\d+\.\s(.+)$/gm, '<li class="note-oli">$1</li>');
  result = result.replace(/((?:<li class="note-oli">.*<\/li>\s*)+)/g, '<ol class="note-ol">$1</ol>');

  result = result.replace(/\n\n/g, '<div style="height:0.5rem"></div>');
  result = result.replace(/\n/g, "<br/>");

  return result;
}

const NOTE_CSS = `
  .note-h2 {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 1.75rem 0 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgba(34,197,94,0.15);
  }
  .note-h3 {
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--color-accent-green);
    margin: 1.5rem 0 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .note-h3::before {
    content: "";
    display: inline-block;
    width: 3px;
    height: 1em;
    background: var(--color-accent-green);
    border-radius: 2px;
    flex-shrink: 0;
  }
  .note-bold {
    color: var(--color-text-primary);
    font-weight: 600;
  }
  .note-ul, .note-ol {
    margin: 0.75rem 0;
    padding-left: 0;
    list-style: none;
  }
  .note-li, .note-oli {
    position: relative;
    padding-left: 1.25rem;
    margin: 0.5rem 0;
    line-height: 1.7;
  }
  .note-li::before {
    content: "";
    position: absolute;
    left: 0.25rem;
    top: 0.6em;
    width: 5px;
    height: 5px;
    background: var(--color-accent-green);
    border-radius: 50%;
  }
  .note-oli {
    counter-increment: note-counter;
  }
  .note-ol {
    counter-reset: note-counter;
  }
  .note-oli::before {
    content: counter(note-counter) ".";
    position: absolute;
    left: 0;
    top: 0;
    font-weight: 600;
    font-size: 0.8125rem;
    color: var(--color-accent-green);
    font-family: var(--font-mono);
  }
  .note-math-block {
    margin: 1rem 0;
    padding: 1rem 1.25rem;
    text-align: center;
    background: var(--color-surface-light);
    border-radius: 0.75rem;
    border: 1px solid var(--color-surface-border);
    overflow-x: auto;
  }
  .note-inline-code {
    padding: 0.1rem 0.35rem;
    background: var(--color-surface-lighter);
    border-radius: 0.25rem;
    font-family: var(--font-mono);
    font-size: 0.85em;
    color: var(--color-accent-green);
  }
`;

export default function NoteReaderPage() {
  const router = useRouter();
  const params = useParams();
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const formatSubject = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

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
    setBookmarked(!bookmarked); // optimistic
    setBookmarkLoading(true);
    try {
      const res = await fetch(`/api/notes/${note.id}/bookmark`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setBookmarked(data.bookmarked);
      else setBookmarked(!bookmarked); // revert
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
      console.error("PDF generation failed:", err);
      alert("PDF download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!note) return;
    const text = `I'm studying ${note.topicName} (${formatSubject(note.subject)}) with AI-powered notes on JambOS!\n\n${note.summary || ""}\n\njambos.ng`;
    if (navigator.share) {
      try { await navigator.share({ text, title: note.title }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
    </div>
  );

  if (!note) return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--color-surface)" }}>
      <div className="card p-8 text-center max-w-sm">
        <AlertTriangle className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-danger-400)" }} />
        <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>Note not found</p>
        <button onClick={() => router.push("/notes")} className="btn-secondary mt-4">Back to Notes</button>
      </div>
    </div>
  );

  const sections = [
    { id: "formulas", label: "Key Formulas", count: note.keyFormulas.length, icon: FileText, color: "var(--color-accent-green)", bgColor: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.12)", iconBg: "rgba(34,197,94,0.1)", items: note.keyFormulas, itemIcon: null },
    { id: "mistakes", label: "Common Mistakes", count: note.commonMistakes.length, icon: XCircle, color: "var(--color-danger-400)", bgColor: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.1)", iconBg: "rgba(239,68,68,0.08)", items: note.commonMistakes, itemIcon: AlertTriangle },
    { id: "tips", label: "Exam Tips", count: note.examTips.length, icon: Zap, color: "var(--color-warning-400)", bgColor: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.1)", iconBg: "rgba(245,158,11,0.08)", items: note.examTips, itemIcon: CheckCircle2 },
  ].filter((s) => s.count > 0);

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <style dangerouslySetInnerHTML={{ __html: NOTE_CSS }} />

      {/* Sticky header */}
      <header className="sticky top-0 z-30" style={{ background: "rgba(10,31,10,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--color-surface-border)" }}>
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/notes")} className="btn-ghost" style={{ padding: "0.25rem" }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1">
            <button onClick={toggleBookmark} disabled={bookmarkLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
              style={{ color: bookmarked ? "var(--color-warning-400)" : "var(--color-text-tertiary)" }}>
              {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
            <button onClick={handleDownload} disabled={downloading}
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ color: "var(--color-text-tertiary)" }}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </button>
            <button onClick={handleShare}
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ color: "var(--color-text-tertiary)" }}>
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
     
        {/* Title */}
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", lineHeight: 1.3, color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>
          {note.topicName}
        </h1>
        <p className="text-xs mb-6" style={{ color: "var(--color-text-muted)" }}>
          AI-generated study notes by JambOS
        </p>

        {/* Summary card */}
        {note.summary && (
          <div className="rounded-2xl p-4 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.01) 100%)", border: "1px solid rgba(34,197,94,0.12)" }}>
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: "var(--color-accent-green)" }} />
            <p className="text-[0.5625rem] font-bold uppercase tracking-widest mb-2 pl-3" style={{ color: "var(--color-accent-green)" }}>
              Key Takeaway
            </p>
            <p className="text-sm leading-relaxed pl-3" style={{ color: "var(--color-text-secondary)" }}>{note.summary}</p>
          </div>
        )}

        {/* Accordion sections */}
        <div className="space-y-2.5 mb-6">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isOpen = expandedSection === sec.id;
            return (
              <div key={sec.id} className="rounded-2xl overflow-hidden transition-all"
                style={{ border: `1px solid ${isOpen ? sec.borderColor : "var(--color-surface-border)"}` }}>
                <button onClick={() => toggleSection(sec.id)}
                  className="w-full flex items-center justify-between p-4 text-left transition-all"
                  style={{ background: isOpen ? sec.bgColor : "var(--color-surface-card)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: sec.iconBg }}>
                      <Icon className="h-4 w-4" style={{ color: sec.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{sec.label}</p>
                      <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>{sec.count} items</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4" style={{ color: sec.color }} /> : <ChevronDown className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-2" style={{ animation: "var(--animate-slide-up)" }}>
                    {sec.items.map((item, i) => {
                      const ItemIcon = sec.itemIcon;
                      return (
                        <div key={i} className="flex items-start gap-2.5 rounded-xl p-3" style={{ background: sec.bgColor, border: `1px solid ${sec.borderColor}` }}>
                          {ItemIcon && <ItemIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: sec.color }} />}
                          {!ItemIcon && <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: sec.color, fontFamily: "var(--font-mono)" }}>{i + 1}.</span>}
                          <div className="text-xs leading-relaxed flex-1" style={{ color: "var(--color-text-secondary)" }}
                            dangerouslySetInnerHTML={{ __html: renderContent(item) }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div className="rounded-2xl p-5 sm:p-6 mb-6" style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}>
          <div
            className="text-sm leading-[1.8]"
            style={{ color: "var(--color-text-secondary)" }}
            dangerouslySetInnerHTML={{ __html: renderContent(note.content) }}
          />
        </div>

        {/* Bottom actions */}
        <div className="flex gap-2 mb-4">
          <button onClick={toggleBookmark} disabled={bookmarkLoading}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: bookmarked ? "rgba(245,158,11,0.06)" : "var(--color-surface-card)",
              border: `1px solid ${bookmarked ? "rgba(245,158,11,0.2)" : "var(--color-surface-border)"}`,
              color: bookmarked ? "var(--color-warning-400)" : "var(--color-text-secondary)",
            }}>
            {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {bookmarked ? "Saved" : "Save"}
          </button>
          <button onClick={handleDownload} disabled={downloading}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)", color: "var(--color-text-secondary)" }}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </button>
          <button onClick={handleShare}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)", color: "var(--color-text-secondary)" }}>
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        <button onClick={() => router.push("/practice")} className="btn-primary w-full mb-2">
          <BookOpen className="h-4 w-4" /> Practice This Topic
        </button>
        <button onClick={() => router.push("/notes")} className="btn-secondary w-full">
          More Notes
        </button>
      </div>
    </div>
  );
}