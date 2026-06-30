"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, Loader2, Sparkles, Square, Play, Pause,
  RotateCcw, BookOpen, Lightbulb, AlertTriangle, Copy,
  Check, ChevronDown, ChevronUp, Clock, Download, Upload,
  FileText, Trash2,
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";
import { FeatureGate } from "@/components/ui/feature-gate";
import { FeatureHeader } from "@/components/ui/feature-header";
import { PageFooter } from "@/components/ui/page-footer";
import { useUsage } from "@/hooks/use-usage";

interface Section { heading: string; content: string; keyTerms: string[]; isImportant: boolean }
interface Definition { term: string; definition: string }
interface Formula { name: string; formula: string; usage: string }
interface LectureNotes {
  title: string; subject: string; duration: string; sections: Section[];
  definitions: Definition[]; formulas: Formula[]; summary: string;
  examTips: string[]; gaps: string[]; wordCount: number;
}

type Phase = "record" | "review" | "generating" | "notes";
type InputMode = "live" | "upload" | "paste";

function RecordLectureContent() {
  const router = useRouter();
  const usage = useUsage("record-lecture");

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

  const startRecording = async () => {
    setError("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Speech recognition not supported. Try Chrome or Edge, or upload audio instead."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256; source.connect(analyser);
      analyserRef.current = analyser; updateVolume();
    } catch {}
    const recognition = new SpeechRecognition();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-NG";
    recognition.onresult = (event: any) => {
      let interim = ""; let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " "; else interim = t;
      }
      if (final) setTranscript((prev) => prev + final); setLiveText(interim);
    };
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      if (event.error === "not-allowed") { setError("Microphone permission denied."); stopRecording(); }
    };
    recognition.onend = () => { if (isRecording && !isPaused && recognitionRef.current) try { recognitionRef.current.start(); } catch {} };
    recognitionRef.current = recognition; recognition.start();
    setIsRecording(true); setIsPaused(false);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const updateVolume = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    setVolume(data.reduce((a, b) => a + b, 0) / data.length / 255);
    animFrameRef.current = requestAnimationFrame(updateVolume);
  };

  const pauseRecording = () => { if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {} setIsPaused(true); if (timerRef.current) clearInterval(timerRef.current); };
  const resumeRecording = () => { if (recognitionRef.current) try { recognitionRef.current.start(); } catch {} setIsPaused(false); timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000); };

  const stopRecording = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setIsRecording(false); setIsPaused(false); setLiveText(""); setVolume(0);
    if (transcript.trim().length > 30) setPhase("review");
  };

  const handleGenerate = async () => {
    setError(""); setPhase("generating");
    try {
      let res: Response;
      if (audioFile && !transcript.trim()) {
        const formData = new FormData();
        formData.append("audio", audioFile);
        if (subject) formData.append("subject", subject);
        formData.append("noteStyle", noteStyle);
        res = await fetch("/api/record-lecture/generate", { method: "POST", body: formData });
      } else if (transcript.trim().length >= 30) {
        res = await fetch("/api/record-lecture/generate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: transcript.trim(), subject, noteStyle }),
        });
      } else { setError("Not enough content."); setPhase("review"); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotes(data); setCollapsedSections(new Set()); setPhase("notes");
      await usage.record();
    } catch (err: any) { setError(err.message); setPhase("review"); }
  };

  const downloadNotes = async () => {
    if (!notes) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16; const contentW = pageW - margin * 2; let y = 20;
    const addPage = () => { doc.addPage(); y = 20; };
    const checkPage = (needed: number) => { if (y + needed > 270) addPage(); };

    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(17, 17, 17);
    const titleLines = doc.splitTextToSize(notes.title, contentW);
    doc.text(titleLines, margin, y); y += titleLines.length * 8 + 2;
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(119, 119, 119);
    doc.text(`${notes.subject}  |  ${notes.duration}  |  ${notes.wordCount} words`, margin, y); y += 8;
    doc.setFontSize(10); doc.setTextColor(85, 85, 85);
    const sumLines = doc.splitTextToSize(notes.summary, contentW); checkPage(sumLines.length * 5 + 6);
    doc.text(sumLines, margin, y); y += sumLines.length * 5 + 8;
    doc.setDrawColor(238, 238, 238); doc.line(margin, y, pageW - margin, y); y += 6;

    for (const sec of notes.sections) {
      checkPage(20); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(17, 17, 17);
      if (sec.isImportant) { doc.setFillColor(254, 242, 242); doc.rect(margin - 2, y - 4, contentW + 4, 7, "F"); }
      doc.text(sec.heading, margin, y); y += 7;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(51, 51, 51);
      for (const para of sec.content.split("\n\n")) {
        const lines = doc.splitTextToSize(para, contentW); checkPage(lines.length * 5 + 4);
        doc.text(lines, margin, y); y += lines.length * 5 + 3;
      }
      if (sec.keyTerms.length > 0) { doc.setFontSize(8); doc.setTextColor(153, 27, 27); doc.text(`Key terms: ${sec.keyTerms.join(", ")}`, margin, y); y += 6; }
      y += 4;
    }

    if (notes.definitions.length > 0) {
      checkPage(12); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(85, 85, 85);
      doc.text("Key Definitions", margin, y); y += 7;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      for (const d of notes.definitions) {
        checkPage(10); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17); doc.text(`${d.term}:`, margin, y);
        doc.setFont("helvetica", "normal"); doc.setTextColor(85, 85, 85);
        const defLines = doc.splitTextToSize(d.definition, contentW - 4); doc.text(defLines, margin, y + 5);
        y += 5 + defLines.length * 5 + 3;
      }
      y += 4;
    }

    if (notes.formulas.length > 0) {
      checkPage(12); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(85, 85, 85);
      doc.text("Formulas", margin, y); y += 7;
      for (const f of notes.formulas) {
        checkPage(16); doc.setFillColor(248, 248, 248); doc.rect(margin, y - 3, contentW, 14, "F");
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(85, 85, 85); doc.text(f.name, margin + 2, y);
        doc.setFont("courier", "bold"); doc.setFontSize(11); doc.setTextColor(17, 17, 17); doc.text(f.formula, margin + 2, y + 6);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(119, 119, 119); doc.text(f.usage, margin + 2, y + 11);
        y += 18;
      }
      y += 4;
    }

    if (notes.examTips.length > 0) {
      checkPage(12); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(85, 85, 85);
      doc.text("JAMB Exam Tips", margin, y); y += 7;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(51, 51, 51);
      for (const tip of notes.examTips) { checkPage(8); const lines = doc.splitTextToSize(`- ${tip}`, contentW - 4); doc.text(lines, margin + 2, y); y += lines.length * 5 + 2; }
    }

    doc.setFontSize(7); doc.setTextColor(187, 187, 187);
    doc.text(`Generated by JambOS - ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`, margin, 285);
    doc.save(`${notes.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_JambOS.pdf`);
  };

  const toggleSection = (i: number) => { setCollapsedSections((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); };

  const copyNotes = () => {
    if (!notes) return;
    const text = [notes.title, "", notes.summary, "", ...notes.sections.flatMap((s) => [s.heading, s.content, ""]),
      notes.definitions.length ? "Key Definitions:" : "", ...notes.definitions.map((d) => `${d.term}: ${d.definition}`),
      notes.formulas.length ? "\nFormulas:" : "", ...notes.formulas.map((f) => `${f.name}: ${f.formula} - ${f.usage}`),
      notes.examTips.length ? "\nExam Tips:" : "", ...notes.examTips.map((t) => `- ${t}`)].join("\n");
    navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => { stopRecording(); setPhase("record"); setTranscript(""); setLiveText(""); setElapsed(0); setNotes(null); setError(""); setCopied(false); setAudioFile(null); };

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
  const hasContent = transcript.trim().length > 30 || audioFile !== null;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      {usage.limit > 0 && (
        <div className="flex items-center justify-end mb-4">
          <span className="text-[0.625rem] px-2 py-0.5 rounded-md" style={{ background: "#f5f5f5", color: "#999", fontFamily: "var(--font-mono)" }}>
            {usage.remaining === -1 ? "Unlimited" : `${usage.remaining} left today`}
          </span>
        </div>
      )}

      {phase === "record" && (
        <div>
          <div className="mb-6">
            <h1 className="text-xl font-semibold" style={{ color: "#111" }}>Capture your lecture</h1>
            <p className="text-sm mt-1" style={{ color: "#888" }}>Record live, upload audio, or paste a transcript. AI generates organized study notes.</p>
          </div>

          {/* Input mode tabs */}
          <div className="flex gap-0.5 mb-5 rounded-md p-0.5" style={{ background: "#ececec" }}>
            {([
              { key: "live" as InputMode, label: "Live", icon: Mic },
              { key: "upload" as InputMode, label: "Upload", icon: Upload },
              { key: "paste" as InputMode, label: "Paste", icon: FileText },
            ]).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { if (!isRecording) setInputMode(key); }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded py-2 text-xs font-medium transition-all"
                style={{ background: inputMode === key ? "#fff" : "transparent", color: inputMode === key ? "#111" : "#999", boxShadow: inputMode === key ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>

          {inputMode === "live" && (
            <div className="rounded-xl p-5 mb-4 text-center" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              {isRecording && (
                <div className="flex items-center justify-center gap-0.5 mb-4 h-14">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const center = 16; const dist = Math.abs(i - center) / center;
                    const height = Math.max(3, (1 - dist) * volume * 50 + Math.random() * 5);
                    return <div key={i} className="rounded-full" style={{ width: 2, height, background: isPaused ? "#ddd" : "#ef4444", opacity: isPaused ? 0.3 : 0.3 + volume * 0.7, transition: "height 0.1s" }} />;
                  })}
                </div>
              )}
              {isRecording && (
                <div className="mb-4">
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", color: "#111", letterSpacing: "0.1em" }}>{formatTime(elapsed)}</p>
                  <p className="text-[0.625rem] mt-0.5" style={{ color: isPaused ? "#f59e0b" : "#ef4444" }}>{isPaused ? "Paused" : "Recording"}</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-3">
                {!isRecording ? (
                  <button onClick={startRecording} className="flex h-16 w-16 items-center justify-center rounded-full active:scale-95"
                    style={{ background: "#ef4444", color: "#fff", boxShadow: "0 4px 16px rgba(239,68,68,0.25)" }}>
                    <Mic className="h-7 w-7" />
                  </button>
                ) : (
                  <>
                    <button onClick={isPaused ? resumeRecording : pauseRecording} className="flex h-10 w-10 items-center justify-center rounded-full active:scale-95"
                      style={{ background: isPaused ? "#111" : "#f59e0b", color: "#fff" }}>
                      {isPaused ? <Play className="h-4 w-4 ml-0.5" /> : <Pause className="h-4 w-4" />}
                    </button>
                    <button onClick={stopRecording} className="flex h-16 w-16 items-center justify-center rounded-full active:scale-95"
                      style={{ background: "#ef4444", color: "#fff", boxShadow: "0 4px 16px rgba(239,68,68,0.25)" }}>
                      <Square className="h-7 w-7" fill="#fff" />
                    </button>
                  </>
                )}
              </div>
              {!isRecording && !transcript && <p className="text-xs mt-3" style={{ color: "#bbb" }}>Tap to start</p>}
            </div>
          )}

          {inputMode === "upload" && (
            <div className="mb-4">
              <input ref={audioInputRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setAudioFile(e.target.files[0]); }} />
              {audioFile ? (
                <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
                  <Mic className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#111" }}>{audioFile.name}</p>
                    <p className="text-[0.625rem]" style={{ color: "#aaa" }}>{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <button onClick={() => setAudioFile(null)} style={{ color: "#bbb" }}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <button onClick={() => audioInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg py-8"
                  style={{ background: "#fcfcfc", border: "1px dashed #d0d0d0", color: "#999" }}>
                  <Upload className="h-5 w-5" />
                  <span className="text-sm">Upload audio file</span>
                  <span className="text-[0.5625rem]" style={{ color: "#ccc" }}>MP3, M4A, WAV, OGG, WebM</span>
                </button>
              )}
            </div>
          )}

          {inputMode === "paste" && (
            <div className="mb-4">
              <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste a lecture transcript here..."
                rows={8} className="w-full rounded-lg p-4 text-sm outline-none resize-none"
                style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111", lineHeight: 1.7 }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#aaa"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#e0e0e0"; }} />
              <p className="text-[0.625rem] mt-1 text-right" style={{ color: "#ccc" }}>{wordCount} words</p>
            </div>
          )}

          {inputMode === "live" && (transcript || liveText) && (
            <div className="rounded-lg p-3.5 mb-4" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium" style={{ color: "#666" }}>Transcript</p>
                <span className="text-[0.625rem]" style={{ fontFamily: "var(--font-mono)", color: "#aaa" }}>{wordCount} words</span>
              </div>
              <div className="max-h-36 overflow-y-auto">
                <p className="text-sm" style={{ color: "#333", lineHeight: 1.7 }}>{transcript}<span style={{ color: "#ccc" }}>{liveText}</span></p>
              </div>
            </div>
          )}

          {hasContent && !isRecording && (
            <button onClick={() => setPhase("review")} className="w-full rounded-xl py-3 text-sm font-semibold" style={{ background: "#111", color: "#fff" }}>Continue</button>
          )}
          {error && <p className="text-sm mt-3 text-center" style={{ color: "#dc2626" }}>{error}</p>}
        </div>
      )}

      {phase === "review" && (
        <div>
          <div className="mb-5">
            <h1 className="text-lg font-semibold" style={{ color: "#111" }}>Review and generate</h1>
            <p className="text-sm mt-0.5" style={{ color: "#888" }}>
              {audioFile ? `Audio: ${audioFile.name}` : `${wordCount} words captured`}{elapsed > 0 ? ` in ${formatTime(elapsed)}` : ""}
            </p>
          </div>

          {audioFile && (
            <div className="flex items-center gap-3 rounded-lg p-3 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <Mic className="h-3.5 w-3.5 shrink-0" style={{ color: "#ef4444" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: "#111" }}>{audioFile.name}</p>
                <p className="text-[0.625rem]" style={{ color: "#aaa" }}>Will be transcribed by AI</p>
              </div>
            </div>
          )}

          {transcript.trim() && (
            <div className="rounded-lg p-3.5 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <p className="text-xs font-medium mb-1.5" style={{ color: "#666" }}>Transcript preview</p>
              <div className="max-h-28 overflow-y-auto">
                <p className="text-sm" style={{ color: "#333", lineHeight: 1.7 }}>{transcript.slice(0, 500)}{transcript.length > 500 ? "..." : ""}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#444" }}>Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg p-2.5 text-sm outline-none" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}>
                <option value="">Auto-detect</option>
                {JAMB_SUBJECTS.map((s) => <option key={s.value} value={s.label}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#444" }}>Note style</label>
              <select value={noteStyle} onChange={(e) => setNoteStyle(e.target.value)}
                className="w-full rounded-lg p-2.5 text-sm outline-none" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}>
                <option value="comprehensive">Comprehensive</option>
                <option value="cornell">Cornell Notes</option>
                <option value="outline">Outline</option>
                <option value="mindmap">Mind Map</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm mb-3 text-center" style={{ color: "#dc2626" }}>{error}</p>}

          <div className="flex gap-2.5">
            <button onClick={() => setPhase("record")} className="flex-1 rounded-lg py-2.5 text-sm" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555" }}>Back</button>
            <button onClick={handleGenerate} className="flex-1 rounded-lg py-2.5 text-sm font-semibold" style={{ background: "#111", color: "#fff" }}>Generate Notes</button>
          </div>
        </div>
      )}

      {phase === "generating" && (
        <div className="flex flex-col items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin mb-3" style={{ color: "#ef4444" }} />
          <p className="text-sm" style={{ color: "#555" }}>
            {audioFile && !transcript.trim() ? "Transcribing audio and generating notes..." : "Generating lecture notes..."}
          </p>
        </div>
      )}

      {phase === "notes" && notes && (
        <div>
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[0.625rem] font-medium rounded px-1.5 py-0.5" style={{ background: "#f3f3f3", color: "#666" }}>{notes.subject}</span>
                <span className="flex items-center gap-0.5 text-[0.625rem]" style={{ color: "#aaa" }}><Clock className="h-3 w-3" /> {notes.duration}</span>
              </div>
              <h1 className="text-base font-semibold" style={{ color: "#111", lineHeight: 1.3 }}>{notes.title}</h1>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={downloadNotes} className="p-1.5 rounded-md" style={{ color: "#555" }}><Download className="h-4 w-4" /></button>
              <button onClick={copyNotes} className="p-1.5 rounded-md" style={{ color: copied ? "#22c55e" : "#555" }}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#666" }}>Summary</p>
            <p className="text-sm" style={{ color: "#333", lineHeight: 1.7 }}>{notes.summary}</p>
            <p className="text-[0.625rem] mt-1.5" style={{ color: "#ccc" }}>{notes.wordCount} words</p>
          </div>

          <div className="space-y-1.5 mb-3">
            {notes.sections.map((sec, i) => {
              const collapsed = collapsedSections.has(i);
              return (
                <div key={i} className="rounded-lg overflow-hidden" style={{ background: "#fff", border: `1px solid ${sec.isImportant ? "#fca5a5" : "#e8e8e8"}`, borderLeft: sec.isImportant ? "3px solid #ef4444" : undefined }}>
                  <button onClick={() => toggleSection(i)} className="w-full flex items-center justify-between px-3.5 py-2.5 text-left">
                    <span className="text-sm font-semibold" style={{ color: "#111" }}>{sec.heading}</span>
                    {collapsed ? <ChevronDown className="h-3.5 w-3.5" style={{ color: "#aaa" }} /> : <ChevronUp className="h-3.5 w-3.5" style={{ color: "#aaa" }} />}
                  </button>
                  {!collapsed && (
                    <div className="px-3.5 pb-3">
                      {sec.content.split("\n\n").map((para, pi) => (
                        <p key={pi} className="text-sm mb-2 last:mb-0" style={{ color: "#333", lineHeight: 1.7 }}>{para}</p>
                      ))}
                      {sec.keyTerms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {sec.keyTerms.map((term, ti) => (
                            <span key={ti} className="text-[0.5625rem] font-medium rounded px-1.5 py-0.5" style={{ background: "#fef2f2", color: "#991b1b" }}>{term}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {notes.definitions.length > 0 && (
            <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <p className="text-xs font-medium mb-2.5" style={{ color: "#666" }}>Key Definitions</p>
              <div className="space-y-2.5">
                {notes.definitions.map((d, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                    <div><p className="text-sm font-semibold" style={{ color: "#111" }}>{d.term}</p><p className="text-sm mt-0.5" style={{ color: "#555", lineHeight: 1.5 }}>{d.definition}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.formulas.length > 0 && (
            <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <p className="text-xs font-medium mb-2.5" style={{ color: "#666" }}>Formulas</p>
              <div className="space-y-2">
                {notes.formulas.map((f, i) => (
                  <div key={i} className="rounded-md p-2.5" style={{ background: "#f9f9f9" }}>
                    <p className="text-xs font-medium" style={{ color: "#666" }}>{f.name}</p>
                    <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{f.formula}</p>
                    <p className="text-xs" style={{ color: "#888" }}>{f.usage}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.examTips.length > 0 && (
            <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "#666" }}>JAMB Exam Tips</p>
              <div className="space-y-1.5">
                {notes.examTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
                    <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.gaps.length > 0 && (
            <div className="rounded-xl p-4 mb-5" style={{ background: "#fff", border: "1px solid #fca5a5" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "#991b1b" }}>Topics to Review</p>
              <div className="space-y-1.5">
                {notes.gaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                    <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{gap}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2.5">
            <button onClick={resetAll} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm"
              style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555" }}>
              <Mic className="h-3.5 w-3.5" /> New Recording
            </button>
            <button onClick={downloadNotes} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold"
              style={{ background: "#111", color: "#fff" }}>
              <Download className="h-3.5 w-3.5" /> Download Notes
            </button>
          </div>
        </div>
      )}

      <PageFooter />
    </div>
  );
}

export default function RecordLecturePage() {
  const header = <FeatureHeader title="Record Lecture" icon={<Mic className="h-4 w-4" style={{ color: "#ef4444" }} />} />;
  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      {header}
      <FeatureGate feature="record-lecture" header={header}>
        <RecordLectureContent />
      </FeatureGate>
    </div>
  );
}