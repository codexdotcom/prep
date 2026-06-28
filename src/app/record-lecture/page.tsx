"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Mic, Loader2, Sparkles, Square, Play, Pause,
  RotateCcw, BookOpen, Lightbulb, AlertTriangle, Copy,
  Check, ChevronDown, ChevronUp, Clock, Download, Upload,
  FileText, Trash2, MicOff,
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";

interface Section { heading: string; content: string; keyTerms: string[]; isImportant: boolean }
interface Definition { term: string; definition: string }
interface Formula { name: string; formula: string; usage: string }

interface LectureNotes {
  title: string;
  subject: string;
  duration: string;
  sections: Section[];
  definitions: Definition[];
  formulas: Formula[];
  summary: string;
  examTips: string[];
  gaps: string[];
  wordCount: number;
}

type Phase = "record" | "review" | "generating" | "notes";
type InputMode = "live" | "upload" | "paste";

export default function RecordLecturePage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("record");
  const [inputMode, setInputMode] = useState<InputMode>("live");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [liveText, setLiveText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0);
  const [subject, setSubject] = useState("");
  const [noteStyle, setNoteStyle] = useState("comprehensive");
  const [error, setError] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [notes, setNotes] = useState<LectureNotes | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // ═══ LIVE RECORDING ═══

  const startRecording = async () => {
    setError("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser. Try Chrome or Edge, or upload an audio file instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      updateVolume();
    } catch {}

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-NG";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " ";
        else interim = t;
      }
      if (final) setTranscript((prev) => prev + final);
      setLiveText(interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      if (event.error === "not-allowed") {
        setError("Microphone permission denied. Allow access or upload an audio file instead.");
        stopRecording();
      }
    };

    recognition.onend = () => {
      if (isRecording && !isPaused && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setIsPaused(false);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const updateVolume = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    setVolume(avg / 255);
    animFrameRef.current = requestAnimationFrame(updateVolume);
  };

  const pauseRecording = () => {
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resumeRecording = () => {
    if (recognitionRef.current) try { recognitionRef.current.start(); } catch {}
    setIsPaused(false);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setIsRecording(false);
    setIsPaused(false);
    setLiveText("");
    setVolume(0);
    if (transcript.trim().length > 30) setPhase("review");
  };

  // ═══ GENERATE ═══

  const handleGenerate = async () => {
    setError("");
    setPhase("generating");

    try {
      let res: Response;

      if (audioFile && !transcript.trim()) {
        // Send audio file for transcription + note generation
        const formData = new FormData();
        formData.append("audio", audioFile);
        if (subject) formData.append("subject", subject);
        formData.append("noteStyle", noteStyle);
        res = await fetch("/api/record-lecture/generate", { method: "POST", body: formData });
      } else if (transcript.trim().length >= 30) {
        res = await fetch("/api/record-lecture/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: transcript.trim(), subject, noteStyle }),
        });
      } else {
        setError("Not enough content. Record, upload, or paste at least a few sentences.");
        setPhase("review");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotes(data);
      setCollapsedSections(new Set());
      setPhase("notes");
    } catch (err: any) {
      setError(err.message);
      setPhase("review");
    }
  };

const downloadNotes = async () => {
  if (!notes) return;
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 20;

  const addPage = () => { doc.addPage(); y = 20; };
  const checkPage = (needed: number) => { if (y + needed > 270) addPage(); };

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 17, 17);
  const titleLines = doc.splitTextToSize(notes.title, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 2;

  // Meta
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(119, 119, 119);
  doc.text(`${notes.subject}  |  ${notes.duration}  |  ${notes.wordCount} words`, margin, y);
  y += 8;

  // Summary
  doc.setFontSize(10);
  doc.setTextColor(85, 85, 85);
  const sumLines = doc.splitTextToSize(notes.summary, contentW);
  checkPage(sumLines.length * 5 + 6);
  doc.text(sumLines, margin, y);
  y += sumLines.length * 5 + 8;

  // Divider
  doc.setDrawColor(238, 238, 238);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // Sections
  for (const sec of notes.sections) {
    checkPage(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    if (sec.isImportant) {
      doc.setFillColor(254, 242, 242);
      doc.rect(margin - 2, y - 4, contentW + 4, 7, "F");
    }
    doc.text(sec.heading, margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);

    for (const para of sec.content.split("\n\n")) {
      const lines = doc.splitTextToSize(para, contentW);
      checkPage(lines.length * 5 + 4);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 3;
    }

    if (sec.keyTerms.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(153, 27, 27);
      doc.text(`Key terms: ${sec.keyTerms.join(", ")}`, margin, y);
      y += 6;
    }
    y += 4;
  }

  // Definitions
  if (notes.definitions.length > 0) {
    checkPage(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(85, 85, 85);
    doc.text("Key Definitions", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const d of notes.definitions) {
      checkPage(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 17, 17);
      doc.text(`${d.term}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(85, 85, 85);
      const defLines = doc.splitTextToSize(d.definition, contentW - 4);
      doc.text(defLines, margin, y + 5);
      y += 5 + defLines.length * 5 + 3;
    }
    y += 4;
  }

  // Formulas
  if (notes.formulas.length > 0) {
    checkPage(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(85, 85, 85);
    doc.text("Formulas", margin, y);
    y += 7;

    for (const f of notes.formulas) {
      checkPage(16);
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y - 3, contentW, 14, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(85, 85, 85);
      doc.text(f.name, margin + 2, y);
      doc.setFont("courier", "bold");
      doc.setFontSize(11);
      doc.setTextColor(17, 17, 17);
      doc.text(f.formula, margin + 2, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(119, 119, 119);
      doc.text(f.usage, margin + 2, y + 11);
      y += 18;
    }
    y += 4;
  }

  // Exam tips
  if (notes.examTips.length > 0) {
    checkPage(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(85, 85, 85);
    doc.text("JAMB Exam Tips", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    for (const tip of notes.examTips) {
      checkPage(8);
      const lines = doc.splitTextToSize(`- ${tip}`, contentW - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5 + 2;
    }
    y += 4;
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(187, 187, 187);
  doc.text(`Generated by JambOS - ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`, margin, 285);

  doc.save(`${notes.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_JambOS.pdf`);
};
  // ═══ UTILS ═══

  const toggleSection = (i: number) => {
    setCollapsedSections((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  };

  const copyNotes = () => {
    if (!notes) return;
    const text = [
      notes.title, "", notes.summary, "",
      ...notes.sections.flatMap((s) => [s.heading, s.content, ""]),
      notes.definitions.length ? "Key Definitions:" : "",
      ...notes.definitions.map((d) => `${d.term}: ${d.definition}`),
      notes.formulas.length ? "\nFormulas:" : "",
      ...notes.formulas.map((f) => `${f.name}: ${f.formula} - ${f.usage}`),
      notes.examTips.length ? "\nExam Tips:" : "",
      ...notes.examTips.map((t) => `- ${t}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    stopRecording();
    setPhase("record"); setTranscript(""); setLiveText(""); setElapsed(0);
    setNotes(null); setError(""); setCopied(false); setAudioFile(null);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const hasContent = transcript.trim().length > 30 || (audioFile !== null);

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => { stopRecording(); router.push("/tutor"); }} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" style={{ color: "#ef4444" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Record Lecture</span>
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">

        {/* ═══ RECORD ═══ */}
        {phase === "record" && (
          <div>
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#f5f5f5" }}>
                <Mic className="h-7 w-7" style={{ color: "#ef4444" }} />
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>Capture your lecture</h1>
              <p className="mt-2 text-sm mx-auto max-w-sm" style={{ color: "#777", lineHeight: 1.6 }}>
                Record live, upload an audio file, or paste a transcript. AI generates organized study notes.
              </p>
            </div>

            {/* Input mode tabs */}
            <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: "#f0f0f0" }}>
              {([
                { key: "live" as InputMode, label: "Live Recording", icon: Mic },
                { key: "upload" as InputMode, label: "Upload Audio", icon: Upload },
                { key: "paste" as InputMode, label: "Paste Text", icon: FileText },
              ]).map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => { if (!isRecording) setInputMode(key); }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all"
                  style={{
                    background: inputMode === key ? "#fff" : "transparent",
                    color: inputMode === key ? "#111" : "#999",
                    boxShadow: inputMode === key ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  }}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </button>
              ))}
            </div>

            {/* ── LIVE RECORDING ── */}
            {inputMode === "live" && (
              <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: "#fff", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
                {/* Volume visualizer */}
                {isRecording && (
                  <div className="flex items-center justify-center gap-0.5 mb-4 h-16">
                    {Array.from({ length: 32 }).map((_, i) => {
                      const center = 16;
                      const dist = Math.abs(i - center) / center;
                      const height = Math.max(3, (1 - dist) * volume * 56 + Math.random() * 6);
                      return (
                        <div key={i} className="rounded-full" style={{
                          width: 2.5, height, background: isPaused ? "#ddd" : "#ef4444",
                          opacity: isPaused ? 0.3 : 0.3 + volume * 0.7,
                          transition: "height 0.1s ease",
                        }} />
                      );
                    })}
                  </div>
                )}

                {isRecording && (
                  <div className="mb-5">
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "2rem", color: "#111", letterSpacing: "0.1em" }}>
                      {formatTime(elapsed)}
                    </p>
                    <p className="text-[0.625rem] mt-1" style={{ color: isPaused ? "#f59e0b" : "#ef4444" }}>
                      {isPaused ? "Paused" : "Recording"}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <button onClick={startRecording}
                      className="flex h-20 w-20 items-center justify-center rounded-full transition-all active:scale-95"
                      style={{ background: "#ef4444", color: "#fff", boxShadow: "0 4px 20px rgba(239,68,68,0.3)" }}>
                      <Mic className="h-8 w-8" />
                    </button>
                  ) : (
                    <>
                      <button onClick={isPaused ? resumeRecording : pauseRecording}
                        className="flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95"
                        style={{ background: isPaused ? "#111" : "#f59e0b", color: "#fff" }}>
                        {isPaused ? <Play className="h-5 w-5 ml-0.5" /> : <Pause className="h-5 w-5" />}
                      </button>
                      <button onClick={stopRecording}
                        className="flex h-20 w-20 items-center justify-center rounded-full transition-all active:scale-95"
                        style={{ background: "#ef4444", color: "#fff", boxShadow: "0 4px 20px rgba(239,68,68,0.3)" }}>
                        <Square className="h-8 w-8" fill="#fff" />
                      </button>
                    </>
                  )}
                </div>

                {!isRecording && !transcript && (
                  <p className="text-xs mt-4" style={{ color: "#999" }}>Tap to start recording</p>
                )}
              </div>
            )}

            {/* ── UPLOAD AUDIO ── */}
            {inputMode === "upload" && (
              <div className="mb-4">
                <input ref={audioInputRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) setAudioFile(e.target.files[0]); }} />

                {audioFile ? (
                  <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ background: "#fef2f2" }}>
                      <Mic className="h-5 w-5" style={{ color: "#ef4444" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#111" }}>{audioFile.name}</p>
                      <p className="text-[0.625rem]" style={{ color: "#999" }}>{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                    <button onClick={() => setAudioFile(null)} className="p-1.5 rounded-lg" style={{ color: "#999" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => audioInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl py-10 transition-all"
                    style={{ background: "#fff", border: "2px dashed #ddd", color: "#999" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#bbb"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ddd"; }}>
                    <Upload className="h-6 w-6" />
                    <span className="text-sm font-medium">Upload audio file</span>
                    <span className="text-[0.625rem]" style={{ color: "#bbb" }}>MP3, M4A, WAV, OGG, WebM</span>
                  </button>
                )}
              </div>
            )}

            {/* ── PASTE TEXT ── */}
            {inputMode === "paste" && (
              <div className="mb-4">
                <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste a lecture transcript here..."
                  rows={10} className="w-full rounded-xl p-4 text-sm outline-none resize-none"
                  style={{ background: "#fff", border: "1px solid #ddd", color: "#111", lineHeight: 1.7 }}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#999"; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#ddd"; }} />
                <p className="text-[0.625rem] mt-1 text-right" style={{ color: "#bbb" }}>{wordCount} words</p>
              </div>
            )}

            {/* Live transcript display */}
            {inputMode === "live" && (transcript || liveText) && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: "#555" }}>Transcript</p>
                  <span className="text-[0.625rem]" style={{ fontFamily: "var(--font-mono)", color: "#999" }}>{wordCount} words</span>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  <p className="text-sm" style={{ color: "#333", lineHeight: 1.7 }}>
                    {transcript}<span style={{ color: "#bbb" }}>{liveText}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Continue button */}
            {hasContent && !isRecording && (
              <button onClick={() => setPhase("review")}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold"
                style={{ background: "#111", color: "#fff" }}>
                <Sparkles className="h-4 w-4" /> Continue
              </button>
            )}

            {error && <p className="text-sm mt-4 text-center" style={{ color: "#ef4444" }}>{error}</p>}
          </div>
        )}

        {/* ═══ REVIEW ═══ */}
        {phase === "review" && (
          <div>
            <div className="text-center mb-6">
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>Review and generate</h1>
              <p className="text-sm mt-1" style={{ color: "#777" }}>
                {audioFile ? `Audio: ${audioFile.name}` : `${wordCount} words captured`}
                {elapsed > 0 ? ` in ${formatTime(elapsed)}` : ""}
              </p>
            </div>

            {/* Source info */}
            {audioFile && (
              <div className="flex items-center gap-3 rounded-xl p-3 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <Mic className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: "#111" }}>{audioFile.name}</p>
                  <p className="text-[0.625rem]" style={{ color: "#999" }}>{(audioFile.size / (1024 * 1024)).toFixed(1)} MB - will be transcribed by AI</p>
                </div>
              </div>
            )}

            {transcript.trim() && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>Transcript preview</p>
                <div className="max-h-32 overflow-y-auto">
                  <p className="text-sm" style={{ color: "#333", lineHeight: 1.7 }}>{transcript.slice(0, 500)}{transcript.length > 500 ? "..." : ""}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm outline-none"
                  style={{ background: "#fff", border: "1px solid #ddd", color: "#111", appearance: "none" }}>
                  <option value="">Auto-detect</option>
                  {JAMB_SUBJECTS.map((s) => <option key={s.value} value={s.label}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Note style</label>
                <select value={noteStyle} onChange={(e) => setNoteStyle(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm outline-none"
                  style={{ background: "#fff", border: "1px solid #ddd", color: "#111", appearance: "none" }}>
                  <option value="comprehensive">Comprehensive</option>
                  <option value="cornell">Cornell Notes</option>
                  <option value="outline">Outline</option>
                  <option value="mindmap">Mind Map</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm mb-4 text-center" style={{ color: "#ef4444" }}>{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setPhase("record")}
                className="flex-1 rounded-xl py-3 text-sm font-medium"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#555" }}>
                Back
              </button>
              <button onClick={handleGenerate}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                style={{ background: "#111", color: "#fff" }}>
                <Sparkles className="h-4 w-4" /> Generate Notes
              </button>
            </div>
          </div>
        )}

        {/* ═══ GENERATING ═══ */}
        {phase === "generating" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: "#ef4444" }} />
            <p className="text-sm font-medium" style={{ color: "#111" }}>
              {audioFile && !transcript.trim() ? "Transcribing audio and generating notes..." : "Generating your lecture notes..."}
            </p>
            <p className="text-xs mt-1" style={{ color: "#999" }}>This may take a moment</p>
          </div>
        )}

        {/* ═══ NOTES ═══ */}
        {phase === "notes" && notes && (
          <div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[0.625rem] font-semibold rounded-md px-2 py-0.5" style={{ background: "#f5f5f5", color: "#555" }}>{notes.subject}</span>
                  <span className="flex items-center gap-1 text-[0.625rem]" style={{ color: "#999" }}>
                    <Clock className="h-3 w-3" /> {notes.duration}
                  </span>
                </div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111", lineHeight: 1.3 }}>{notes.title}</h1>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={downloadNotes} className="p-2 rounded-lg transition-colors" style={{ color: "#555" }} title="Download"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <Download className="h-4 w-4" />
                </button>
                <button onClick={copyNotes} className="p-2 rounded-lg transition-colors" style={{ color: copied ? "#22c55e" : "#555" }} title="Copy"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#555" }}>Summary</p>
              <p className="text-sm" style={{ color: "#333", lineHeight: 1.7 }}>{notes.summary}</p>
              <p className="text-[0.625rem] mt-2" style={{ color: "#bbb" }}>{notes.wordCount} words</p>
            </div>

            {/* Sections */}
            <div className="space-y-2 mb-4">
              {notes.sections.map((sec, i) => {
                const collapsed = collapsedSections.has(i);
                return (
                  <div key={i} className="rounded-xl overflow-hidden" style={{
                    background: "#fff", border: `1px solid ${sec.isImportant ? "#fecaca" : "#eee"}`,
                    borderLeft: sec.isImportant ? "3px solid #ef4444" : undefined,
                  }}>
                    <button onClick={() => toggleSection(i)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                      <span className="text-sm font-semibold" style={{ color: "#111" }}>{sec.heading}</span>
                      {collapsed ? <ChevronDown className="h-4 w-4" style={{ color: "#999" }} /> : <ChevronUp className="h-4 w-4" style={{ color: "#999" }} />}
                    </button>
                    {!collapsed && (
                      <div className="px-4 pb-4">
                        {sec.content.split("\n\n").map((para, pi) => (
                          <p key={pi} className="text-sm mb-2.5 last:mb-0" style={{ color: "#333", lineHeight: 1.7 }}>{para}</p>
                        ))}
                        {sec.keyTerms.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {sec.keyTerms.map((term, ti) => (
                              <span key={ti} className="text-[0.625rem] font-medium rounded-md px-2 py-0.5" style={{ background: "#fef2f2", color: "#991b1b" }}>{term}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Definitions */}
            {notes.definitions.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "#555" }}>Key Definitions</p>
                <div className="space-y-3">
                  {notes.definitions.map((d, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#111" }}>{d.term}</p>
                        <p className="text-sm mt-0.5" style={{ color: "#555", lineHeight: 1.5 }}>{d.definition}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulas */}
            {notes.formulas.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "#555" }}>Formulas</p>
                <div className="space-y-3">
                  {notes.formulas.map((f, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ background: "#f8f8f8" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#555" }}>{f.name}</p>
                      <p className="text-base font-semibold mb-1" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{f.formula}</p>
                      <p className="text-xs" style={{ color: "#777" }}>{f.usage}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exam Tips */}
            {notes.examTips.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>JAMB Exam Tips</p>
                <div className="space-y-1.5">
                  {notes.examTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
                      <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps */}
            {notes.gaps.length > 0 && (
              <div className="rounded-xl p-4 mb-6" style={{ background: "#fff", border: "1px solid #fecaca" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#991b1b" }}>Topics to Review</p>
                <div className="space-y-1.5">
                  {notes.gaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                      <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{gap}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={resetAll}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#555" }}>
                <Mic className="h-4 w-4" /> New Recording
              </button>
              <button onClick={downloadNotes}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                style={{ background: "#111", color: "#fff" }}>
                <Download className="h-4 w-4" /> Download Notes
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