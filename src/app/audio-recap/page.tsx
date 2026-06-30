"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Headphones, Upload, FileText, Loader2, Trash2,
  Play, Pause, RotateCcw, Square,
} from "lucide-react";
import { FeatureGate } from "@/components/ui/feature-gate";
import { FeatureHeader } from "@/components/ui/feature-header";
import { PageFooter } from "@/components/ui/page-footer";
import { useUsage } from "@/hooks/use-usage";

interface Recap {
  title: string; summary: string; script: string;
  keyPoints: string[]; estimatedMinutes: number;
}

type Phase = "upload" | "generating" | "listening";

function AudioRecapContent() {
  const router = useRouter();
  const usage = useUsage("audio-recap");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState("conversational");
  const [duration, setDuration] = useState("medium");
  const [phase, setPhase] = useState<Phase>("upload");
  const [recap, setRecap] = useState<Recap | null>(null);
  const [error, setError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const paragraphsRef = useRef<string[]>([]);

  const handleGenerate = async () => {
    if (!text.trim() && !file) { setError("Paste some text or upload a file first."); return; }
    setError(""); setPhase("generating");
    try {
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      if (file) formData.append("file", file);
      formData.append("style", style);
      formData.append("duration", duration);
      const res = await fetch("/api/audio-recap/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setRecap(data); setPhase("listening");
      await usage.record();
    } catch (err: any) { setError(err.message); setPhase("upload"); }
  };

  const startSpeaking = (fromParagraph = 0) => {
    if (!recap) return;
    window.speechSynthesis.cancel();
    const paragraphs = recap.script.split("\n\n").filter((p) => p.trim());
    paragraphsRef.current = paragraphs;

    const speakFrom = (index: number) => {
      if (index >= paragraphs.length) { setIsPlaying(false); setIsPaused(false); setProgress(100); return; }
      const utter = new SpeechSynthesisUtterance(paragraphs[index]);
      utter.rate = 0.95; utter.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const pref = voices.find((v) => v.lang.startsWith("en") && v.name.includes("Female"))
        || voices.find((v) => v.lang.startsWith("en-GB")) || voices.find((v) => v.lang.startsWith("en"));
      if (pref) utter.voice = pref;
      utter.onstart = () => { setCurrentParagraph(index); setProgress(Math.round((index / paragraphs.length) * 100)); };
      utter.onend = () => speakFrom(index + 1);
      utter.onerror = () => { setIsPlaying(false); setIsPaused(false); };
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    };

    setIsPlaying(true); setIsPaused(false); speakFrom(fromParagraph);
  };

  const togglePlayPause = () => {
    if (!isPlaying && !isPaused) startSpeaking(0);
    else if (isPlaying && !isPaused) { window.speechSynthesis.pause(); setIsPaused(true); }
    else if (isPaused) { window.speechSynthesis.resume(); setIsPaused(false); }
  };

  const stopSpeaking = () => { window.speechSynthesis.cancel(); setIsPlaying(false); setIsPaused(false); setProgress(0); setCurrentParagraph(0); };

  const resetAll = () => { stopSpeaking(); setPhase("upload"); setRecap(null); setText(""); setFile(null); setError(""); };

  useEffect(() => { return () => { window.speechSynthesis.cancel(); }; }, []);
  useEffect(() => { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices(); }, []);

  const paragraphs = recap ? recap.script.split("\n\n").filter((p) => p.trim()) : [];

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      {usage.limit > 0 && (
        <div className="flex items-center justify-end mb-4">
          <span className="text-[0.625rem] px-2 py-0.5 rounded-md" style={{ background: "#f5f5f5", color: "#999", fontFamily: "var(--font-mono)" }}>
            {usage.remaining === -1 ? "Unlimited" : `${usage.remaining} left today`}
          </span>
        </div>
      )}

      {phase === "upload" && (
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-semibold" style={{ color: "#111" }}>Listen to your notes</h1>
            <p className="text-sm mt-1" style={{ color: "#888" }}>
              Paste study material and AI turns it into a podcast-style audio summary you can listen to on the go.
            </p>
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
                <FileText className="h-4 w-4 shrink-0" style={{ color: "#ec4899" }} />
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

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#444" }}>Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)}
                className="w-full rounded-lg p-2.5 text-sm outline-none" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}>
                <option value="conversational">Conversational</option>
                <option value="formal">Formal / Academic</option>
                <option value="storytelling">Storytelling</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#444" }}>Length</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg p-2.5 text-sm outline-none" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}>
                <option value="short">Short (2-3 min)</option>
                <option value="medium">Medium (4-5 min)</option>
                <option value="long">Long (7-8 min)</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm mb-3 text-center" style={{ color: "#dc2626" }}>{error}</p>}

          <button onClick={handleGenerate} disabled={!text.trim() && !file}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-all"
            style={{ background: "#111", color: "#fff", opacity: (!text.trim() && !file) ? 0.35 : 1 }}>
            Generate Audio Recap
          </button>
        </div>
      )}

      {phase === "generating" && (
        <div className="flex flex-col items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin mb-3" style={{ color: "#ec4899" }} />
          <p className="text-sm" style={{ color: "#555" }}>Writing a podcast-style script from your content...</p>
        </div>
      )}

      {phase === "listening" && recap && (
        <div>
          {/* Player */}
          <div className="rounded-xl p-5 mb-5" style={{ background: "#111" }}>
            <div className="text-center mb-5">
              <Headphones className="mx-auto h-7 w-7 mb-2" style={{ color: "#ec4899" }} />
              <h1 className="text-base font-semibold" style={{ color: "#fff" }}>{recap.title}</h1>
              <p className="text-[0.6875rem] mt-0.5" style={{ color: "#666" }}>
                {recap.estimatedMinutes} min | {paragraphs.length} sections
              </p>
            </div>

            <div className="mb-4">
              <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.08)" }}>
                <div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: "#ec4899", transition: "width 0.3s" }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[0.5625rem]" style={{ fontFamily: "var(--font-mono)", color: "#555" }}>
                  Section {currentParagraph + 1}/{paragraphs.length}
                </span>
                <span className="text-[0.5625rem]" style={{ fontFamily: "var(--font-mono)", color: "#555" }}>{progress}%</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button onClick={stopSpeaking} className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.08)", color: "#888" }}>
                <Square className="h-3.5 w-3.5" />
              </button>
              <button onClick={togglePlayPause} className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "#ec4899", color: "#fff" }}>
                {isPlaying && !isPaused ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>
              <button onClick={() => startSpeaking(0)} className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.08)", color: "#888" }}>
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#666" }}>Summary</p>
            <p className="text-sm" style={{ color: "#444", lineHeight: 1.6 }}>{recap.summary}</p>
          </div>

          {/* Key Points */}
          {recap.keyPoints.length > 0 && (
            <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "#666" }}>Key Points</p>
              <div className="space-y-1.5">
                {recap.keyPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs font-bold shrink-0 mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "#ccc" }}>{i + 1}</span>
                    <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "#666" }}>Transcript</p>
            <div className="space-y-2.5">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-sm cursor-pointer rounded-md px-2 py-1 -mx-1 transition-colors"
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

          <div className="text-center">
            <button onClick={resetAll} className="text-xs" style={{ color: "#aaa" }}>Generate a new recap</button>
          </div>
        </div>
      )}

      <PageFooter />
    </div>
  );
}

export default function AudioRecapPage() {
  const router = useRouter();
  const header = (
    <FeatureHeader
      title="Audio Recap"
      icon={<Headphones className="h-4 w-4" style={{ color: "#ec4899" }} />}
    />
  );

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      {header}
      <FeatureGate feature="audio-recap" header={header}>
        <AudioRecapContent />
      </FeatureGate>
    </div>
  );
}