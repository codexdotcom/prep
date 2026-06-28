"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Gamepad2, Zap, Loader2, RotateCcw,
  Shuffle, Brain, Flame, Heart, Sparkles,
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";

// ═══ TYPES ═══
interface SpeedQuestion { id: number; dbId: string; question: string; options: string[]; correct: number; points: number; difficulty: string; topic: string; explanation: string }
interface ScrambleWord { id: number; word: string; hint: string; category: string; points: number }
interface MatchPair { id: number; term: string; definition: string }
interface TFStatement { id: number; statement: string; isTrue: boolean; explanation: string; points: number; topic: string }
type GameType = "speed-quiz" | "word-scramble" | "memory-match" | "true-false";
type Phase = "menu" | "setup" | "loading" | "playing" | "results";

const GAMES = [
  { id: "speed-quiz" as GameType, title: "Speed Quiz", desc: "Answer before time runs out. Wrong answers lose a life.", icon: Zap, color: "#ef4444", emoji: "⚡" },
  { id: "word-scramble" as GameType, title: "Word Scramble", desc: "Unscramble key JAMB terms from your question bank.", icon: Shuffle, color: "#8b5cf6", emoji: "🔤" },
  { id: "memory-match" as GameType, title: "Memory Match", desc: "Match questions with their correct answers.", icon: Brain, color: "#3b82f6", emoji: "🧠" },
  { id: "true-false" as GameType, title: "True or False", desc: "Is the statement correct? Decide before time's up.", icon: Flame, color: "#f97316", emoji: "🔥" },
];

// ═══ ANIMATED BACKGROUND ═══
function GameBackground({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Floating shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const size = 8 + Math.random() * 24;
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const duration = 4 + Math.random() * 6;
          const delay = Math.random() * 5;
          const shape = i % 3 === 0 ? "50%" : i % 3 === 1 ? "30%" : "0%";
          return (
            <div key={i} className="absolute" style={{
              left: `${x}%`, top: `${y}%`, width: size, height: size,
              borderRadius: shape, background: color, opacity: 0.04 + Math.random() * 0.04,
              animation: `arcadeFloat ${duration}s ease-in-out ${delay}s infinite alternate`,
            }} />
          );
        })}
      </div>
      <style>{`@keyframes arcadeFloat { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(-30px) rotate(${Math.random() > 0.5 ? '' : '-'}15deg); } }`}</style>
      <div className="relative" style={{ zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ═══ SCORE POPUP ═══
function ScorePopup({ value, x, y }: { value: string; x: number; y: number }) {
  return (
    <div className="fixed pointer-events-none font-bold text-lg" style={{
      left: x, top: y, color: value.startsWith("+") ? "#22c55e" : "#ef4444",
      fontFamily: "var(--font-mono)", animation: "popUp 0.8s ease-out forwards", zIndex: 100,
    }}>
      {value}
      <style>{`@keyframes popUp { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-60px) scale(1.5); } }`}</style>
    </div>
  );
}

// ═══ SPEED QUIZ ═══
function SpeedQuizGame({ questions, onFinish }: { questions: SpeedQuestion[]; onFinish: (s: number, t: number) => void }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(12);
  const [answered, setAnswered] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(1);
  const [popups, setPopups] = useState<Array<{ id: number; value: string; x: number; y: number }>>([]);
  const [shake, setShake] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popupId = useRef(0);

  useEffect(() => {
    if (lives <= 0 || current >= questions.length) { onFinish(score, questions.reduce((a, q) => a + q.points, 0)); return; }
    setTimeLeft(12); setAnswered(null);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { handleTimeout(); return 0; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, lives]);

  const addPopup = (value: string, e?: React.MouseEvent) => {
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY - 20 : window.innerHeight / 2;
    const id = popupId.current++;
    setPopups((p) => [...p, { id, value, x, y }]);
    setTimeout(() => setPopups((p) => p.filter((pp) => pp.id !== id)), 800);
  };

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLives((l) => l - 1); setStreak(0); setCombo(1);
    setShake(true); setTimeout(() => setShake(false), 500);
    setTimeout(() => setCurrent((c) => c + 1), 500);
  };

  const handleAnswer = (idx: number, e: React.MouseEvent) => {
    if (answered !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setAnswered(idx);
    const q = questions[current];
    if (idx === q.correct) {
      const pts = q.points * Math.min(combo, 4);
      setScore((s) => s + pts);
      setStreak((s) => s + 1);
      setCombo((c) => Math.min(c + 1, 4));
      addPopup(`+${pts}`, e);
    } else {
      setLives((l) => l - 1); setStreak(0); setCombo(1);
      setShake(true); setTimeout(() => setShake(false), 500);
      addPopup("-1 ❤️", e);
    }
    setTimeout(() => setCurrent((c) => c + 1), 1000);
  };

  if (current >= questions.length || lives <= 0) return null;
  const q = questions[current];
  const diffColor = q.difficulty === "EASY" ? "#22c55e" : q.difficulty === "HARD" ? "#ef4444" : "#f59e0b";

  return (
    <div className={shake ? "animate-shake" : ""}>
      <style>{`@keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }`}
        {`.animate-shake { animation: shake 0.4s ease-in-out; }`}</style>

      {popups.map((p) => <ScorePopup key={p.id} {...p} />)}

      {/* HUD */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} className="h-6 w-6 transition-all" fill={i < lives ? "#ef4444" : "none"}
              style={{ color: i < lives ? "#ef4444" : "#ddd", transform: i < lives ? "scale(1)" : "scale(0.8)", transition: "all 0.3s" }} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          {combo > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "#fef3c7", border: "1px solid #fcd34d" }}>
              <Flame className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />
              <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: "#b45309" }}>{combo}x</span>
            </div>
          )}
          <div className="px-3 py-1 rounded-full" style={{ background: "#f5f5f5" }}>
            <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{score}</span>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="relative mb-6">
        <div className="overflow-hidden rounded-full" style={{ height: 8, background: "#eee" }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${(timeLeft / 12) * 100}%`,
            background: timeLeft <= 3 ? "#ef4444" : timeLeft <= 6 ? "#f59e0b" : "#22c55e",
            transition: "width 1s linear, background 0.3s",
          }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[0.625rem]" style={{ fontFamily: "var(--font-mono)", color: "#999" }}>{current + 1}/{questions.length}</span>
            <span className="text-[0.625rem] font-semibold" style={{ color: diffColor }}>{q.difficulty}</span>
          </div>
          <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: timeLeft <= 3 ? "#ef4444" : "#555" }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Streak badge */}
      {streak >= 3 && (
        <div className="text-center mb-3 animate-bounce">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#ea580c" }}>
            <Flame className="h-3.5 w-3.5" /> {streak} streak!
          </span>
        </div>
      )}

      {/* Question card */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: "#fff", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <p className="text-[0.625rem] font-semibold mb-2" style={{ color: "#999" }}>{q.topic}</p>
        <p className="text-base font-medium" style={{ color: "#111", lineHeight: 1.6 }}>{q.question}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {q.options.map((opt, i) => {
          const colors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];
          const bgs = ["#eff6ff", "#f5f3ff", "#fffbeb", "#fef2f2"];
          let bg = bgs[i];
          let border = `2px solid ${colors[i]}30`;
          let textColor = "#333";

          if (answered !== null) {
            if (i === q.correct) { bg = "#f0fdf4"; border = "2px solid #22c55e"; textColor = "#166534"; }
            else if (i === answered) { bg = "#fef2f2"; border = "2px solid #ef4444"; textColor = "#991b1b"; }
            else { bg = "#f9f9f9"; border = "2px solid #eee"; textColor = "#bbb"; }
          }

          return (
            <button key={i} onClick={(e) => handleAnswer(i, e)} disabled={answered !== null}
              className="rounded-xl p-4 text-left transition-all active:scale-95"
              style={{ background: bg, border, color: textColor }}>
              <span className="text-xs font-bold mr-2 inline-flex h-6 w-6 items-center justify-center rounded-lg"
                style={{ fontFamily: "var(--font-mono)", background: answered !== null && i === q.correct ? "#22c55e" : `${colors[i]}20`, color: answered !== null && i === q.correct ? "#fff" : colors[i] }}>
                {["A", "B", "C", "D"][i]}
              </span>
              <span className="text-sm font-medium ml-1">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation after answer */}
      {answered !== null && q.explanation && (
        <div className="mt-3 rounded-xl p-3" style={{ background: "#f8f8f8", border: "1px solid #eee" }}>
          <p className="text-xs" style={{ color: "#555", lineHeight: 1.5 }}>{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ═══ WORD SCRAMBLE ═══
function scramble(word: string): string {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr.join("") === word ? scramble(word) : arr.join("");
}

function WordScrambleGame({ words, onFinish }: { words: ScrambleWord[]; onFinish: (s: number, t: number) => void }) {
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [scrambled, setScrambled] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (current >= words.length) { onFinish(score, words.reduce((a, w) => a + w.points, 0)); return; }
    const s = scramble(words[current].word);
    setScrambled(s); setInput(""); setShowHint(false); setFeedback(null); setTimeLeft(30); setSelectedLetters([]);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { handleSkip(); return 0; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current]);

  const handleLetterTap = (letter: string, idx: number) => {
    if (selectedLetters.includes(idx) || feedback) return;
    setSelectedLetters((p) => [...p, idx]);
    setInput((p) => p + letter);
  };

  const handleBackspace = () => {
    if (input.length === 0) return;
    const lastIdx = selectedLetters[selectedLetters.length - 1];
    setSelectedLetters((p) => p.slice(0, -1));
    setInput((p) => p.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const w = words[current];
    if (input.trim().toUpperCase() === w.word) {
      setFeedback("correct");
      const hintPenalty = showHint ? Math.floor(w.points / 2) : 0;
      const timeBonus = timeLeft > 20 ? 10 : timeLeft > 10 ? 5 : 0;
      setScore((s) => s + w.points - hintPenalty + timeBonus);
    } else { setFeedback("wrong"); }
    setTimeout(() => setCurrent((c) => c + 1), 1200);
  };

  const handleSkip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFeedback("wrong");
    setTimeout(() => setCurrent((c) => c + 1), 800);
  };

  // Auto-submit when all letters used
  useEffect(() => {
    if (current < words.length && input.length === words[current].word.length && !feedback) {
      handleSubmit();
    }
  }, [input]);

  if (current >= words.length) return null;
  const w = words[current];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#999" }}>{current + 1}/{words.length}</span>
        <div className="px-3 py-1 rounded-full" style={{ background: "#f5f3ff" }}>
          <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "#8b5cf6" }}>{score}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-full mb-6" style={{ height: 6, background: "#eee" }}>
        <div style={{ width: `${(timeLeft / 30) * 100}%`, height: "100%", borderRadius: 9999, background: timeLeft <= 5 ? "#ef4444" : "#8b5cf6", transition: "width 1s linear" }} />
      </div>

      {/* Card */}
      <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: "#fff", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <p className="text-[0.625rem] uppercase tracking-wider mb-4" style={{ color: "#8b5cf6" }}>{w.category}</p>

        {/* Scrambled letter tiles */}
        <div className="flex justify-center gap-2 mb-5 flex-wrap">
          {scrambled.split("").map((letter, i) => {
            const used = selectedLetters.includes(i);
            return (
              <button key={i} onClick={() => handleLetterTap(letter, i)} disabled={used || feedback !== null}
                className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold transition-all active:scale-90"
                style={{
                  fontFamily: "var(--font-mono)", color: used ? "#ccc" : "#111",
                  background: used ? "#f9f9f9" : "#f5f3ff", border: `2px solid ${used ? "#eee" : "#c4b5fd"}`,
                  transform: used ? "scale(0.85)" : "scale(1)", opacity: used ? 0.4 : 1,
                }}>
                {letter}
              </button>
            );
          })}
        </div>

        {/* Answer display */}
        <div className="flex justify-center gap-1.5 mb-4">
          {Array.from({ length: w.word.length }).map((_, i) => (
            <div key={i} className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
              style={{
                fontFamily: "var(--font-mono)", color: "#111",
                background: input[i] ? (feedback === "correct" ? "#f0fdf4" : feedback === "wrong" ? "#fef2f2" : "#fff") : "#fafafa",
                border: `2px solid ${input[i] ? (feedback === "correct" ? "#22c55e" : feedback === "wrong" ? "#ef4444" : "#ddd") : "#eee"}`,
              }}>
              {input[i] || ""}
            </div>
          ))}
        </div>

        {feedback === "wrong" && <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>Answer: {w.word}</p>}
        {feedback === "correct" && <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>Correct! 🎉</p>}
        {showHint && !feedback && <p className="text-xs mt-2" style={{ color: "#777" }}>💡 {w.hint}</p>}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button onClick={() => setShowHint(true)} disabled={showHint || !!feedback}
          className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: showHint ? "#ccc" : "#8b5cf6", background: showHint ? "transparent" : "#f5f3ff" }}>
          💡 Hint {showHint && "(used)"}
        </button>
        <div className="flex gap-2">
          <button onClick={handleBackspace} disabled={!input || !!feedback}
            className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "#f5f5f5", color: "#555" }}>
            ← Undo
          </button>
          <button onClick={handleSkip} disabled={!!feedback}
            className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "#f5f5f5", color: "#999" }}>
            Skip →
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ MEMORY MATCH ═══
interface MemoryCard { id: string; pairId: number; text: string; type: "term" | "def"; flipped: boolean; matched: boolean }

function MemoryMatchGame({ pairs, onFinish }: { pairs: MatchPair[]; onFinish: (s: number, t: number) => void }) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [lockBoard, setLockBoard] = useState(false);
  const [lastMatch, setLastMatch] = useState(false);

  useEffect(() => {
    const all: MemoryCard[] = [];
    pairs.forEach((p) => {
      all.push({ id: `t-${p.id}`, pairId: p.id, text: p.term, type: "term", flipped: false, matched: false });
      all.push({ id: `d-${p.id}`, pairId: p.id, text: p.definition, type: "def", flipped: false, matched: false });
    });
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    setCards(all);
  }, [pairs]);

  useEffect(() => {
    if (matched === pairs.length && matched > 0) {
      const maxMoves = pairs.length * 3;
      const efficiency = Math.max(0, Math.round(((maxMoves - moves) / maxMoves) * 100));
      setTimeout(() => onFinish(efficiency, 100), 600);
    }
  }, [matched]);

  const handleFlip = (id: string) => {
    if (lockBoard) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    const newCards = cards.map((c) => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newSel = [...selected, id];
    setSelected(newSel);

    if (newSel.length === 2) {
      setMoves((m) => m + 1); setLockBoard(true);
      const [f, s] = newSel.map((sid) => newCards.find((c) => c.id === sid)!);
      if (f.pairId === s.pairId && f.type !== s.type) {
        setLastMatch(true);
        setTimeout(() => {
          setCards((p) => p.map((c) => c.pairId === f.pairId ? { ...c, matched: true } : c));
          setMatched((m) => m + 1); setSelected([]); setLockBoard(false); setLastMatch(false);
        }, 600);
      } else {
        setTimeout(() => {
          setCards((p) => p.map((c) => newSel.includes(c.id) ? { ...c, flipped: false } : c));
          setSelected([]); setLockBoard(false);
        }, 1000);
      }
    }
  };

  const pairColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#6366f1", "#0ea5e9"];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#999" }}>{matched}/{pairs.length}</span>
          {lastMatch && <span className="text-xs font-bold animate-bounce" style={{ color: "#22c55e" }}>Match! ✨</span>}
        </div>
        <div className="px-3 py-1 rounded-full" style={{ background: "#eff6ff" }}>
          <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "#3b82f6" }}>{moves} moves</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => {
          const pairColor = pairColors[card.pairId % pairColors.length];
          return (
            <button key={card.id} onClick={() => handleFlip(card.id)}
              className="rounded-xl text-center transition-all active:scale-95"
              style={{
                minHeight: 85, padding: "0.5rem",
                background: card.matched ? `${pairColor}10` : card.flipped ? "#fff" : `linear-gradient(135deg, ${pairColor}15, ${pairColor}05)`,
                border: `2px solid ${card.matched ? pairColor : card.flipped ? "#ddd" : `${pairColor}30`}`,
                opacity: card.matched ? 0.5 : 1,
                transform: card.flipped ? "rotateY(0deg)" : "rotateY(0deg)",
              }}>
              {card.flipped || card.matched ? (
                <p className="text-[0.625rem] font-medium" style={{ color: card.type === "term" ? "#111" : "#555", lineHeight: 1.3 }}>
                  {card.text}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-2xl">❓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══ TRUE FALSE ═══
function TrueFalseGame({ statements, onFinish }: { statements: TFStatement[]; onFinish: (s: number, t: number) => void }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [streak, setStreak] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (current >= statements.length) { onFinish(score, statements.reduce((a, s) => a + s.points, 0)); return; }
    setAnswered(null); setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { handleAnswer(null); return 0; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current]);

  const handleAnswer = (answer: boolean | null) => {
    if (answered !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const s = statements[current];
    const correct = answer === s.isTrue;
    setAnswered(answer);
    if (correct) { setScore((sc) => sc + s.points); setStreak((st) => st + 1); }
    else setStreak(0);
    setTimeout(() => setCurrent((c) => c + 1), 1800);
  };

  if (current >= statements.length) return null;
  const s = statements[current];
  const isCorrect = answered !== null && answered === s.isTrue;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#999" }}>{current + 1}/{statements.length}</span>
        <div className="flex items-center gap-2">
          {streak >= 3 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fff7ed", color: "#ea580c" }}>
              🔥 {streak}
            </span>
          )}
          <div className="px-3 py-1 rounded-full" style={{ background: "#fff7ed" }}>
            <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "#f97316" }}>{score}</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-full mb-6" style={{ height: 8, background: "#eee" }}>
        <div style={{ width: `${(timeLeft / 10) * 100}%`, height: "100%", borderRadius: 9999, background: timeLeft <= 3 ? "#ef4444" : "#f97316", transition: "width 1s linear" }} />
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <p className="text-[0.625rem] font-semibold mb-2" style={{ color: "#999" }}>{s.topic}</p>
        <p className="text-base font-medium" style={{ color: "#111", lineHeight: 1.6 }}>{s.statement}</p>
        {answered !== null && (
          <div className="mt-4 rounded-xl p-3" style={{ background: isCorrect ? "#f0fdf4" : "#fef2f2", border: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}` }}>
            <p className="text-xs font-semibold mb-0.5" style={{ color: isCorrect ? "#166534" : "#991b1b" }}>
              {isCorrect ? "✓ Correct!" : `✗ Wrong! It's ${s.isTrue ? "True" : "False"}`}
            </p>
            <p className="text-xs" style={{ color: "#555" }}>{s.explanation}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => handleAnswer(true)} disabled={answered !== null}
          className="rounded-2xl py-6 text-center transition-all active:scale-95"
          style={{
            background: answered !== null && s.isTrue ? "#f0fdf4" : "#fff",
            border: `3px solid ${answered !== null && s.isTrue ? "#22c55e" : answered !== null ? "#eee" : "#bbf7d0"}`,
          }}>
          <span className="text-3xl mb-1 block">✅</span>
          <span className="text-sm font-bold" style={{ color: "#22c55e" }}>TRUE</span>
        </button>
        <button onClick={() => handleAnswer(false)} disabled={answered !== null}
          className="rounded-2xl py-6 text-center transition-all active:scale-95"
          style={{
            background: answered !== null && !s.isTrue ? "#fef2f2" : "#fff",
            border: `3px solid ${answered !== null && !s.isTrue ? "#ef4444" : answered !== null ? "#eee" : "#fecaca"}`,
          }}>
          <span className="text-3xl mb-1 block">❌</span>
          <span className="text-sm font-bold" style={{ color: "#ef4444" }}>FALSE</span>
        </button>
      </div>
    </div>
  );
}

// ═══ MAIN PAGE ═══
export default function ArcadePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("menu");
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [subject, setSubject] = useState("");
  const [gameData, setGameData] = useState<any>(null);
  const [error, setError] = useState("");
  const [finalScore, setFinalScore] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  const gameConfig = GAMES.find((g) => g.id === selectedGame);

  const handleStart = async () => {
    if (!subject || !selectedGame) return;
    setError(""); setPhase("loading");
    try {
      const res = await fetch("/api/arcade/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: selectedGame, subject, difficulty: "mixed" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGameData(data); setPhase("playing");
    } catch (err: any) { setError(err.message); setPhase("setup"); }
  };

  const handleFinish = (score: number, total: number) => { setFinalScore(score); setFinalTotal(total); setPhase("results"); };

  const resetAll = () => {
    setPhase("menu"); setSelectedGame(null); setSubject(""); setGameData(null);
    setFinalScore(0); setFinalTotal(0); setError("");
  };

  const pct = finalTotal > 0 ? Math.round((finalScore / finalTotal) * 100) : 0;
  const resultEmoji = pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : pct >= 40 ? "💪" : "📚";
  const resultMsg = pct >= 80 ? "Outstanding!" : pct >= 60 ? "Great job!" : pct >= 40 ? "Good effort!" : "Keep practicing!";

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => phase === "menu" ? router.push("/tutor") : phase === "playing" ? {} : resetAll}
            className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">{phase === "menu" ? "Back" : "Arcade"}</span>
          </button>
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" style={{ color: "#f97316" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Arcade</span>
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        <GameBackground color={gameConfig?.color || "#f97316"}>

          {/* MENU */}
          {phase === "menu" && (
            <div>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">🎮</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "#111" }}>Study Arcade</h1>
                <p className="mt-2 text-sm mx-auto max-w-sm" style={{ color: "#777", lineHeight: 1.6 }}>
                  Learn through games using real questions from your JAMB question bank.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GAMES.map(({ id, title, desc, icon: Icon, color, emoji }) => (
                  <button key={id} onClick={() => { setSelectedGame(id); setPhase("setup"); }}
                    className="rounded-2xl p-5 text-left transition-all active:scale-98"
                    style={{ background: "#fff", border: "2px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${color}15`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#eee"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{emoji}</span>
                      <p className="text-base font-semibold" style={{ color: "#111" }}>{title}</p>
                    </div>
                    <p className="text-xs" style={{ color: "#777", lineHeight: 1.5 }}>{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SETUP */}
          {phase === "setup" && gameConfig && (
            <div>
              <div className="text-center mb-8">
                <span className="text-4xl">{gameConfig.emoji}</span>
                <h1 className="mt-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>{gameConfig.title}</h1>
                <p className="mt-1 text-sm" style={{ color: "#777" }}>{gameConfig.desc}</p>
              </div>
              <div className="mb-6">
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#555" }}>Choose a subject</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {JAMB_SUBJECTS.slice(0, 9).map((s) => (
                    <button key={s.value} onClick={() => setSubject(s.label)}
                      className="rounded-xl py-3.5 text-sm font-medium text-center transition-all active:scale-95"
                      style={{
                        background: subject === s.label ? gameConfig.color : "#fff",
                        color: subject === s.label ? "#fff" : "#555",
                        border: `2px solid ${subject === s.label ? gameConfig.color : "#eee"}`,
                        boxShadow: subject === s.label ? `0 4px 12px ${gameConfig.color}30` : "none",
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm mb-4 text-center" style={{ color: "#ef4444" }}>{error}</p>}
              <button onClick={handleStart} disabled={!subject}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-all active:scale-98"
                style={{ background: gameConfig.color, color: "#fff", opacity: !subject ? 0.4 : 1, boxShadow: subject ? `0 4px 16px ${gameConfig.color}40` : "none" }}>
                🎮 Start Game
              </button>
            </div>
          )}

          {/* LOADING */}
          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-4xl mb-4 animate-bounce">{gameConfig?.emoji || "🎮"}</div>
              <Loader2 className="h-6 w-6 animate-spin mb-3" style={{ color: gameConfig?.color || "#f97316" }} />
              <p className="text-sm font-medium" style={{ color: "#111" }}>Loading {subject} questions...</p>
            </div>
          )}

          {/* PLAYING */}
          {phase === "playing" && gameData && (
            <>
              {selectedGame === "speed-quiz" && gameData.questions && <SpeedQuizGame questions={gameData.questions} onFinish={handleFinish} />}
              {selectedGame === "word-scramble" && gameData.words && <WordScrambleGame words={gameData.words} onFinish={handleFinish} />}
              {selectedGame === "memory-match" && gameData.pairs && <MemoryMatchGame pairs={gameData.pairs} onFinish={handleFinish} />}
              {selectedGame === "true-false" && gameData.statements && <TrueFalseGame statements={gameData.statements} onFinish={handleFinish} />}
            </>
          )}

          {/* RESULTS */}
          {phase === "results" && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">{resultEmoji}</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "#111" }}>{resultMsg}</h1>

              {/* Score ring */}
              <div className="relative mx-auto my-6" style={{ width: 140, height: 140 }}>
                <svg width={140} height={140} viewBox="0 0 140 140">
                  <circle cx={70} cy={70} r={58} fill="none" stroke="#eee" strokeWidth="8" />
                  <circle cx={70} cy={70} r={58} fill="none" stroke={gameConfig?.color || "#f97316"} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - pct / 100)}
                    transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset 1s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "#111", lineHeight: 1 }}>
                    {selectedGame === "memory-match" ? `${finalScore}%` : finalScore}
                  </span>
                  <span className="text-[0.625rem]" style={{ color: "#999" }}>
                    {selectedGame === "memory-match" ? "efficiency" : `of ${finalTotal}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setPhase("loading"); handleStart(); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold active:scale-95"
                  style={{ background: gameConfig?.color || "#111", color: "#fff", boxShadow: `0 4px 12px ${gameConfig?.color || "#111"}30` }}>
                  🔄 Play Again
                </button>
                <button onClick={resetAll}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium"
                  style={{ background: "#fff", border: "1px solid #ddd", color: "#555" }}>
                  🎮 Other Games
                </button>
              </div>
            </div>
          )}

        </GameBackground>

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