"use client";

import { useState, useRef } from "react";
import {
  Puzzle, Upload, FileText, Loader2, Trash2, ChevronLeft, ChevronRight,
  RotateCcw, Sparkles, Eye, Check, X, Shuffle, Bookmark,
} from "lucide-react";
import { FeatureGate } from "@/components/ui/feature-gate";
import { FeatureHeader } from "@/components/ui/feature-header";
import { PageFooter } from "@/components/ui/page-footer";
import { useUsage } from "@/hooks/use-usage";

interface Flashcard { id: number; front: string; back: string; tag: string }
interface Deck { title: string; cards: Flashcard[] }
type Phase = "upload" | "generating" | "studying";

function FlashcardsContent() {
  const usage = useUsage("flashcards");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cardCount, setCardCount] = useState(15);
  const [phase, setPhase] = useState<Phase>("upload");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<"browse" | "test">("browse");
  const [deckSaved, setDeckSaved] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim() && !file) { setError("Paste some text or upload a file first."); return; }
    setError(""); setPhase("generating");
    try {
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      if (file) formData.append("file", file);
      formData.append("cardCount", String(cardCount));
      const res = await fetch("/api/flashcards/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setDeck(data); setCurrentIndex(0); setFlipped(false); setKnown(new Set()); setDeckSaved(false);
      setPhase("studying");
      await usage.record();
    } catch (err: any) { setError(err.message); setPhase("upload"); }
  };

  const saveDeck = async () => {
    if (!deck || deckSaved) return;
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "flashcard", title: deck.title, data: { cards: deck.cards } }),
      });
      if (res.ok) setDeckSaved(true);
    } catch {}
  };

  const resetAll = () => { setPhase("upload"); setDeck(null); setText(""); setFile(null); setCurrentIndex(0); setFlipped(false); setKnown(new Set()); setError(""); setDeckSaved(false); };

  const activeCards = deck ? (mode === "test" ? deck.cards.filter((c) => !known.has(c.id)) : deck.cards) : [];
  const currentCard = activeCards[currentIndex];
  const progress = deck ? Math.round((known.size / deck.cards.length) * 100) : 0;

  const goNext = () => { setFlipped(false); setCurrentIndex((i) => (i + 1) % activeCards.length); };
  const goPrev = () => { setFlipped(false); setCurrentIndex((i) => (i - 1 + activeCards.length) % activeCards.length); };

  const markKnown = () => {
    if (!currentCard) return;
    setKnown((prev) => new Set(prev).add(currentCard.id));
    setFlipped(false);
    if (activeCards.length <= 1) return;
    setCurrentIndex((i) => i >= activeCards.length - 1 ? 0 : i);
  };

  const shuffleCards = () => {
    if (!deck) return;
    const shuffled = [...deck.cards];
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    setDeck({ ...deck, cards: shuffled }); setCurrentIndex(0); setFlipped(false);
  };

  const resetProgress = () => { setKnown(new Set()); setCurrentIndex(0); setFlipped(false); };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      

      {phase === "upload" && (
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-semibold" style={{ color: "#111" }}>Create flashcards from anything</h1>
            <p className="text-sm mt-1" style={{ color: "#888" }}>Paste notes or upload a document. AI builds a study deck instantly.</p>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#444" }}>Study material</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Paste notes, textbook excerpts, or lecture content..."
              rows={7} className="w-full rounded-lg p-4 text-sm outline-none resize-none"
              style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111", lineHeight: 1.6 }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#aaa"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#e0e0e0"; }} />
          </div>

          <div className="mb-5">
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
            {file ? (
              <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
                <FileText className="h-4 w-4 shrink-0" style={{ color: "#0ea5e9" }} />
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

          <div className="mb-5">
            <label className="text-xs font-medium mb-1 block" style={{ color: "#444" }}>Cards</label>
            <select value={cardCount} onChange={(e) => setCardCount(parseInt(e.target.value))}
              className="w-full rounded-lg p-2.5 text-sm outline-none" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}>
              {[10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} cards</option>)}
            </select>
          </div>

          {error && <p className="text-sm mb-3 text-center" style={{ color: "#dc2626" }}>{error}</p>}

          <button onClick={handleGenerate} disabled={!text.trim() && !file}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-all"
            style={{ background: "#111", color: "#fff", opacity: (!text.trim() && !file) ? 0.35 : 1 }}>
            Generate Flashcards
          </button>
        </div>
      )}

      {phase === "generating" && (
        <div className="flex flex-col items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin mb-3" style={{ color: "#0ea5e9" }} />
          <p className="text-sm" style={{ color: "#555" }}>Extracting key concepts...</p>
        </div>
      )}

      {phase === "studying" && deck && (
        <div>
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-base font-semibold" style={{ color: "#111" }}>{deck.title}</h1>
              <p className="text-xs" style={{ color: "#aaa" }}>
                {known.size} of {deck.cards.length} known{mode === "test" && activeCards.length === 0 ? " - all done" : ""}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={shuffleCards} className="p-1.5 rounded-md transition-colors" style={{ color: "#aaa" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0f0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <Shuffle className="h-4 w-4" />
              </button>
              <button onClick={resetProgress} className="p-1.5 rounded-md transition-colors" style={{ color: "#aaa" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0f0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <RotateCcw className="h-4 w-4" />
              </button>
              <button onClick={saveDeck} className="p-1.5 rounded-md transition-colors"
                style={{ color: deckSaved ? "#22c55e" : "#aaa" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0f0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                {deckSaved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Progress */}
          <div style={{ height: 3, borderRadius: 99, background: "#eee", marginBottom: 6 }}>
            <div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: "#111", transition: "width 0.3s" }} />
          </div>

          {/* Mode toggle */}
          <div className="flex gap-0.5 mb-5 rounded-md p-0.5" style={{ background: "#ececec" }}>
            {(["browse", "test"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setCurrentIndex(0); setFlipped(false); }}
                className="flex-1 rounded py-1.5 text-xs font-medium transition-all"
                style={{ background: mode === m ? "#fff" : "transparent", color: mode === m ? "#111" : "#999", boxShadow: mode === m ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}>
                {m === "browse" ? "Browse All" : `Study (${deck.cards.length - known.size} left)`}
              </button>
            ))}
          </div>

          {/* Card */}
          {activeCards.length > 0 && currentCard ? (
            <>
              <button onClick={() => setFlipped(!flipped)}
                className="w-full rounded-xl p-8 text-center transition-all"
                style={{
                  background: "#fff", border: flipped ? "2px solid #111" : "1px solid #e8e8e8",
                  minHeight: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                {!flipped ? (
                  <>
                    <p className="text-lg" style={{ fontFamily: "var(--font-display)", color: "#111", lineHeight: 1.4 }}>{currentCard.front}</p>
                    <p className="text-[0.625rem] mt-4" style={{ color: "#ccc" }}>Tap to reveal</p>
                  </>
                ) : (
                  <>
                    <p className="text-[0.5625rem] uppercase tracking-wider mb-2" style={{ color: "#bbb" }}>Answer</p>
                    <p className="text-[0.9375rem]" style={{ color: "#333", lineHeight: 1.6 }}>{currentCard.back}</p>
                  </>
                )}
              </button>

              {currentCard.tag && <p className="text-center mt-2 text-[0.625rem]" style={{ color: "#ccc" }}>{currentCard.tag}</p>}

              {/* Controls */}
              <div className="flex items-center justify-between mt-5">
                <button onClick={goPrev} className="rounded-lg px-3 py-2" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555" }}>
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2">
                  {flipped && mode === "test" && (
                    <>
                      <button onClick={goNext} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm"
                        style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b" }}>
                        <X className="h-3.5 w-3.5" /> Learning
                      </button>
                      <button onClick={markKnown} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm"
                        style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#166534" }}>
                        <Check className="h-3.5 w-3.5" /> Got it
                      </button>
                    </>
                  )}
                  {!flipped && (
                    <button onClick={() => setFlipped(true)} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
                      style={{ background: "#111", color: "#fff" }}>
                      <Eye className="h-4 w-4" /> Reveal
                    </button>
                  )}
                  {flipped && mode === "browse" && (
                    <button onClick={goNext} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
                      style={{ background: "#111", color: "#fff" }}>
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button onClick={goNext} className="rounded-lg px-3 py-2" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555" }}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <p className="text-center mt-3 text-xs" style={{ fontFamily: "var(--font-mono)", color: "#ccc" }}>
                {currentIndex + 1} / {activeCards.length}
              </p>
            </>
          ) : (
            <div className="text-center py-12 rounded-xl" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <h2 className="text-base font-semibold" style={{ color: "#111" }}>All cards mastered</h2>
              <p className="text-sm mt-1 mb-4" style={{ color: "#888" }}>You have marked all {deck.cards.length} cards as known.</p>
              <div className="flex justify-center gap-2.5">
                <button onClick={resetProgress} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm"
                  style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555" }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Study Again
                </button>
                <button onClick={resetAll} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold"
                  style={{ background: "#111", color: "#fff" }}>New Deck</button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button onClick={resetAll} className="text-xs" style={{ color: "#aaa" }}>Generate a new deck</button>
          </div>
        </div>
      )}

      <PageFooter />
    </div>
  );
}

export default function FlashcardsPage() {
  const header = <FeatureHeader title="Flashcards" icon={<Puzzle className="h-4 w-4" style={{ color: "#0ea5e9" }} />} />;
  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      {header}
      <FeatureGate feature="flashcards" header={header}>
        <FlashcardsContent />
      </FeatureGate>
    </div>
  );
}