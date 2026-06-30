"use client";

import { useState, useRef } from "react";
import {
  Image as ImageIcon, Upload, Loader2,
  BookOpen, Lightbulb, RotateCcw, Camera, X,
} from "lucide-react";
import { FeatureGate } from "@/components/ui/feature-gate";
import { FeatureHeader } from "@/components/ui/feature-header";
import { PageFooter } from "@/components/ui/page-footer";
import { useUsage } from "@/hooks/use-usage";

interface KeyConcept { term: string; definition: string }
interface Analysis {
  title: string; type: string; summary: string; explanation: string;
  keyConcepts: KeyConcept[]; examTips: string[]; relatedTopics: string[];
  difficulty: string;
}

type Phase = "upload" | "analyzing" | "result";

function VisualExplainerContent() {
  const usage = useUsage("visual-explainer");
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
    if (!image) { setError("Upload an image first."); return; }
    setError(""); setPhase("analyzing");
    try {
      const formData = new FormData();
      formData.append("image", image);
      if (question.trim()) formData.append("question", question.trim());
      if (context.trim()) formData.append("context", context.trim());
      const res = await fetch("/api/visual-explainer/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze");
      setAnalysis(data); setPhase("result");
      await usage.record();
    } catch (err: any) { setError(err.message); setPhase("upload"); }
  };

  const resetAll = () => { setPhase("upload"); setAnalysis(null); setImage(null); setPreview(null); setQuestion(""); setContext(""); setError(""); };

  const diffColor = (d: string) => d === "EASY" ? "#22c55e" : d === "HARD" ? "#ef4444" : "#f59e0b";

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
     
      

      {phase === "upload" && (
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-semibold" style={{ color: "#111" }}>Explain any image</h1>
            <p className="text-sm mt-1" style={{ color: "#888" }}>
              Upload a diagram, chart, equation, or textbook page. AI explains every detail and gives exam tips.
            </p>
          </div>

          {/* Image upload */}
          <div className="mb-4">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }} />

            {preview ? (
              <div className="relative rounded-lg overflow-hidden" style={{ border: "1px solid #e8e8e8" }}>
                <img src={preview} alt="Upload" className="w-full max-h-72 object-contain" style={{ background: "#fff" }} />
                <button onClick={() => { setImage(null); setPreview(null); }}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-lg py-7 transition-colors"
                  style={{ background: "#fcfcfc", border: "1px dashed #d0d0d0", color: "#999" }}>
                  <Upload className="h-5 w-5" />
                  <span className="text-sm">Upload Image</span>
                  <span className="text-[0.5625rem]" style={{ color: "#ccc" }}>JPG, PNG, WebP</span>
                </button>
                <button onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-lg py-7 transition-colors"
                  style={{ background: "#fcfcfc", border: "1px dashed #d0d0d0", color: "#999" }}>
                  <Camera className="h-5 w-5" />
                  <span className="text-sm">Take Photo</span>
                  <span className="text-[0.5625rem]" style={{ color: "#ccc" }}>Use camera</span>
                </button>
              </div>
            )}
          </div>

          {/* Question */}
          <div className="mb-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#444" }}>What do you want to know? (optional)</label>
            <input value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Explain this diagram, What formula is this..."
              className="w-full rounded-lg p-3 text-sm outline-none"
              style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#aaa"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#e0e0e0"; }} />
          </div>

          {/* Context */}
          <div className="mb-5">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#444" }}>Subject or context (optional)</label>
            <input value={context} onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Physics - Electricity, Biology - Cell Division"
              className="w-full rounded-lg p-3 text-sm outline-none"
              style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#aaa"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#e0e0e0"; }} />
          </div>

          {error && <p className="text-sm mb-3 text-center" style={{ color: "#dc2626" }}>{error}</p>}

          <button onClick={handleAnalyze} disabled={!image}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-all"
            style={{ background: "#111", color: "#fff", opacity: !image ? 0.35 : 1 }}>
            Analyze Image
          </button>
        </div>
      )}

      {phase === "analyzing" && (
        <div className="flex flex-col items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin mb-3" style={{ color: "#6366f1" }} />
          <p className="text-sm" style={{ color: "#555" }}>Identifying and explaining every element...</p>
        </div>
      )}

      {phase === "result" && analysis && (
        <div>
          {preview && (
            <div className="rounded-lg overflow-hidden mb-4" style={{ border: "1px solid #e8e8e8" }}>
              <img src={preview} alt="Analyzed" className="w-full max-h-56 object-contain" style={{ background: "#fff" }} />
            </div>
          )}

          <div className="mb-4">
            <h1 className="text-base font-semibold" style={{ color: "#111" }}>{analysis.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[0.625rem] font-medium rounded px-1.5 py-0.5" style={{ background: "#f3f3f3", color: "#666" }}>{analysis.type}</span>
              <span className="text-[0.625rem] font-semibold" style={{ color: diffColor(analysis.difficulty) }}>{analysis.difficulty}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
            <p className="text-sm" style={{ color: "#333", lineHeight: 1.6 }}>{analysis.summary}</p>
          </div>

          {/* Explanation */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "#666" }}>Detailed Explanation</p>
            {analysis.explanation.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm mb-2.5 last:mb-0" style={{ color: "#333", lineHeight: 1.7 }}>{para}</p>
            ))}
          </div>

          {/* Key Concepts */}
          {analysis.keyConcepts.length > 0 && (
            <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <p className="text-xs font-medium mb-2.5" style={{ color: "#666" }}>Key Concepts</p>
              <div className="space-y-2.5">
                {analysis.keyConcepts.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#6366f1" }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#111" }}>{c.term}</p>
                      <p className="text-sm mt-0.5" style={{ color: "#555", lineHeight: 1.5 }}>{c.definition}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Tips */}
          {analysis.examTips.length > 0 && (
            <div className="rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "#666" }}>Exam Tips</p>
              <div className="space-y-1.5">
                {analysis.examTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
                    <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Topics */}
          {analysis.relatedTopics.length > 0 && (
            <div className="rounded-xl p-4 mb-5" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "#666" }}>Related Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.relatedTopics.map((t, i) => (
                  <span key={i} className="text-xs rounded-md px-2 py-0.5" style={{ background: "#f3f3f3", color: "#555" }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          <button onClick={resetAll} className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm"
            style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555" }}>
            <RotateCcw className="h-3.5 w-3.5" /> Analyze Another
          </button>
        </div>
      )}

      <PageFooter />
    </div>
  );
}

export default function VisualExplainerPage() {
  const header = (
    <FeatureHeader
      title="Visual Explainer"
      icon={<ImageIcon className="h-4 w-4" style={{ color: "#6366f1" }} />}
    />
  );

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      {header}
      <FeatureGate feature="visual-explainer" header={header}>
        <VisualExplainerContent />
      </FeatureGate>
    </div>
  );
}