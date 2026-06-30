"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Video, Loader2, Sparkles, Play, Pause, SkipForward,
  SkipBack, Volume2, VolumeX,
  Download, Bookmark, Check,
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";
import { FeatureGate } from "@/components/ui/feature-gate";
import { FeatureHeader } from "@/components/ui/feature-header";
import { PageFooter } from "@/components/ui/page-footer";
import { useUsage } from "@/hooks/use-usage";

interface SlideContent { items: string[] | null; formula: string | null; leftLabel: string | null; rightLabel: string | null; leftItems: string[] | null; rightItems: string[] | null; question: string | null; answer: string | null }
interface Illustration { type: string; elements: string[]; labels: string[] }
interface Slide { id: number; type: string; heading: string; content: SlideContent; illustration: Illustration; narration: string; duration: number; accentColor: string; bgGradient: string[] }
interface VideoData { title: string; subject: string; totalDuration: number; slides: Slide[] }
type Phase = "input" | "generating" | "playing";

// ═══ SVG Illustrations (unchanged) ═══

function FloatingParticles({ color, count = 12 }: { color: string; count?: number }) {
  return (<svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>{Array.from({ length: count }).map((_, i) => { const cx = 10 + Math.random() * 80; const cy = 10 + Math.random() * 80; const r = 1 + Math.random() * 3; const dur = 3 + Math.random() * 4; const delay = Math.random() * 3; return (<circle key={i} cx={`${cx}%`} cy={`${cy}%`} r={r} fill={color}><animate attributeName="cy" values={`${cy}%;${cy - 5}%;${cy}%`} dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" /><animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" /></circle>); })}</svg>);
}

function IllustrationAtoms({ color }: { color: string }) {
  return (<svg viewBox="0 0 200 200" className="w-full h-full" style={{ maxWidth: 160 }}><circle cx="100" cy="100" r="20" fill={color} opacity="0.3"><animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" /></circle><circle cx="100" cy="100" r="8" fill={color} opacity="0.6" /><ellipse cx="100" cy="100" rx="60" ry="25" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" transform="rotate(-30 100 100)"><animateTransform attributeName="transform" type="rotate" from="-30 100 100" to="330 100 100" dur="6s" repeatCount="indefinite" /></ellipse><ellipse cx="100" cy="100" rx="60" ry="25" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" transform="rotate(30 100 100)"><animateTransform attributeName="transform" type="rotate" from="30 100 100" to="390 100 100" dur="8s" repeatCount="indefinite" /></ellipse></svg>);
}

function IllustrationWave({ color }: { color: string }) {
  return (<svg viewBox="0 0 200 100" className="w-full" style={{ maxWidth: 200 }}><path d="M0,50 Q25,20 50,50 T100,50 T150,50 T200,50" fill="none" stroke={color} strokeWidth="2.5" opacity="0.6"><animate attributeName="d" values="M0,50 Q25,20 50,50 T100,50 T150,50 T200,50;M0,50 Q25,80 50,50 T100,50 T150,50 T200,50;M0,50 Q25,20 50,50 T100,50 T150,50 T200,50" dur="3s" repeatCount="indefinite" /></path></svg>);
}

function IllustrationGraph({ color }: { color: string }) {
  return (<svg viewBox="0 0 200 150" className="w-full" style={{ maxWidth: 180 }}><line x1="30" y1="120" x2="190" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="1" /><line x1="30" y1="20" x2="30" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="1" /><polyline points="30,110 60,90 90,70 120,45 150,55 180,30" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />{[30,60,90,120,150,180].map((x, i) => { const y = [110,90,70,45,55,30][i]; return <circle key={i} cx={x} cy={y} r="3" fill={color} opacity="0.8" />; })}</svg>);
}

function IllustrationCircuit({ color }: { color: string }) {
  return (<svg viewBox="0 0 200 120" className="w-full" style={{ maxWidth: 180 }}><rect x="20" y="30" width="160" height="60" rx="4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" /><rect x="40" y="45" width="20" height="30" rx="2" fill={color} opacity="0.3" /><text x="50" y="65" fill={color} fontSize="9" textAnchor="middle">V</text><circle cx="100" cy="30" r="2" fill={color}><animateMotion dur="4s" repeatCount="indefinite" path="M-80,0 L60,0 L60,60 L-80,60 Z" /></circle></svg>);
}

function IllustrationCell({ color }: { color: string }) {
  return (<svg viewBox="0 0 200 200" className="w-full h-full" style={{ maxWidth: 160 }}><ellipse cx="100" cy="100" rx="80" ry="70" fill={color} opacity="0.08" stroke={color} strokeWidth="2" /><ellipse cx="100" cy="90" rx="30" ry="25" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"><animate attributeName="ry" values="25;27;25" dur="3s" repeatCount="indefinite" /></ellipse><text x="100" y="95" fill={color} fontSize="8" textAnchor="middle" opacity="0.6">nucleus</text></svg>);
}

function IllustrationProcess({ color }: { color: string }) {
  return (<svg viewBox="0 0 200 60" className="w-full" style={{ maxWidth: 200 }}>{[0,1,2,3].map((i) => { const x = 25 + i * 50; return (<g key={i}><rect x={x-15} y={15} width="30" height="30" rx="6" fill={color} opacity={0.15+i*0.1} /><text x={x} y={35} fill={color} fontSize="10" textAnchor="middle" opacity="0.7">{i+1}</text>{i<3 && <line x1={x+18} y1={30} x2={x+32} y2={30} stroke={color} strokeWidth="1.5" opacity="0.3" />}</g>); })}</svg>);
}

function IllustrationForType({ type, color }: { type: string; color: string }) {
  switch (type) {
    case "atoms": return <IllustrationAtoms color={color} />;
    case "wave": case "forces": return <IllustrationWave color={color} />;
    case "graph": case "equation": return <IllustrationGraph color={color} />;
    case "circuit": return <IllustrationCircuit color={color} />;
    case "cell": return <IllustrationCell color={color} />;
    case "process": case "comparison": return <IllustrationProcess color={color} />;
    default: return <IllustrationAtoms color={color} />;
  }
}

// ═══ Download HTML (unchanged, abbreviated for space) ═══

function generateDownloadHTML(video: VideoData): string {
  const slidesJSON = JSON.stringify(video.slides);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${video.title} - JambOS</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#000;color:#fff;overflow:hidden;height:100vh}.player{position:relative;width:100%;height:100vh;display:flex;align-items:center;justify-content:center}.slide{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem 3rem;opacity:0;transition:opacity 0.6s,transform 0.6s;transform:translateY(20px)}.slide.active{opacity:1;transform:translateY(0)}.slide h1{font-size:clamp(1.5rem,4vw,2.5rem);text-align:center;margin-bottom:1rem;line-height:1.3}.slide p,.slide li{font-size:clamp(0.875rem,2vw,1.125rem);line-height:1.7;color:rgba(255,255,255,0.8)}.slide ul{list-style:none;text-align:left;max-width:500px}.slide li{padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.05)}.slide li:before{content:">";margin-right:0.75rem;opacity:0.4}.formula-box{font-family:monospace;font-size:clamp(1.25rem,3vw,2rem);padding:1.5rem 2.5rem;border-radius:1rem;margin:1rem 0;letter-spacing:0.05em}.controls{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:0.75rem;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);padding:0.5rem 1rem;border-radius:9999px;border:1px solid rgba(255,255,255,0.1);z-index:50}.controls button{background:none;border:none;color:#fff;cursor:pointer;padding:0.5rem;border-radius:50%;transition:background 0.2s}.controls button:hover{background:rgba(255,255,255,0.1)}.controls button.play-btn{background:rgba(255,255,255,0.15);width:40px;height:40px;display:flex;align-items:center;justify-content:center}.progress{position:fixed;bottom:0;left:0;height:3px;transition:width 0.1s linear;z-index:51}.counter{font-family:monospace;font-size:0.75rem;color:rgba(255,255,255,0.5);min-width:3rem;text-align:center}.brand{position:fixed;top:1rem;left:1rem;font-size:0.75rem;opacity:0.3;z-index:50}</style></head><body><div class="brand">JambOS</div><div class="player" id="player"></div><div class="progress" id="progress"></div><div class="controls"><button onclick="prev()">&lt;&lt;</button><button class="play-btn" id="playBtn" onclick="togglePlay()">&#9654;</button><button onclick="next()">&gt;&gt;</button><span class="counter" id="counter">1/${video.slides.length}</span></div><script>const slides=${slidesJSON};let current=0,playing=false,timer=null,elapsed=0;const player=document.getElementById('player'),prog=document.getElementById('progress'),counter=document.getElementById('counter'),playBtn=document.getElementById('playBtn');function render(){const s=slides[current];const bg=s.bgGradient?'linear-gradient(135deg,'+s.bgGradient.join(',')+')':'linear-gradient(135deg,#0f172a,#1e293b)';let html='<div class="slide active" style="background:'+bg+'">';if(s.type==='title'){html+='<h1>'+s.heading+'</h1>';}else if(s.type==='formula'){html+='<h1 style="font-size:1.25rem">'+s.heading+'</h1>';if(s.content.formula)html+='<div class="formula-box" style="background:rgba(255,255,255,0.05);border:1px solid '+s.accentColor+'40;color:'+s.accentColor+'">'+s.content.formula+'</div>';}else if(s.type==='quiz'){html+='<h1 style="font-size:1.25rem">'+s.content.question+'</h1>';html+='<button onclick="this.nextElementSibling.style.display=\\'block\\';this.style.display=\\'none\\'" style="margin-top:1rem;padding:0.75rem 1.5rem;background:'+s.accentColor+';border:none;color:#fff;border-radius:0.75rem;cursor:pointer">Reveal</button>';html+='<div style="display:none;margin-top:1rem;background:rgba(255,255,255,0.05);padding:1.25rem;border-radius:0.75rem"><p>'+s.content.answer+'</p></div>';}else{html+='<h1 style="font-size:1.25rem">'+s.heading+'</h1>';if(s.content.items){html+='<ul>';s.content.items.forEach(t=>{html+='<li>'+t+'</li>';});html+='</ul>';}}html+='</div>';player.innerHTML=html;counter.textContent=(current+1)+'/'+slides.length;prog.style.background=s.accentColor;if(playing&&window.speechSynthesis){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(s.narration);u.rate=0.95;window.speechSynthesis.speak(u);}}function next(){if(current<slides.length-1){current++;elapsed=0;render();}}function prev(){if(current>0){current--;elapsed=0;render();}}function togglePlay(){playing=!playing;playBtn.innerHTML=playing?'&#9646;&#9646;':'&#9654;';if(playing){render();tick();}else{clearInterval(timer);window.speechSynthesis&&window.speechSynthesis.cancel();}}function tick(){clearInterval(timer);timer=setInterval(()=>{elapsed+=50;const dur=slides[current].duration*1000;const total=((current+elapsed/dur)/slides.length)*100;prog.style.width=total+'%';if(elapsed>=dur){if(current<slides.length-1){current++;elapsed=0;render();}else{playing=false;playBtn.innerHTML='&#9654;';clearInterval(timer);}}},50);}render();</script></body></html>`;
}

const SUGGESTED = ["Quadratic Equations", "Photosynthesis", "Ohm's Law", "Demand and Supply", "Organic Chemistry Alkanes", "Cell Division", "Projectile Motion", "Logarithms", "The Water Cycle", "Electromagnetic Spectrum"];

function ExplainerVideoContent() {
  const router = useRouter();
  const usage = useUsage("explainer-video");

  const [topic, setTopic] = useState(""); const [subject, setSubject] = useState(""); const [style, setStyle] = useState("standard");
  const [phase, setPhase] = useState<Phase>("input"); const [video, setVideo] = useState<VideoData | null>(null); const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0); const [isPlaying, setIsPlaying] = useState(false); const [isMuted, setIsMuted] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0); const [showAnswer, setShowAnswer] = useState(false); const [animateIn, setAnimateIn] = useState(true); const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null); const playerRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) { setError("Enter a topic."); return; }
    setError(""); setPhase("generating");
    try {
      const res = await fetch("/api/explainer-video/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topic.trim(), subject, style }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideo(data); setCurrentSlide(0); setSlideProgress(0); setIsPlaying(false); setShowAnswer(false); setSaved(false); setPhase("playing");
      await usage.record();
    } catch (err: any) { setError(err.message); setPhase("input"); }
  };

  const speak = useCallback((text: string) => {
    if (isMuted) return; window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text); utter.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find((v) => v.lang.startsWith("en-GB")) || voices.find((v) => v.lang.startsWith("en"));
    if (pref) utter.voice = pref; window.speechSynthesis.speak(utter);
  }, [isMuted]);

  useEffect(() => {
    if (!isPlaying || !video) return;
    const slide = video.slides[currentSlide]; if (!slide) return;
    speak(slide.narration);
    const totalMs = slide.duration * 1000; let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 50; setSlideProgress((elapsed / totalMs) * 100);
      if (elapsed >= totalMs) { if (currentSlide < video.slides.length - 1) goToSlide(currentSlide + 1); else { setIsPlaying(false); if (timerRef.current) clearInterval(timerRef.current); } }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, currentSlide, video, speak]);

  const goToSlide = (i: number) => {
    if (!video || i < 0 || i >= video.slides.length) return;
    window.speechSynthesis.cancel(); if (timerRef.current) clearInterval(timerRef.current);
    setAnimateIn(false); setTimeout(() => { setCurrentSlide(i); setSlideProgress(0); setShowAnswer(false); setAnimateIn(true); }, 50);
  };

  const togglePlay = () => { if (isPlaying) { window.speechSynthesis.cancel(); if (timerRef.current) clearInterval(timerRef.current); setIsPlaying(false); } else setIsPlaying(true); };

  const handleDownload = () => {
    if (!video) return;
    const html = generateDownloadHTML(video); const blob = new Blob([html], { type: "text/html" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${video.title.replace(/[^a-zA-Z0-9]/g, "_")}_JambOS.html`; a.click(); URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!video || saved) return;
    try { const res = await fetch("/api/bookmarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "video", title: video.title, data: { slides: video.slides, totalDuration: video.totalDuration, subject: video.subject } }) }); if (res.ok) setSaved(true); } catch {}
  };

  const resetAll = () => { window.speechSynthesis.cancel(); if (timerRef.current) clearInterval(timerRef.current); setPhase("input"); setVideo(null); setTopic(""); setError(""); setCurrentSlide(0); setIsPlaying(false); setSaved(false); };

  useEffect(() => { window.speechSynthesis.getVoices(); return () => { window.speechSynthesis.cancel(); if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const slide = video?.slides[currentSlide];
  const totalProg = video ? ((currentSlide + slideProgress / 100) / video.slides.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      {usage.limit > 0 && (
        <div className="flex items-center justify-end mb-4">
          <span className="text-[0.625rem] px-2 py-0.5 rounded-md" style={{ background: "#f5f5f5", color: "#999", fontFamily: "var(--font-mono)" }}>
            {usage.remaining === -1 ? "Unlimited" : `${usage.remaining} left today`}
          </span>
        </div>
      )}

      {phase === "input" && (
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-semibold" style={{ color: "#111" }}>Generate an explainer video</h1>
            <p className="text-sm mt-1" style={{ color: "#888" }}>Enter any topic. AI creates an animated video with diagrams, narration, and exam tips.</p>
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#444" }}>Topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Quadratic Equations"
              className="w-full rounded-lg p-3 text-sm outline-none" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#aaa"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#e0e0e0"; }}
              onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }} />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {SUGGESTED.map((s) => (
              <button key={s} onClick={() => setTopic(s)} className="rounded-md px-2 py-1 text-xs transition-colors"
                style={{ background: "#fcfcfc", border: "1px solid #e8e8e8", color: "#555" }}>{s}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#444" }}>Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg p-2.5 text-sm outline-none" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}>
                <option value="">Auto-detect</option>
                {JAMB_SUBJECTS.map((s) => <option key={s.value} value={s.label}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#444" }}>Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full rounded-lg p-2.5 text-sm outline-none" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111" }}>
                <option value="standard">Standard</option><option value="fun">Fun and casual</option><option value="exam">Exam-focused</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm mb-3 text-center" style={{ color: "#dc2626" }}>{error}</p>}
          <button onClick={handleGenerate} disabled={!topic.trim()} className="w-full rounded-xl py-3 text-sm font-semibold"
            style={{ background: "#111", color: "#fff", opacity: !topic.trim() ? 0.35 : 1 }}>Generate Video</button>
        </div>
      )}

      {phase === "generating" && (
        <div className="flex flex-col items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin mb-3" style={{ color: "#14b8a6" }} />
          <p className="text-sm" style={{ color: "#555" }}>Producing slides, diagrams, and narration...</p>
        </div>
      )}

      {phase === "playing" && video && slide && (
        <div ref={playerRef}>
          {/* Video canvas */}
          <div className="rounded-xl overflow-hidden mb-3 relative" style={{ aspectRatio: "16/9", background: slide.bgGradient ? `linear-gradient(135deg, ${slide.bgGradient[0]}, ${slide.bgGradient[1]})` : "linear-gradient(135deg, #0f172a, #1e293b)" }}>
            <FloatingParticles color={slide.accentColor} />
            {slide.illustration && (
              <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2" style={{ opacity: 0.5, width: "30%", maxWidth: 180 }}>
                <IllustrationForType type={slide.illustration.type} color={slide.accentColor} />
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-10 z-10"
              style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(12px)", transition: "all 0.5s ease-out" }}>
              <div className="absolute top-4 left-4">
                <span className="text-[0.5625rem] font-semibold px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>{currentSlide + 1}/{video.slides.length}</span>
              </div>

              {slide.type === "title" && (
                <div className="text-center max-w-lg">
                  <div className="h-1 w-16 rounded-full mx-auto mb-6" style={{ background: slide.accentColor }} />
                  <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.25rem, 4vw, 2rem)", color: "#fff", lineHeight: 1.3 }}>{slide.heading}</h1>
                  {slide.content.items?.map((item, i) => <p key={i} className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.5)" }}>{item}</p>)}
                </div>
              )}

              {(slide.type === "text" || slide.type === "list" || slide.type === "diagram") && (
                <div className="w-full max-w-lg">
                  <h2 className="text-lg font-semibold mb-5" style={{ color: "#fff" }}>
                    <span className="inline-block h-0.5 w-8 rounded-full mr-3" style={{ background: slide.accentColor, verticalAlign: "middle" }} />{slide.heading}
                  </h2>
                  <div className="space-y-3">
                    {slide.content.items?.map((item, i) => (
                      <div key={i} className="flex items-start gap-3" style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? "translateX(0)" : "translateX(-12px)", transition: `all 0.4s ease-out ${i * 0.12}s` }}>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[0.625rem] font-bold mt-0.5" style={{ background: `${slide.accentColor}20`, color: slide.accentColor, fontFamily: "var(--font-mono)" }}>{slide.type === "list" ? i + 1 : ""}</span>
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {slide.type === "formula" && (
                <div className="text-center max-w-lg">
                  <h2 className="text-lg font-semibold mb-6" style={{ color: "#fff" }}>{slide.heading}</h2>
                  {slide.content.formula && (<div className="rounded-xl p-6 mb-5 inline-block" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${slide.accentColor}40` }}><p style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1rem, 3vw, 1.5rem)", color: slide.accentColor, letterSpacing: "0.05em" }}>{slide.content.formula}</p></div>)}
                  <div className="space-y-2 text-left max-w-sm mx-auto">{slide.content.items?.map((item, i) => <p key={i} className="text-sm" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{item}</p>)}</div>
                </div>
              )}

              {slide.type === "comparison" && (
                <div className="w-full max-w-lg">
                  <h2 className="text-lg font-semibold mb-5 text-center" style={{ color: "#fff" }}>{slide.heading}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.05)", borderTop: `2px solid ${slide.accentColor}` }}>
                      <p className="text-xs font-semibold mb-3" style={{ color: slide.accentColor }}>{slide.content.leftLabel}</p>
                      {slide.content.leftItems?.map((item, i) => <p key={i} className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>{item}</p>)}
                    </div>
                    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.05)", borderTop: "2px solid #555" }}>
                      <p className="text-xs font-semibold mb-3" style={{ color: "#999" }}>{slide.content.rightLabel}</p>
                      {slide.content.rightItems?.map((item, i) => <p key={i} className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>{item}</p>)}
                    </div>
                  </div>
                </div>
              )}

              {slide.type === "quiz" && (
                <div className="text-center max-w-lg">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-wider mb-3" style={{ color: slide.accentColor }}>Quick Check</p>
                  <h2 className="text-lg font-semibold mb-6" style={{ color: "#fff" }}>{slide.content.question}</h2>
                  {!showAnswer ? (<button onClick={() => setShowAnswer(true)} className="rounded-xl px-6 py-3 text-sm font-semibold" style={{ background: slide.accentColor, color: "#fff" }}>Reveal Answer</button>)
                    : (<div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${slide.accentColor}30` }}><p className="text-base" style={{ color: "#fff", lineHeight: 1.6 }}>{slide.content.answer}</p></div>)}
                </div>
              )}

              {slide.type === "summary" && (
                <div className="w-full max-w-lg">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-wider mb-2" style={{ color: slide.accentColor }}>Key Takeaways</p>
                  <h2 className="text-lg font-semibold mb-5" style={{ color: "#fff" }}>{slide.heading}</h2>
                  <div className="space-y-2">{slide.content.items?.map((item, i) => (<div key={i} className="flex items-start gap-2.5 rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.03)" }}><span className="text-sm" style={{ color: slide.accentColor }}>-</span><p className="text-sm" style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{item}</p></div>))}</div>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0" style={{ height: 3 }}><div style={{ width: `${totalProg}%`, height: "100%", background: slide.accentColor, transition: "width 0.1s linear" }} /></div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between rounded-lg p-2.5" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
            <div className="flex items-center gap-0.5">
              <button onClick={() => goToSlide(currentSlide - 1)} disabled={currentSlide <= 0} className="p-1.5 rounded-md" style={{ color: currentSlide <= 0 ? "#ddd" : "#555" }}><SkipBack className="h-4 w-4" /></button>
              <button onClick={togglePlay} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "#111", color: "#fff" }}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
              <button onClick={() => goToSlide(currentSlide + 1)} disabled={!video || currentSlide >= video.slides.length - 1} className="p-1.5 rounded-md" style={{ color: !video || currentSlide >= video.slides.length - 1 ? "#ddd" : "#555" }}><SkipForward className="h-4 w-4" /></button>
            </div>
            <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#aaa" }}>{currentSlide + 1}/{video.slides.length}</span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => { if (!isMuted) window.speechSynthesis.cancel(); setIsMuted(!isMuted); }} className="p-1.5 rounded-md" style={{ color: "#555" }}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button onClick={handleDownload} className="p-1.5 rounded-md" style={{ color: "#555" }}><Download className="h-4 w-4" /></button>
              <button onClick={handleSave} className="p-1.5 rounded-md" style={{ color: saved ? "#22c55e" : "#555" }}>
                {saved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-2">
            {video.slides.map((s, i) => (
              <button key={s.id} onClick={() => goToSlide(i)} className="shrink-0 rounded-md p-1.5 text-left transition-all" style={{
                width: 100, background: s.bgGradient ? `linear-gradient(135deg, ${s.bgGradient[0]}, ${s.bgGradient[1]})` : "#111",
                border: `2px solid ${i === currentSlide ? "#fff" : "transparent"}`, opacity: i <= currentSlide ? 1 : 0.5 }}>
                <div className="h-0.5 w-full rounded-full mb-1" style={{ background: i <= currentSlide ? s.accentColor : "rgba(255,255,255,0.1)" }} />
                <p className="text-[0.5rem] font-semibold truncate" style={{ color: "#fff" }}>{s.heading}</p>
              </button>
            ))}
          </div>

          {/* Narration */}
          <div className="mt-3 rounded-lg p-3.5" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#666" }}>Narration</p>
            <p className="text-sm" style={{ color: "#333", lineHeight: 1.6 }}>{slide.narration}</p>
          </div>

          <div className="mt-5 text-center">
            <button onClick={resetAll} className="text-xs" style={{ color: "#aaa" }}>Generate another video</button>
          </div>
        </div>
      )}

      <PageFooter />
    </div>
  );
}

export default function ExplainerVideoPage() {
  const header = <FeatureHeader title="Explainer Video" icon={<Video className="h-4 w-4" style={{ color: "#14b8a6" }} />} />;
  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      {header}
      <FeatureGate feature="explainer-video" header={header}>
        <ExplainerVideoContent />
      </FeatureGate>
    </div>
  );
}