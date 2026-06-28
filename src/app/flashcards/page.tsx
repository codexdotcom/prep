"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Puzzle, Upload, FileText, Loader2, Trash2,
  ChevronLeft, ChevronRight, RotateCcw, Sparkles, Eye, EyeOff,
  Check, X, Shuffle,
  Bookmark,
} from "lucide-react";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  tag: string;
}

interface Deck {
  title: string;
  cards: Flashcard[];
}

type Phase = "upload" | "generating" | "studying";

export default function FlashcardsPage() {
  const router = useRouter();
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
      formData.append("cardCount", String(cardCount));

      const res = await fetch("/api/flashcards/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      setDeck(data);
      setCurrentIndex(0);
      setFlipped(false);
      setKnown(new Set());
      setPhase("studying");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setPhase("upload");
    }
  };

  const resetAll = () => {
    setPhase("upload");
    setDeck(null);
    setText("");
    setFile(null);
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setError("");
  };

  const activeCards = deck ? (mode === "test" ? deck.cards.filter((c) => !known.has(c.id)) : deck.cards) : [];
  const currentCard = activeCards[currentIndex];
  const progress = deck ? Math.round((known.size / deck.cards.length) * 100) : 0;

  const goNext = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i + 1) % activeCards.length);
  };

  const goPrev = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i - 1 + activeCards.length) % activeCards.length);
  };

  const markKnown = () => {
    if (!currentCard) return;
    setKnown((prev) => new Set(prev).add(currentCard.id));
    setFlipped(false);
    if (activeCards.length <= 1) return; // last card
    setCurrentIndex((i) => i >= activeCards.length - 1 ? 0 : i);
  };

  const shuffleCards = () => {
    if (!deck) return;
    const shuffled = [...deck.cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setDeck({ ...deck, cards: shuffled });
    setCurrentIndex(0);
    setFlipped(false);
  };
const [deckSaved, setDeckSaved] = useState(false);

const saveDeck = async () => {
  if (!deck || deckSaved) return;
  try {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "flashcard", title: deck.title, data: { cards: deck.cards } }),
    });
    if (res.ok) setDeckSaved(true);
  } catch {}
};
  const resetProgress = () => {
    setKnown(new Set());
    setCurrentIndex(0);
    setFlipped(false);
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/tutor")} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Puzzle className="h-4 w-4" style={{ color: "#0ea5e9" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Flashcards</span>
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">

        {/* ═══ UPLOAD ═══ */}
        {phase === "upload" && (
          <div>
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#f5f5f5" }}>
                <Puzzle className="h-7 w-7" style={{ color: "#0ea5e9" }} />
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>
                Create flashcards from anything
              </h1>
              <p className="mt-2 text-sm mx-auto max-w-sm" style={{ color: "#777", lineHeight: 1.6 }}>
                Paste your notes or upload a document. AI creates a study deck instantly.
              </p>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Paste your study material</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Paste notes, textbook content, lecture transcripts..."
                rows={8} className="w-full rounded-xl p-4 text-sm outline-none resize-none"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#111", lineHeight: 1.6 }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#999"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#ddd"; }} />
              <p className="text-[0.625rem] mt-1 text-right" style={{ color: "#bbb" }}>{text.length.toLocaleString()} characters</p>
            </div>

            <div className="mb-6">
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
              {file ? (
                <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#fff", border: "1px solid #eee" }}>
                  <FileText className="h-5 w-5 shrink-0" style={{ color: "#0ea5e9" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#111" }}>{file.name}</p>
                    <p className="text-[0.625rem]" style={{ color: "#999" }}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="p-1" style={{ color: "#999" }}><Trash2 className="h-4 w-4" /></button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-4 transition-all"
                  style={{ background: "#fff", border: "2px dashed #ddd", color: "#999" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#bbb"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ddd"; }}>
                  <Upload className="h-4 w-4" /><span className="text-sm">Upload PDF, TXT, or Markdown</span>
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Number of cards</label>
              <select value={cardCount} onChange={(e) => setCardCount(parseInt(e.target.value))}
                className="w-full rounded-xl p-3 text-sm outline-none" style={{ background: "#fff", border: "1px solid #ddd", color: "#111", appearance: "none" }}>
                <option value={10}>10 cards</option>
                <option value={15}>15 cards</option>
                <option value={20}>20 cards</option>
                <option value={30}>30 cards</option>
              </select>
            </div>

            {error && <p className="text-sm mb-4 text-center" style={{ color: "#ef4444" }}>{error}</p>}

            <button onClick={handleGenerate} disabled={!text.trim() && !file}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all"
              style={{ background: "#111", color: "#fff", opacity: (!text.trim() && !file) ? 0.4 : 1 }}>
              <Sparkles className="h-4 w-4" /> Generate Flashcards
            </button>
          </div>
        )}

        {/* ═══ GENERATING ═══ */}
        {phase === "generating" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: "#0ea5e9" }} />
            <p className="text-sm font-medium" style={{ color: "#111" }}>Creating your flashcards...</p>
            <p className="text-xs mt-1" style={{ color: "#999" }}>AI is extracting key concepts from your content</p>
          </div>
        )}

        {/* ═══ STUDYING ═══ */}
        {phase === "studying" && deck && (
          <div>
            {/* Deck header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold" style={{ color: "#111" }}>{deck.title}</h1>
                <p className="text-xs" style={{ color: "#999" }}>
                  {known.size} of {deck.cards.length} known
                  {mode === "test" && activeCards.length === 0 && " - all done!"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={shuffleCards} className="p-2 rounded-lg transition-colors" style={{ color: "#999" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0f0"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  title="Shuffle">
                  <Shuffle className="h-4 w-4" />
                </button>
                <button onClick={resetProgress} className="p-2 rounded-lg transition-colors" style={{ color: "#999" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0f0"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  title="Reset progress">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={saveDeck} className="p-2 rounded-lg transition-colors"
  style={{ color: deckSaved ? "#22c55e" : "#999" }}
  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0f0"; }}
  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
  title={deckSaved ? "Saved" : "Save deck"}>
  {deckSaved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
</button>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, borderRadius: 9999, background: "#eee", marginBottom: 8 }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 9999, background: "#111", transition: "width 0.3s" }} />
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 mb-6 rounded-lg p-0.5" style={{ background: "#f0f0f0" }}>
              {(["browse", "test"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setCurrentIndex(0); setFlipped(false); }}
                  className="flex-1 rounded-md py-1.5 text-xs font-medium transition-all"
                  style={{ background: mode === m ? "#fff" : "transparent", color: mode === m ? "#111" : "#999", boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>
                  {m === "browse" ? "Browse All" : `Study (${deck.cards.length - known.size} left)`}
                </button>
              ))}
            </div>

            {/* Card */}
            {activeCards.length > 0 && currentCard ? (
              <>
                <button
                  onClick={() => setFlipped(!flipped)}
                  className="w-full rounded-2xl p-8 text-center transition-all"
                  style={{
                    background: "#fff",
                    border: flipped ? "2px solid #111" : "1px solid #eee",
                    minHeight: 240,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {!flipped ? (
                    <>
                      <p className="text-lg" style={{ fontFamily: "var(--font-display)", color: "#111", lineHeight: 1.4 }}>
                        {currentCard.front}
                      </p>
                      <p className="text-[0.625rem] mt-4" style={{ color: "#bbb" }}>Tap to reveal answer</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[0.625rem] uppercase tracking-wider mb-3" style={{ color: "#bbb" }}>Answer</p>
                      <p className="text-base" style={{ color: "#333", lineHeight: 1.6 }}>
                        {currentCard.back}
                      </p>
                    </>
                  )}
                </button>

                {/* Tag */}
                {currentCard.tag && (
                  <p className="text-center mt-2 text-[0.625rem]" style={{ color: "#bbb" }}>
                    {currentCard.tag}
                  </p>
                )}

                {/* Controls */}
                <div className="flex items-center justify-between mt-6">
                  <button onClick={goPrev} className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium"
                    style={{ background: "#fff", border: "1px solid #ddd", color: "#555" }}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {flipped && mode === "test" && (
                      <>
                        <button onClick={goNext}
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium"
                          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
                          <X className="h-4 w-4" /> Still learning
                        </button>
                        <button onClick={markKnown}
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium"
                          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}>
                          <Check className="h-4 w-4" /> Got it
                        </button>
                      </>
                    )}
                    {!flipped && (
                      <button onClick={() => setFlipped(true)}
                        className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold"
                        style={{ background: "#111", color: "#fff" }}>
                        <Eye className="h-4 w-4" /> Reveal
                      </button>
                    )}
                    {flipped && mode === "browse" && (
                      <button onClick={goNext}
                        className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold"
                        style={{ background: "#111", color: "#fff" }}>
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <button onClick={goNext} className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium"
                    style={{ background: "#fff", border: "1px solid #ddd", color: "#555" }}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Card counter */}
                <p className="text-center mt-4 text-xs" style={{ fontFamily: "var(--font-mono)", color: "#bbb" }}>
                  {currentIndex + 1} / {activeCards.length}
                </p>
              </>
            ) : (
              <div className="text-center py-12 rounded-2xl" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-2xl mb-2">🎉</p>
                <h2 className="text-lg font-semibold" style={{ color: "#111" }}>All cards mastered!</h2>
                <p className="text-sm mt-1 mb-4" style={{ color: "#777" }}>You've marked all {deck.cards.length} cards as known.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={resetProgress} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
                    style={{ background: "#fff", border: "1px solid #ddd", color: "#555" }}>
                    <RotateCcw className="h-4 w-4" /> Study Again
                  </button>
                  <button onClick={resetAll} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                    style={{ background: "#111", color: "#fff" }}>
                    New Deck
                  </button>
                </div>
              </div>
            )}

            {/* New deck button */}
            <div className="mt-8 text-center">
              <button onClick={resetAll} className="text-xs font-medium" style={{ color: "#999" }}>
                Generate a new deck
              </button>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-6 text-center" style={{ borderTop: "1px solid #eee" }}>
          <div className="flex items-center justify-center gap-0.5 mb-3">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111" }}>Jamb</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111", fontWeight: 700 }}>OS</span>
          </div>
          <p className="text-xs" style={{ color: "#bbb" }}>&copy; {new Date().getFullYear()} JambOS. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}