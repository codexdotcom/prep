"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Phone, PhoneOff, Mic, MicOff, Video as VideoIcon,
  VideoOff, Loader2, Brain, Upload, FileText, Trash2, X,
} from "lucide-react";

interface Note { id: number; content: string; timestamp: number }
type Status = "setup" | "connecting" | "active" | "thinking" | "speaking";

export default function CallPage() {
  const router = useRouter();

  const [status, setStatus] = useState<Status>("setup");
  const [topic, setTopic] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [materialContent, setMaterialContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [liveText, setLiveText] = useState("");
  const [spokenText, setSpokenText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [volume, setVolume] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const historyRef = useRef<Array<{ role: string; content: string }>>([]);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isActiveRef = useRef(false);
  const noteIdRef = useRef(0);
  const isSpeakingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const finalTextRef = useRef("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const sentenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ═══ Interrupt ═══

  const interruptTutor = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
      audioElRef.current.src = "";
    }
    if (sentenceTimerRef.current) {
      clearInterval(sentenceTimerRef.current);
      sentenceTimerRef.current = null;
    }
    isSpeakingRef.current = false;
    setSpokenText("");
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setStatus("active");
  }, []);

  // ═══ Recognition control ═══

  const pauseRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  }, []);

  const resumeRecognition = useCallback(() => {
    if (recognitionRef.current && isActiveRef.current && !isMuted) {
      setTimeout(() => {
        if (!isSpeakingRef.current && isActiveRef.current) {
          try { recognitionRef.current.start(); } catch {}
        }
      }, 300);
    }
  }, [isMuted]);

  // ═══ Speak with ElevenLabs ═══

  const speak = useCallback(async (text: string) => {
    isSpeakingRef.current = true;
    pauseRecognition();
    setStatus("speaking");

    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    setSpokenText(sentences[0]?.trim() || text);

    try {
      const res = await fetch("/api/call/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok || !res.headers.get("content-type")?.includes("audio")) {
        console.error("TTS failed, status:", res.status);
        isSpeakingRef.current = false;
        setStatus("active");
        setSpokenText("");
        resumeRecognition();
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioElRef.current = audio;

      audio.onloadedmetadata = () => {
        // Animate captions sentence by sentence based on actual audio duration
        const duration = audio.duration || sentences.length * 2.5;
        const interval = (duration / sentences.length) * 1000;
        let i = 0;

        setSpokenText(sentences[0]?.trim() || text);

        sentenceTimerRef.current = setInterval(() => {
          i++;
          if (!isSpeakingRef.current || i >= sentences.length) {
            if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);
            return;
          }
          setSpokenText(sentences[i].trim());
        }, interval);
      };

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (sentenceTimerRef.current) { clearInterval(sentenceTimerRef.current); sentenceTimerRef.current = null; }
        isSpeakingRef.current = false;
        setStatus("active");
        setSpokenText("");
        resumeRecognition();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (sentenceTimerRef.current) { clearInterval(sentenceTimerRef.current); sentenceTimerRef.current = null; }
        isSpeakingRef.current = false;
        setStatus("active");
        setSpokenText("");
        resumeRecognition();
      };

      await audio.play();
    } catch (err) {
      console.error("Speak error:", err);
      isSpeakingRef.current = false;
      setStatus("active");
      setSpokenText("");
      resumeRecognition();
    }
  }, [pauseRecognition, resumeRecognition]);

  // ═══ Send to AI ═══

  const sendToAI = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;
    if (isSpeakingRef.current) interruptTutor();

    setStatus("thinking");
    setSpokenText("");
    historyRef.current.push({ role: "user", content: userMessage });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/call/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: historyRef.current.slice(-20),
          context: topic,
          materialContent,
        }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;
      const data = await res.json();

      if (res.ok && data.spoken) {
        historyRef.current.push({ role: "assistant", content: data.spoken });
        if (data.notes?.length > 0) {
          data.notes.forEach((n: string) => {
            setNotes((prev) => [...prev, { id: noteIdRef.current++, content: n, timestamp: elapsed }]);
            setShowNotes(true);
          });
        }
        speak(data.spoken);
      } else {
        setStatus("active");
        resumeRecognition();
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setStatus("active");
      resumeRecognition();
    }
    abortRef.current = null;
  }, [speak, topic, materialContent, elapsed, interruptTutor, resumeRecognition]);

  // ═══ Upload ═══

  const handleUpload = async (file: File) => {
    setUploadedFile(file);
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/call/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMaterialContent(data.content);
    } catch (err: any) {
      setUploadError(err.message || "Failed to process file");
      setUploadedFile(null);
    }
    setUploading(false);
  };

  // ═══ Start call ═══

  const startCall = async () => {
    setStatus("connecting");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Try Chrome or Edge.");
      setStatus("setup");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      audioStreamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      updateVolume();
    } catch {
      alert("Microphone access is required.");
      setStatus("setup");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-NG";
    finalTextRef.current = "";

    recognition.onresult = (event: any) => {
      // Interrupt if user speaks while tutor is talking
      if (isSpeakingRef.current) {
        let hasContent = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i][0].transcript.trim().length > 3) { hasContent = true; break; }
        }
        if (hasContent) { interruptTutor(); finalTextRef.current = ""; }
      }

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTextRef.current += event.results[i][0].transcript + " ";
        else interim = event.results[i][0].transcript;
      }
      setLiveText(interim);
      setTranscript(finalTextRef.current);

      if (silenceRef.current) clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => {
        if (finalTextRef.current.trim() && !isSpeakingRef.current) {
          const msg = finalTextRef.current.trim();
          finalTextRef.current = "";
          setTranscript("");
          setLiveText("");
          pauseRecognition();
          sendToAI(msg);
        }
      }, 1800);
    };

    recognition.onend = () => {
      if (isActiveRef.current && !isSpeakingRef.current && !isMuted) {
        setTimeout(() => {
          if (isActiveRef.current && !isSpeakingRef.current) {
            try { recognition.start(); } catch {}
          }
        }, 200);
      }
    };

    recognition.onerror = () => {};

    recognitionRef.current = recognition;
    recognition.start();
    isActiveRef.current = true;
    setStatus("active");
    historyRef.current = [];
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    const greeting = topic
      ? `Hi there. I see you want to work on ${topic}. ${materialContent ? "I have also gone through the material you uploaded. " : ""}Let us get into it. What would you like to start with?`
      : "Hi there. I am your JambOS tutor. What would you like to work on today?";
    setTimeout(() => speak(greeting), 600);
  };

  const updateVolume = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    setVolume(avg / 255);
    animFrameRef.current = requestAnimationFrame(updateVolume);
  };

  // ═══ End call ═══

  const endCall = () => {
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.src = ""; }
    if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);
    isSpeakingRef.current = false;
    isActiveRef.current = false;
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (silenceRef.current) clearTimeout(silenceRef.current);
    if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach((t) => t.stop()); audioStreamRef.current = null; }
    if (videoStreamRef.current) { videoStreamRef.current.getTracks().forEach((t) => t.stop()); videoStreamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    setStatus("setup"); setElapsed(0); setVolume(0); setCameraOn(false); setIsMuted(false);
    setTranscript(""); setLiveText(""); setSpokenText(""); setNotes([]); setShowNotes(false);
    finalTextRef.current = "";
  };

  // ═══ Camera ═══

  const toggleCamera = async () => {
    if (cameraOn) {
      if (videoStreamRef.current) { videoStreamRef.current.getTracks().forEach((t) => t.stop()); videoStreamRef.current = null; }
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } } });
        videoStreamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
        setCameraOn(true);
      } catch {}
    }
  };

  // ═══ Mute ═══

  const toggleMute = () => {
    if (!isMuted) {
      pauseRecognition();
      audioStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = false; });
    } else {
      audioStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = true; });
      if (!isSpeakingRef.current) resumeRecognition();
    }
    setIsMuted(!isMuted);
  };

  // ═══ Cleanup ═══

  useEffect(() => {
    return () => { endCall(); };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const isInCall = status === "active" || status === "thinking" || status === "speaking";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: status === "setup" ? "#fafafa" : "#0a0a0a" }}>
      <header className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: status === "setup" ? "rgba(255,255,255,0.92)" : "rgba(10,10,10,0.9)", borderBottom: status === "setup" ? "1px solid #eee" : "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => { endCall(); router.push("/tutor"); }} className="flex items-center gap-1.5 text-sm" style={{ color: status === "setup" ? "#555" : "#777" }}>
          <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4" style={{ color: "#14b8a6" }} />
          <span className="text-sm font-semibold" style={{ color: status === "setup" ? "#111" : "#fff" }}>
            {isInCall ? formatTime(elapsed) : "Voice Tutor"}
          </span>
        </div>
        <div style={{ width: 60, display: "flex", justifyContent: "flex-end" }}>
          {isInCall && notes.length > 0 && (
            <button onClick={() => setShowNotes(!showNotes)} className="p-2 rounded-lg text-xs font-medium" style={{ color: "#14b8a6" }}>
              Notes ({notes.length})
            </button>
          )}
        </div>
      </header>

      {/* ═══ SETUP ═══ */}
      {status === "setup" && (
        <div className="flex-1 mx-auto max-w-lg w-full px-4 pt-8 pb-12">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "#f5f5f5" }}>
              <Phone className="h-7 w-7" style={{ color: "#14b8a6" }} />
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>Live Voice Tutor</h1>
            <p className="mt-2 text-sm mx-auto max-w-sm" style={{ color: "#777", lineHeight: 1.6 }}>
              An AI tutor that thinks with you, not for you. Talk naturally, interrupt anytime, and get real-time help on any subject.
            </p>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>What do you want to work on? (optional)</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Quadratic equations, Organic chemistry..."
              className="w-full rounded-xl p-3 text-sm outline-none" style={{ background: "#fff", border: "1px solid #ddd", color: "#111" }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#999"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#ddd"; }} />
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {["Quadratic Equations", "Photosynthesis", "Ohm's Law", "Comprehension", "Mole Concept", "Demand and Supply"].map((t) => (
              <button key={t} onClick={() => setTopic(t)} className="rounded-lg px-2.5 py-1 text-xs transition-all"
                style={{ background: topic === t ? "#111" : "#fff", color: topic === t ? "#fff" : "#555", border: `1px solid ${topic === t ? "#111" : "#eee"}` }}>
                {t}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Upload study material (optional)</label>
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,audio/*" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
            {uploadedFile ? (
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#fff", border: "1px solid #eee" }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: "#f0fdfa" }}>
                  <FileText className="h-4 w-4" style={{ color: "#14b8a6" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#111" }}>{uploadedFile.name}</p>
                  <p className="text-[0.625rem]" style={{ color: uploading ? "#14b8a6" : "#999" }}>
                    {uploading ? "Processing..." : `${(uploadedFile.size / 1024).toFixed(0)} KB - Ready`}
                  </p>
                </div>
                {uploading
                  ? <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: "#14b8a6" }} />
                  : <button onClick={() => { setUploadedFile(null); setMaterialContent(""); }} className="p-1.5 rounded-lg" style={{ color: "#999" }}><Trash2 className="h-4 w-4" /></button>}
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 rounded-xl py-4 transition-all"
                style={{ background: "#fff", border: "2px dashed #ddd", color: "#999" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#bbb"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ddd"; }}>
                <Upload className="h-4 w-4" /><span className="text-sm">PDF, text, or audio recording</span>
              </button>
            )}
            {uploadError && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{uploadError}</p>}
          </div>

          <div className="rounded-xl p-4 mb-6" style={{ background: "#fff", border: "1px solid #eee" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "#555" }}>How it works</p>
            <div className="space-y-2">
              {[
                "Speak naturally. The tutor responds when you pause.",
                "Interrupt anytime by speaking over the tutor.",
                "Turn on your camera to show diagrams or pages.",
                "Written notes appear when formulas or details are needed.",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[0.625rem] font-bold mt-0.5"
                    style={{ background: "#f5f5f5", color: "#999", fontFamily: "var(--font-mono)" }}>{i + 1}</span>
                  <p className="text-xs" style={{ color: "#555", lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={startCall} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: "#14b8a6", color: "#fff", opacity: uploading ? 0.5 : 1, boxShadow: "0 4px 16px rgba(20,184,166,0.25)" }}>
            <Phone className="h-5 w-5" /> Start Call
          </button>
        </div>
      )}

      {/* ═══ CONNECTING ═══ */}
      {status === "connecting" && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative mb-6" style={{ width: 80, height: 80 }}>
            <div className="absolute inset-0 rounded-full" style={{ border: "2px solid #14b8a6", opacity: 0.2, animation: "callRing 1.5s ease-out infinite" }} />
            <div className="absolute inset-0 rounded-full" style={{ border: "2px solid #14b8a6", opacity: 0.1, animation: "callRing 1.5s ease-out 0.3s infinite" }} />
            <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
              <Phone className="h-6 w-6" style={{ color: "#14b8a6" }} />
            </div>
          </div>
          <p className="text-sm" style={{ color: "#888" }}>Connecting...</p>
          <style>{`@keyframes callRing { 0% { transform: scale(1); opacity: 0.3; } 100% { transform: scale(1.6); opacity: 0; } }`}</style>
        </div>
      )}

      {/* ═══ IN CALL ═══ */}
      {isInCall && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
            {cameraOn && (
              <div className="absolute top-4 right-4 rounded-xl overflow-hidden shadow-lg" style={{ width: 140, border: "2px solid rgba(255,255,255,0.1)" }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full block" />
              </div>
            )}
            {!cameraOn && <video ref={videoRef} className="hidden" />}

            {/* Tutor avatar */}
            <div className="relative mb-6" style={{ width: 140, height: 140 }}>
              {status === "speaking" && (
                <>
                  <div className="absolute rounded-full" style={{ inset: -24, border: "1px solid #14b8a6", opacity: 0.06, animation: "callPulse 1.5s ease-in-out infinite" }} />
                  <div className="absolute rounded-full" style={{ inset: -16, border: "1px solid #14b8a6", opacity: 0.08, animation: "callPulse 1.5s ease-in-out 0.4s infinite" }} />
                </>
              )}
              <div className="absolute inset-0 rounded-full" style={{
                border: `2px solid ${status === "thinking" ? "#f59e0b" : status === "speaking" ? "#14b8a6" : "rgba(255,255,255,0.08)"}`,
                opacity: status === "active" ? 0.08 : 0.2,
                animation: status !== "active" ? "callPulse 2s ease-in-out infinite" : "none",
              }} />
              <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{
                background: status === "speaking" ? "rgba(20,184,166,0.06)" : status === "thinking" ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)", transition: "background 0.3s",
              }}>
                {status === "thinking"
                  ? <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#f59e0b" }} />
                  : <Brain className="h-8 w-8" style={{ color: status === "speaking" ? "#14b8a6" : "#444", transition: "color 0.3s" }} />}
              </div>
              <style>{`@keyframes callPulse { 0%,100% { transform: scale(1); opacity: 0.12; } 50% { transform: scale(1.12); opacity: 0.04; } }`}</style>
            </div>

            <p className="text-[0.625rem] uppercase tracking-wider mb-1" style={{ color: "#555" }}>JambOS Tutor</p>
            <p className="text-xs mb-6" style={{ color: status === "thinking" ? "#f59e0b" : status === "speaking" ? "#14b8a6" : "#555" }}>
              {status === "thinking" ? "Thinking..." : status === "speaking" ? "Speaking" : isMuted ? "Muted" : "Listening"}
            </p>

            {!isMuted && status === "active" && (
              <div className="flex items-center justify-center gap-0.5 mb-4 h-8">
                {Array.from({ length: 24 }).map((_, i) => {
                  const center = 12;
                  const dist = Math.abs(i - center) / center;
                  const height = Math.max(2, (1 - dist) * volume * 36 + Math.random() * 3);
                  return <div key={i} className="rounded-full" style={{ width: 2, height, background: "#14b8a6", opacity: 0.2 + volume * 0.8, transition: "height 0.1s" }} />;
                })}
              </div>
            )}

            {status === "speaking" && spokenText && (
              <div className="rounded-xl p-4 mb-3 mx-auto max-w-sm w-full" style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.1)" }}>
                <p className="text-[0.5625rem] font-medium mb-1" style={{ color: "#14b8a6" }}>Tutor</p>
                <p className="text-sm" style={{ color: "#ccc", lineHeight: 1.6 }}>{spokenText}</p>
              </div>
            )}

            {(transcript || liveText) && !isSpeakingRef.current && (
              <div className="rounded-xl p-4 mb-3 mx-auto max-w-sm w-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[0.5625rem] font-medium mb-1" style={{ color: "#777" }}>You</p>
                <p className="text-sm" style={{ color: "#ddd" }}>
                  {transcript}<span style={{ color: "#555" }}>{liveText}</span>
                </p>
              </div>
            )}

            {status === "speaking" && (
              <p className="text-[0.5rem] mt-1" style={{ color: "#444" }}>Speak to interrupt</p>
            )}
          </div>

          {showNotes && notes.length > 0 && (
            <div className="shrink-0 mx-4 mb-3 rounded-xl overflow-hidden" style={{ maxHeight: 180, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[0.625rem] font-semibold" style={{ color: "#777" }}>Written Notes</p>
                <button onClick={() => setShowNotes(false)} className="p-1" style={{ color: "#555" }}><X className="h-3 w-3" /></button>
              </div>
              <div className="overflow-y-auto px-3 py-2 space-y-2" style={{ maxHeight: 140 }}>
                {notes.map((note) => (
                  <div key={note.id} className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[0.5rem] mb-1" style={{ fontFamily: "var(--font-mono)", color: "#555" }}>{formatTime(note.timestamp)}</p>
                    <p className="text-xs" style={{ color: "#ccc", lineHeight: 1.5 }}>{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="shrink-0 pb-8 pt-4 px-4">
            <div className="flex items-center justify-center gap-5">
              <button onClick={toggleMute} className="flex flex-col items-center gap-1.5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full transition-all"
                  style={{ background: isMuted ? "#ef4444" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </div>
                <span className="text-[0.5625rem]" style={{ color: "#666" }}>{isMuted ? "Unmute" : "Mute"}</span>
              </button>
              <button onClick={endCall} className="flex flex-col items-center gap-1.5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full transition-all active:scale-95"
                  style={{ background: "#ef4444", boxShadow: "0 4px 16px rgba(239,68,68,0.3)", color: "#fff" }}>
                  <PhoneOff className="h-6 w-6" />
                </div>
                <span className="text-[0.5625rem]" style={{ color: "#666" }}>End</span>
              </button>
              <button onClick={toggleCamera} className="flex flex-col items-center gap-1.5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full transition-all"
                  style={{ background: cameraOn ? "#14b8a6" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                  {cameraOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </div>
                <span className="text-[0.5625rem]" style={{ color: "#666" }}>Camera</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}