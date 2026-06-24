"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Headphones, Upload, FileText, Loader2, Trash2,
  Play, Pause, RotateCcw, Sparkles, Volume2, VolumeX, Square,
} from "lucide-react";

interface Recap {
  title: string;
  summary: string;
  script: string;
  keyPoints: string[];
  estimatedMinutes: number;
}

type Phase = "upload" | "generating" | "listening";

export default function AudioRecapPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState("conversational");
  const [duration, setDuration] = useState("medium");
  const [phase, setPhase] = useState<Phase>("upload");
  const [recap, setRecap] = useState<Recap | null>(null);
  const [error, setError] = useState("");

  // TTS state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const paragraphsRef = useRef<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleGenerate = async () => {
    if (!text.trim() && !file) { setError("Paste some text or upload a file first."); return; }
    setError("");
    setPhase("generating");
    try {
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      if (file) formData.append("file", file);
      formData.append("style", style);
      formData.append("duration", duration);
      const res = await fetch("/api/audio-recap/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setRecap(data);
      setPhase("listening");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setPhase("upload");
    }
  };

  const startSpeaking = (fromParagraph = 0) => {
    if (!recap) return;
    window.speechSynthesis.cancel();

    const paragraphs = recap.script.split("\n\n").filter((p) => p.trim());
    paragraphsRef.current = paragraphs;

    const speakFrom = (index: number) => {
      if (index >= paragraphs.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        return;
      }

      const utter = new SpeechSynthesisUtterance(paragraphs[index]);
      utter.rate = 0.95;
      utter.pitch = 1.0;

      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => v.lang.startsWith("en") && v.name.includes("Female"))
        || voices.find((v) => v.lang.startsWith("en-GB"))
        || voices.find((v) => v.lang.startsWith("en"));
      if (preferred) utter.voice = preferred;

      utter.onstart = () => {
        setCurrentParagraph(index);
        setProgress(Math.round((index / paragraphs.length) * 100));
      };
      utter.onend = () => speakFrom(index + 1);
      utter.onerror = () => { setIsPlaying(false); setIsPaused(false); };

      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    };

    setIsPlaying(true);
    setIsPaused(false);
    speakFrom(fromParagraph);
  };

  const togglePlayPause = () => {
    if (!isPlaying && !isPaused) {
      startSpeaking(0);
    } else if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentParagraph(0);
  };

  const resetAll = () => {
    stopSpeaking();
    setPhase("upload");
    setRecap(null);
    setText("");
    setFile(null);
    setError("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Load voices
  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }, []);

  const paragraphs = recap ? recap.script.split("\n\n").filter((p) => p.trim()) : [];

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => { stopSpeaking(); router.push("/tutor"); }} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4" style={{ color: "#ec4899" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Audio Recap</span>
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
                <Headphones className="h-7 w-7" style={{ color: "#ec4899" }} />
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>Listen to your notes</h1>
              <p className="mt-2 text-sm mx-auto max-w-sm" style={{ color: "#777", lineHeight: 1.6 }}>
                Paste your study material and AI turns it into a podcast-style audio summary you can listen to.
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
            </div>

            <div className="mb-6">
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
              {file ? (
                <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#fff", border: "1px solid #eee" }}>
                  <FileText className="h-5 w-5 shrink-0" style={{ color: "#ec4899" }} />
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

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm outline-none" style={{ background: "#fff", border: "1px solid #ddd", color: "#111", appearance: "none" }}>
                  <option value="conversational">Conversational</option>
                  <option value="formal">Formal / Academic</option>
                  <option value="storytelling">Storytelling</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Length</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm outline-none" style={{ background: "#fff", border: "1px solid #ddd", color: "#111", appearance: "none" }}>
                  <option value="short">Short (2-3 min)</option>
                  <option value="medium">Medium (4-5 min)</option>
                  <option value="long">Long (7-8 min)</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm mb-4 text-center" style={{ color: "#ef4444" }}>{error}</p>}

            <button onClick={handleGenerate} disabled={!text.trim() && !file}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all"
              style={{ background: "#111", color: "#fff", opacity: (!text.trim() && !file) ? 0.4 : 1 }}>
              <Sparkles className="h-4 w-4" /> Generate Audio Recap
            </button>
          </div>
        )}

        {/* ═══ GENERATING ═══ */}
        {phase === "generating" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: "#ec4899" }} />
            <p className="text-sm font-medium" style={{ color: "#111" }}>Creating your audio recap...</p>
            <p className="text-xs mt-1" style={{ color: "#999" }}>AI is writing a podcast-style script from your content</p>
          </div>
        )}

        {/* ═══ LISTENING ═══ */}
        {phase === "listening" && recap && (
          <div>
            {/* Player card */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#111" }}>
              <div className="text-center mb-6">
                <Headphones className="mx-auto h-8 w-8 mb-3" style={{ color: "#ec4899" }} />
                <h1 className="text-lg font-semibold" style={{ color: "#fff" }}>{recap.title}</h1>
                <p className="text-xs mt-1" style={{ color: "#888" }}>
                  {recap.estimatedMinutes} min - {paragraphs.length} sections
                </p>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div style={{ height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.1)" }}>
                  <div style={{ width: `${progress}%`, height: "100%", borderRadius: 9999, background: "#ec4899", transition: "width 0.3s" }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[0.5625rem]" style={{ fontFamily: "var(--font-mono)", color: "#666" }}>
                    Section {currentParagraph + 1}/{paragraphs.length}
                  </span>
                  <span className="text-[0.5625rem]" style={{ fontFamily: "var(--font-mono)", color: "#666" }}>
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button onClick={stopSpeaking} className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#999" }}>
                  <Square className="h-4 w-4" />
                </button>
                <button onClick={togglePlayPause}
                  className="flex h-14 w-14 items-center justify-center rounded-full transition-all"
                  style={{ background: "#ec4899", color: "#fff" }}>
                  {isPlaying && !isPaused ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                </button>
                <button onClick={() => startSpeaking(0)} className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#999" }}>
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#555" }}>Summary</p>
              <p className="text-sm" style={{ color: "#555", lineHeight: 1.6 }}>{recap.summary}</p>
            </div>

            {/* Key Points */}
            {recap.keyPoints.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>Key Points</p>
                <div className="space-y-1.5">
                  {recap.keyPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-bold shrink-0 mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "#bbb" }}>{i + 1}</span>
                      <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transcript */}
            <div className="rounded-xl p-4 mb-6" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "#555" }}>Full Transcript</p>
              <div className="space-y-3">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-sm cursor-pointer rounded-lg px-2 py-1 -mx-2 transition-colors"
                    style={{
                      color: i === currentParagraph && isPlaying ? "#111" : "#555",
                      background: i === currentParagraph && isPlaying ? "#f5f5f5" : "transparent",
                      fontWeight: i === currentParagraph && isPlaying ? 500 : 400,
                      lineHeight: 1.6,
                    }}
                    onClick={() => startSpeaking(i)}>
                    {p}
                  </p>
                ))}
              </div>
            </div>

            <button onClick={resetAll} className="w-full text-center text-xs font-medium" style={{ color: "#999" }}>
              Generate a new recap
            </button>
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