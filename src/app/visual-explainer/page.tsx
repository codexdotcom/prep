"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Image as ImageIcon, Upload, Loader2, Sparkles,
  BookOpen, AlertTriangle, Lightbulb, RotateCcw, Camera, X,
} from "lucide-react";

interface KeyConcept {
  term: string;
  definition: string;
}

interface Analysis {
  title: string;
  type: string;
  summary: string;
  explanation: string;
  keyConcepts: KeyConcept[];
  examTips: string[];
  relatedTopics: string[];
  difficulty: string;
}

type Phase = "upload" | "analyzing" | "result";

export default function VisualExplainerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [phase, setPhase] = useState<Phase>("upload");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");

  const handleImageSelect = (file: File) => {
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) { setError("Please upload an image first."); return; }
    setError("");
    setPhase("analyzing");
    try {
      const formData = new FormData();
      formData.append("image", image);
      if (question.trim()) formData.append("question", question.trim());
      if (context.trim()) formData.append("context", context.trim());

      const res = await fetch("/api/visual-explainer/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze");
      setAnalysis(data);
      setPhase("result");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setPhase("upload");
    }
  };

  const resetAll = () => {
    setPhase("upload"); setAnalysis(null); setImage(null); setPreview(null);
    setQuestion(""); setContext(""); setError("");
  };

  const diffColor = (d: string) => d === "EASY" ? "#22c55e" : d === "HARD" ? "#ef4444" : "#f59e0b";

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/tutor")} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" style={{ color: "#6366f1" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Visual Explainer</span>
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
                <ImageIcon className="h-7 w-7" style={{ color: "#6366f1" }} />
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>Explain any image</h1>
              <p className="mt-2 text-sm mx-auto max-w-sm" style={{ color: "#777", lineHeight: 1.6 }}>
                Upload a diagram, chart, equation, or textbook page. AI explains every detail and gives you exam tips.
              </p>
            </div>

            {/* Image upload area */}
            <div className="mb-4">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }} />

              {preview ? (
                <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid #eee" }}>
                  <img src={preview} alt="Upload" className="w-full max-h-80 object-contain" style={{ background: "#fff" }} />
                  <button onClick={() => { setImage(null); setPreview(null); }}
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl py-8 transition-all"
                    style={{ background: "#fff", border: "2px dashed #ddd", color: "#999" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#bbb"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ddd"; }}>
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Upload Image</span>
                    <span className="text-[0.625rem]" style={{ color: "#bbb" }}>JPG, PNG, WebP</span>
                  </button>
                  <button onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl py-8 transition-all"
                    style={{ background: "#fff", border: "2px dashed #ddd", color: "#999" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#bbb"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ddd"; }}>
                    <Camera className="h-6 w-6" />
                    <span className="text-sm">Take Photo</span>
                    <span className="text-[0.625rem]" style={{ color: "#bbb" }}>Use camera</span>
                  </button>
                </div>
              )}
            </div>

            {/* Question */}
            <div className="mb-4">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>What do you want to know? (optional)</label>
              <input value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Explain this diagram, What formula is this, Label each part..."
                className="w-full rounded-xl p-3 text-sm outline-none"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#111" }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#999"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#ddd"; }} />
            </div>

            {/* Context */}
            <div className="mb-6">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Subject or context (optional)</label>
              <input value={context} onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Physics - Electricity, Biology - Cell Division"
                className="w-full rounded-xl p-3 text-sm outline-none"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#111" }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#999"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#ddd"; }} />
            </div>

            {error && <p className="text-sm mb-4 text-center" style={{ color: "#ef4444" }}>{error}</p>}

            <button onClick={handleAnalyze} disabled={!image}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all"
              style={{ background: "#111", color: "#fff", opacity: !image ? 0.4 : 1 }}>
              <Sparkles className="h-4 w-4" /> Analyze Image
            </button>
          </div>
        )}

        {/* ═══ ANALYZING ═══ */}
        {phase === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: "#6366f1" }} />
            <p className="text-sm font-medium" style={{ color: "#111" }}>Analyzing your image...</p>
            <p className="text-xs mt-1" style={{ color: "#999" }}>AI is identifying and explaining every element</p>
          </div>
        )}

        {/* ═══ RESULT ═══ */}
        {phase === "result" && analysis && (
          <div>
            {/* Image + title */}
            {preview && (
              <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #eee" }}>
                <img src={preview} alt="Analyzed" className="w-full max-h-64 object-contain" style={{ background: "#fff" }} />
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold" style={{ color: "#111" }}>{analysis.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[0.625rem] font-semibold rounded-md px-2 py-0.5" style={{ background: "#f5f5f5", color: "#555" }}>{analysis.type}</span>
                  <span className="text-[0.625rem] font-semibold" style={{ color: diffColor(analysis.difficulty) }}>{analysis.difficulty}</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-sm" style={{ color: "#333", lineHeight: 1.6 }}>{analysis.summary}</p>
            </div>

            {/* Full explanation */}
            <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>Detailed Explanation</p>
              {analysis.explanation.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm mb-3 last:mb-0" style={{ color: "#333", lineHeight: 1.7 }}>{para}</p>
              ))}
            </div>

            {/* Key concepts */}
            {analysis.keyConcepts.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "#555" }}>Key Concepts</p>
                <div className="space-y-3">
                  {analysis.keyConcepts.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#6366f1" }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#111" }}>{c.term}</p>
                        <p className="text-sm mt-0.5" style={{ color: "#555", lineHeight: 1.5 }}>{c.definition}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exam tips */}
            {analysis.examTips.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>Exam Tips</p>
                <div className="space-y-1.5">
                  {analysis.examTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
                      <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related topics */}
            {analysis.relatedTopics.length > 0 && (
              <div className="rounded-xl p-4 mb-6" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>Related Topics to Study</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.relatedTopics.map((topic, i) => (
                    <span key={i} className="text-xs rounded-lg px-2.5 py-1" style={{ background: "#f5f5f5", color: "#555" }}>{topic}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={resetAll} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#555" }}>
                <RotateCcw className="h-4 w-4" /> Analyze Another
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