"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, CheckCircle2, XCircle, Brain, Flame,
  Zap, ArrowUp, ArrowDown, Eye, EyeOff, Home,
  Download, ChevronDown, Share2, Target,
} from "lucide-react";
import { jsPDF } from "jspdf";

interface SubjectScore {
  subject: string; correct: number; total: number; answered: number; accuracy: number; score: number;
}
interface TopicInsight {
  topicId: string; topicName: string; subject: string; before: number; after: number;
  correct: number; total: number; mastered: boolean; needsWork: boolean;
}
interface DifficultyProfile {
  easy: number; medium: number; hard: number;
  easyCorrect: number; mediumCorrect: number; hardCorrect: number;
}
interface ReviewItem {
  id: string; subject?: string; topicName: string; body: string; imageUrl?: string | null;
  optionA: string; optionB: string; optionC: string; optionD: string;
  correctOption: string; selectedOption: string | null; isCorrect: boolean;
  explanation: string | null; explanationImageUrl: string | null; difficulty?: string;
}
interface ExamReportProps {
  score: number;
  totalCorrect: number;
  totalAnswered: number;
  totalQuestions: number;
  subjectScores: SubjectScore[];
  topicInsights: TopicInsight[];
  difficultyProfile: DifficultyProfile;
  review: ReviewItem[];
  renderText: (text: string) => string;
}

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const accColor = (a: number) => a >= 70 ? "#22c55e" : a >= 50 ? "#f59e0b" : "#ef4444";

function getVerdict(score: number): { title: string; body: string; cta: string } {
  if (score >= 350) return {
    title: "You just scored what 97% of JAMB candidates cannot.",
    body: "350+ puts you in the top 3% nationally. Medicine at UNILAG, Law at OAU, Engineering at Covenant. Not dreams. Options. One more mock to stay sharp, then go collect your future.",
    cta: "Stay sharp. Take another mock.",
  };
  if (score >= 300) return {
    title: "300+ is not luck. This is proof.",
    body: "You just outscored a quarter million candidates. The gap between 300 and 350 is about two more correct answers per subject. That is 8 questions total. Look at the weak topics below. Fix those, and 350 is inevitable.",
    cta: "Close the gap to 350",
  };
  if (score >= 250) return {
    title: "250 opens doors. 300 kicks them down.",
    body: "You are above the national average, but your dream course wants more. Students who score 250 on their first mock and drill weak topics daily hit 300+ within two weeks. Not months. Weeks. The topics are listed below. The decision is yours.",
    cta: "Drill the topics costing you points",
  };
  if (score >= 200) return {
    title: "You have the foundation. Now stack the reps.",
    body: "200 means you get the core concepts. What separates you from 300+ is not intelligence, it is repetition. Students at your level who answer 30 questions a day for 14 days consistently jump 70 to 100 points. That is data from 12,000 JambOS users.",
    cta: "Start your 14-day streak today",
  };
  if (score >= 150) return {
    title: "This mock just showed you the map.",
    body: "150 on a first mock is exactly where thousands of students who eventually scored 280+ started. The difference? They looked at the breakdown below, found their 3 weakest topics, and drilled those first. Do that, come back in a week. You will not recognize your score.",
    cta: "Attack your 3 weakest topics",
  };
  return {
    title: "Most students never take a full mock. You just did.",
    body: "That alone puts you ahead. Your score right now does not define you. What matters is the map below. Every topic with a red dot is a specific, fixable gap. Fix 3 of them and retake this mock. The jump will surprise you.",
    cta: "Start with 10 questions",
  };
}

export function ExamReport({
  score, totalCorrect, totalAnswered, totalQuestions, subjectScores,
  topicInsights, difficultyProfile, review, renderText,
}: ExamReportProps) {
  const router = useRouter();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct" | "skipped">("all");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const verdict = getVerdict(score);
  const scoreColor = accColor(score >= 250 ? 70 : score >= 180 ? 50 : 30);

  useEffect(() => {
    let v = 0;
    const step = score / 90;
    const t = setInterval(() => {
      v += step;
      if (v >= score) { setAnimatedScore(score); clearInterval(t); }
      else setAnimatedScore(Math.round(v));
    }, 16);
    return () => clearInterval(t);
  }, [score]);

  const topicsBySubject: Record<string, TopicInsight[]> = {};
  for (const t of topicInsights) {
    if (!topicsBySubject[t.subject]) topicsBySubject[t.subject] = [];
    topicsBySubject[t.subject].push(t);
  }

  const diffEasyAcc = difficultyProfile.easy > 0 ? Math.round((difficultyProfile.easyCorrect / difficultyProfile.easy) * 100) : 0;
  const diffMedAcc = difficultyProfile.medium > 0 ? Math.round((difficultyProfile.mediumCorrect / difficultyProfile.medium) * 100) : 0;
  const diffHardAcc = difficultyProfile.hard > 0 ? Math.round((difficultyProfile.hardCorrect / difficultyProfile.hard) * 100) : 0;

  const improved = topicInsights.filter((t) => t.after > t.before).length;
  const declined = topicInsights.filter((t) => t.after < t.before).length;
  const mastered = topicInsights.filter((t) => t.mastered).length;
  const needsWork = topicInsights.filter((t) => t.needsWork).length;
  const missedEasy = difficultyProfile.easy - difficultyProfile.easyCorrect;
  const overallAcc = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const ringSize = 140;
  const ringR = (ringSize - 16) / 2;
  const ringCirc = 2 * Math.PI * ringR;
  const ringPct = Math.min((score / 400) * 100, 100);
  const ringOffset = ringCirc - (ringPct / 100) * ringCirc;

  // ─── Share Image via Canvas ───
  const generateShareImage = useCallback(async () => {
    setGeneratingImage(true);
    try {
      const canvas = document.createElement("canvas");
      const w = 1080; const h = 1350;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, w, h);
      const grd = ctx.createLinearGradient(0, 0, w, h);
      grd.addColorStop(0, "rgba(34,197,94,0.05)");
      grd.addColorStop(1, "rgba(139,92,246,0.03)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px -apple-system, sans-serif";
      ctx.fillText("JambOS", 60, 80);
      ctx.fillStyle = "#666666";
      ctx.font = "14px -apple-system, sans-serif";
      ctx.fillText("MOCK EXAM RESULT", 60, 108);

      ctx.fillStyle = "#444444";
      ctx.textAlign = "right";
      ctx.fillText(new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }), w - 60, 80);
      ctx.textAlign = "left";

      const cx = w / 2; const cy = 330; const cr = 125;
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.strokeStyle = "#222222"; ctx.lineWidth = 12; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, cr, -Math.PI / 2, -Math.PI / 2 + (ringPct / 100) * Math.PI * 2);
      ctx.strokeStyle = scoreColor; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.stroke();

      ctx.fillStyle = scoreColor;
      ctx.font = "bold 80px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${score}`, cx, cy + 18);
      ctx.fillStyle = "#555555";
      ctx.font = "18px -apple-system, sans-serif";
      ctx.fillText("out of 400", cx, cy + 52);
      ctx.font = "15px -apple-system, sans-serif";
      ctx.fillStyle = "#777777";
      ctx.fillText(`${totalCorrect} correct  ·  ${overallAcc}% accuracy`, cx, cy + 95);
      ctx.textAlign = "left";

      let barY = 530;
      for (const ss of subjectScores) {
        ctx.fillStyle = "#cccccc";
        ctx.font = "16px -apple-system, sans-serif";
        ctx.fillText(fmt(ss.subject), 60, barY);
        ctx.textAlign = "right";
        ctx.fillStyle = accColor(ss.accuracy);
        ctx.font = "bold 16px -apple-system, monospace";
        ctx.fillText(`${ss.correct}/${ss.total}`, w - 60, barY);
        ctx.textAlign = "left";
        barY += 14;
        ctx.fillStyle = "#222222";
        ctx.beginPath(); ctx.roundRect(60, barY, w - 120, 6, 3); ctx.fill();
        ctx.fillStyle = accColor(ss.accuracy);
        ctx.beginPath(); ctx.roundRect(60, barY, Math.max(3, (ss.correct / ss.total) * (w - 120)), 6, 3); ctx.fill();
        barY += 38;
      }

      barY += 15;
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath(); ctx.roundRect(60, barY, w - 120, 70, 12); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px -apple-system, sans-serif";
      ctx.fillText("AI Analysis", 85, barY + 28);
      ctx.fillStyle = "#888888";
      ctx.font = "14px -apple-system, sans-serif";
      ctx.fillText(`${mastered} mastered  ·  ${needsWork} need work  ·  ${improved} improved`, 85, barY + 50);

      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 18px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Prepare smarter with JambOS", cx, h - 70);
      ctx.fillStyle = "#444444";
      ctx.font = "14px -apple-system, sans-serif";
      ctx.fillText("jambos.ng", cx, h - 42);
      ctx.textAlign = "left";

      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
      const file = new File([blob], `JambOS-Score-${score}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `I scored ${score}/400 on JambOS!`,
          text: `Just scored ${score}/400 on my JAMB mock exam. ${overallAcc}% accuracy. Preparing smarter with JambOS.`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `JambOS-Score-${score}.png`;
        a.click(); URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Share error:", err);
    } finally {
      setGeneratingImage(false);
    }
  }, [score, totalCorrect, totalQuestions, overallAcc, subjectScores, mastered, needsWork, improved, ringPct, scoreColor]);

  // ─── PDF Report ───
  const generatePDF = useCallback(() => {
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pw = 210; const margin = 16; const cw = pw - margin * 2;
      let y = 20;
      const addPage = () => { doc.addPage(); y = 20; };
      const checkPage = (need: number) => { if (y + need > 275) addPage(); };

      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, pw, 42, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24); doc.setFont("helvetica", "bold");
      doc.text("JambOS", margin, 18);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text("Mock Exam Report", margin, 26);
      doc.setFontSize(8);
      doc.text(new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }), margin, 33);

      const sc = score >= 250 ? [34, 197, 94] : score >= 180 ? [245, 158, 11] : [239, 68, 68];
      doc.setTextColor(sc[0], sc[1], sc[2]);
      doc.setFontSize(52); doc.setFont("helvetica", "bold");
      doc.text(`${score}`, pw - margin, 30, { align: "right" });
      doc.setFontSize(10); doc.setTextColor(120, 120, 120);
      doc.text("/ 400", pw - margin, 38, { align: "right" });
      y = 52;

      doc.setTextColor(100, 100, 100); doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`${totalCorrect} correct  |  ${totalAnswered} attempted  |  ${totalQuestions - totalAnswered} skipped  |  ${overallAcc}% accuracy`, margin, y);
      y += 12;

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y, cw, 24, 3, 3, "F");
      doc.setTextColor(17, 17, 17); doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text(verdict.title, margin + 6, y + 8);
      doc.setTextColor(120, 120, 120); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
      const vLines = doc.splitTextToSize(verdict.body, cw - 12);
      doc.text(vLines.slice(0, 3), margin + 6, y + 14);
      y += 30;

      doc.setTextColor(17, 17, 17); doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text("Subject Breakdown", margin, y); y += 8;

      for (const ss of subjectScores) {
        checkPage(18);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(margin, y, cw, 14, 2, 2, "F");
        doc.setTextColor(50, 50, 50); doc.setFontSize(9); doc.setFont("helvetica", "bold");
        doc.text(fmt(ss.subject), margin + 4, y + 6);
        doc.setTextColor(100, 100, 100); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text(`${ss.accuracy}%`, margin + 4, y + 11);
        doc.setTextColor(17, 17, 17); doc.setFontSize(12); doc.setFont("helvetica", "bold");
        doc.text(`${ss.correct}/${ss.total}`, pw - margin - 4, y + 8, { align: "right" });

        const barX = margin + cw * 0.52; const barW = cw * 0.28;
        doc.setFillColor(235, 235, 235);
        doc.roundedRect(barX, y + 5, barW, 3, 1.5, 1.5, "F");
        const clr = ss.accuracy >= 70 ? [34, 197, 94] : ss.accuracy >= 50 ? [245, 158, 11] : [239, 68, 68];
        doc.setFillColor(clr[0], clr[1], clr[2]);
        doc.roundedRect(barX, y + 5, Math.max(1, (ss.score / 100) * barW), 3, 1.5, 1.5, "F");
        y += 17;
      }
      y += 5;

      checkPage(15);
      doc.setTextColor(17, 17, 17); doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text("Topic Analysis", margin, y); y += 8;

      for (const [subject, topics] of Object.entries(topicsBySubject)) {
        checkPage(12);
        doc.setTextColor(130, 130, 130); doc.setFontSize(7); doc.setFont("helvetica", "bold");
        doc.text(fmt(subject).toUpperCase(), margin, y); y += 5;

        for (const t of topics.sort((a, b) => (a.correct / Math.max(a.total, 1)) - (b.correct / Math.max(b.total, 1)))) {
          checkPage(7);
          const topicAcc = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
          const change = t.after - t.before;
          doc.setTextColor(70, 70, 70); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
          doc.text(t.topicName, margin + 3, y);
          doc.text(`${t.correct}/${t.total}`, margin + cw * 0.6, y, { align: "right" });
          const tc = topicAcc >= 70 ? [34, 197, 94] : topicAcc >= 50 ? [245, 158, 11] : [239, 68, 68];
          doc.setTextColor(tc[0], tc[1], tc[2]);
          doc.text(`${topicAcc}%`, margin + cw * 0.72, y, { align: "right" });
          if (change !== 0) {
            const cc = change > 0 ? [34, 197, 94] : [239, 68, 68];
            doc.setTextColor(cc[0], cc[1], cc[2]);
            doc.text(`${change > 0 ? "+" : ""}${change}`, margin + cw * 0.84, y, { align: "right" });
          }
          if (t.mastered || t.needsWork) {
            const lc = t.mastered ? [34, 197, 94] : [239, 68, 68];
            doc.setTextColor(lc[0], lc[1], lc[2]);
            doc.setFontSize(5.5); doc.setFont("helvetica", "bold");
            doc.text(t.mastered ? "MASTERED" : "NEEDS WORK", pw - margin - 3, y, { align: "right" });
          }
          y += 5.5;
        }
        y += 3;
      }

      checkPage(28); y += 3;
      doc.setTextColor(17, 17, 17); doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text("Difficulty Breakdown", margin, y); y += 8;
      for (const d of [
        { label: "Easy", count: difficultyProfile.easy, correct: difficultyProfile.easyCorrect, acc: diffEasyAcc },
        { label: "Medium", count: difficultyProfile.medium, correct: difficultyProfile.mediumCorrect, acc: diffMedAcc },
        { label: "Hard", count: difficultyProfile.hard, correct: difficultyProfile.hardCorrect, acc: diffHardAcc },
      ]) {
        doc.setTextColor(80, 80, 80); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text(d.label, margin + 4, y);
        doc.setFillColor(235, 235, 235);
        doc.roundedRect(margin + 28, y - 3, cw * 0.5, 4, 2, 2, "F");
        const dc = d.acc >= 70 ? [34, 197, 94] : d.acc >= 50 ? [245, 158, 11] : [239, 68, 68];
        doc.setFillColor(dc[0], dc[1], dc[2]);
        doc.roundedRect(margin + 28, y - 3, Math.max(1, (d.acc / 100) * cw * 0.5), 4, 2, 2, "F");
        doc.setTextColor(17, 17, 17); doc.setFont("helvetica", "bold");
        doc.text(`${d.correct}/${d.count} (${d.acc}%)`, pw - margin - 4, y, { align: "right" });
        y += 8;
      }

      checkPage(22); y += 5;
      doc.setFillColor(17, 17, 17);
      doc.roundedRect(margin, y, cw, 18, 3, 3, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text("Learning Summary", margin + 6, y + 7);
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
      doc.text(`${mastered} mastered  |  ${needsWork} need work  |  ${improved} improved  |  ${declined} declined`, margin + 6, y + 13);

      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setTextColor(180, 180, 180); doc.setFontSize(7);
        doc.text(`JambOS Mock Exam Report  |  Page ${i} of ${pages}  |  ${new Date().toLocaleString("en-NG")}`, pw / 2, 290, { align: "center" });
      }

      doc.save(`JambOS-Report-${score}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setGeneratingPdf(false);
    }
  }, [score, totalCorrect, totalAnswered, totalQuestions, overallAcc, subjectScores, topicInsights, difficultyProfile, verdict, mastered, needsWork, improved, declined, topicsBySubject, diffEasyAcc, diffMedAcc, diffHardAcc]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* ─── Score ─── */}
      <div className="rounded-2xl p-8 mb-3 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
        <div className="relative inline-flex items-center justify-center mb-4">
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke="#f3f3f3" strokeWidth="8" />
            <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={ringCirc} strokeDashoffset={ringOffset} transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "3rem", color: scoreColor, lineHeight: 1, letterSpacing: "-0.02em" }}>{animatedScore}</span>
            <span className="text-xs mt-1" style={{ color: "#bbb", letterSpacing: "0.1em" }}>OF 400</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 text-sm" style={{ color: "#777" }}>
          <span><strong style={{ color: "#333" }}>{totalCorrect}</strong> correct</span>
          <span style={{ color: "#eee" }}>|</span>
          <span><strong style={{ color: "#333" }}>{overallAcc}%</strong> accuracy</span>
          <span style={{ color: "#eee" }}>|</span>
          <span><strong style={{ color: "#333" }}>{totalQuestions - totalAnswered}</strong> skipped</span>
        </div>
      </div>

      {/* ─── Verdict ─── */}
      <div className="rounded-2xl p-5 mb-3" style={{ background: "#111" }}>
        <p className="text-base font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "#fff", lineHeight: 1.35 }}>{verdict.title}</p>
        <p className="text-sm leading-[1.7]" style={{ color: "#999" }}>{verdict.body}</p>
      </div>

      {/* ─── Subject Breakdown ─── */}
      <div className="rounded-2xl p-5 mb-3" style={{ background: "#fff", border: "1px solid #eee" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#bbb" }}>Subject Breakdown</p>
        <div className="space-y-4">
          {subjectScores.map((ss) => {
            const isExpanded = expandedSubject === ss.subject;
            const subjectTopics = topicsBySubject[ss.subject] || [];
            return (
              <div key={ss.subject}>
                <button onClick={() => setExpandedSubject(isExpanded ? null : ss.subject)} className="w-full text-left group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: "#222" }}>{fmt(ss.subject)}</p>
                      {subjectTopics.length > 0 && (
                        <ChevronDown className="h-3 w-3 transition-transform" style={{ color: "#ccc", transform: isExpanded ? "rotate(180deg)" : "none" }} />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)", color: accColor(ss.accuracy) }}>{ss.correct}</span>
                      <span className="text-xs" style={{ color: "#ccc" }}>/ {ss.total}</span>
                    </div>
                  </div>
                  <div style={{ height: "4px", borderRadius: "9999px", background: "#f0f0f0" }}>
                    <div style={{ width: `${ss.score}%`, height: "100%", borderRadius: "9999px", background: accColor(ss.accuracy), transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                  </div>
                </button>

                {isExpanded && subjectTopics.length > 0 && (
                  <div className="mt-3 space-y-1" style={{ animation: "fadeSlideUp 0.2s ease" }}>
                    {subjectTopics
                      .sort((a, b) => (a.correct / Math.max(a.total, 1)) - (b.correct / Math.max(b.total, 1)))
                      .map((t) => {
                        const topicAcc = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
                        const change = t.after - t.before;
                        return (
                          <div key={t.topicId} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: "#fafafa" }}>
                            <div className="h-2 w-2 rounded-full shrink-0" style={{ background: t.mastered ? "#22c55e" : t.needsWork ? "#ef4444" : topicAcc >= 50 ? "#f59e0b" : "#ddd" }} />
                            <p className="flex-1 text-sm truncate" style={{ color: "#333" }}>{t.topicName}</p>
                            <span className="text-xs tabular-nums shrink-0" style={{ fontFamily: "var(--font-mono)", color: "#bbb" }}>{t.correct}/{t.total}</span>
                            <span className="text-sm font-bold tabular-nums w-10 text-right shrink-0" style={{ fontFamily: "var(--font-mono)", color: accColor(topicAcc) }}>{topicAcc}%</span>
                            {change !== 0 && (
                              <span className="text-xs font-semibold tabular-nums w-8 text-right shrink-0 flex items-center justify-end gap-0.5" style={{ color: change > 0 ? "#22c55e" : "#ef4444" }}>
                                {change > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                                {Math.abs(change)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Difficulty ─── */}
      <div className="rounded-2xl p-5 mb-3" style={{ background: "#fff", border: "1px solid #eee" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#bbb" }}>Difficulty Breakdown</p>
        <div className="space-y-3">
          {[
            { label: "Easy", count: difficultyProfile.easy, correct: difficultyProfile.easyCorrect, acc: diffEasyAcc },
            { label: "Medium", count: difficultyProfile.medium, correct: difficultyProfile.mediumCorrect, acc: diffMedAcc },
            { label: "Hard", count: difficultyProfile.hard, correct: difficultyProfile.hardCorrect, acc: diffHardAcc },
          ].map((d) => (
            <div key={d.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm" style={{ color: "#555" }}>{d.label}</span>
                <span className="text-sm font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)", color: accColor(d.acc) }}>{d.correct}/{d.count}</span>
              </div>
              <div style={{ height: "4px", borderRadius: "9999px", background: "#f0f0f0" }}>
                <div style={{ width: `${d.acc}%`, height: "100%", borderRadius: "9999px", background: accColor(d.acc) }} />
              </div>
            </div>
          ))}
        </div>
        {missedEasy > 3 && difficultyProfile.easy > 5 && (
          <p className="text-sm mt-4 leading-relaxed" style={{ color: "#666" }}>
            You missed <strong style={{ color: "#ef4444" }}>{missedEasy} easy questions</strong>. These are the highest-value fixes. Each one is worth 2.2 JAMB points for minimal effort.
          </p>
        )}
      </div>

      {/* ─── AI Summary ─── */}
      <div className="rounded-2xl p-5 mb-3" style={{ background: "#fff", border: "1px solid #eee" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#bbb" }}>AI Learning Summary</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Mastered", value: mastered, color: "#22c55e" },
            { label: "Need work", value: needsWork, color: "#ef4444" },
            { label: "Improved", value: improved, color: "#22c55e" },
            { label: "Declined", value: declined, color: "#888" },
          ].map((s) => (
            <div key={s.label} className="text-center py-2">
              <p className="text-xl font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)", color: s.color }}>{s.value}</p>
              <p className="text-[0.6875rem]" style={{ color: "#aaa" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {needsWork > 0 && (
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid #f5f5f5" }}>
            <p className="text-sm font-bold mb-2" style={{ color: "#222" }}>Fix these first for the biggest score jump</p>
            {topicInsights.filter((t) => t.needsWork).slice(0, 3).map((t) => (
              <div key={t.topicId} className="flex items-center gap-3 py-1.5">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: "#ef4444" }} />
                <p className="flex-1 text-sm" style={{ color: "#555" }}>{t.topicName} <span style={{ color: "#bbb" }}>({fmt(t.subject)})</span></p>
                <span className="text-sm font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "#ef4444" }}>{Math.round(t.after)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* ─── Actions ─── */}
      <div className="space-y-2 mb-3">
        <button onClick={() => needsWork > 0 ? router.push("/practice/weak") : router.push("/practice/mock")}
          className="w-full rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          style={{ background: "#22c55e", color: "#fff" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#16a34a"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#22c55e"; }}>
          <Target className="h-4 w-4" /> {verdict.cta}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={generateShareImage} disabled={generatingImage}
            className="rounded-xl py-3 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
            style={{ background: "#fff", border: "1px solid #eee", color: "#555" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#22c55e30"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#eee"; }}>
            <Share2 className="h-4 w-4" />
            {generatingImage ? "..." : "Share"}
          </button>
          <button onClick={generatePDF} disabled={generatingPdf}
            className="rounded-xl py-3 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
            style={{ background: "#fff", border: "1px solid #eee", color: "#555" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#22c55e30"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#eee"; }}>
            <Download className="h-4 w-4" />
            {generatingPdf ? "..." : "PDF"}
          </button>
          <button onClick={() => router.push("/dashboard")}
            className="rounded-xl py-3 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
            style={{ background: "#fff", border: "1px solid #eee", color: "#555" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#22c55e30"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#eee"; }}>
            <Home className="h-4 w-4" />
            Home
          </button>
        </div>
      </div>

      {/* ─── Review ─── */}
      <button onClick={() => setShowReview(!showReview)}
        className="w-full rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 mb-3 transition-colors"
        style={{ background: "#fff", border: "1px solid #eee", color: "#555" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}>
        {showReview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {showReview ? "Hide Answer Review" : `Review All ${totalQuestions} Answers`}
      </button>

      {showReview && (
        <div>
          <div className="flex gap-1 mb-4 p-0.5 rounded-xl" style={{ background: "#f5f5f5" }}>
            {(["all", "wrong", "correct", "skipped"] as const).map((f) => {
              const counts = { all: totalQuestions, wrong: totalAnswered - totalCorrect, correct: totalCorrect, skipped: totalQuestions - totalAnswered };
              return (
                <button key={f} onClick={() => setReviewFilter(f)}
                  className="flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition-all"
                  style={{ background: reviewFilter === f ? "#fff" : "transparent", color: reviewFilter === f ? "#111" : "#aaa", boxShadow: reviewFilter === f ? "0 1px 4px rgba(0,0,0,0.06)" : "none" }}>
                  {f} ({counts[f]})
                </button>
              );
            })}
          </div>

          <div className="space-y-2.5">
            {review
              .filter((r) => reviewFilter === "all" || (reviewFilter === "correct" ? r.isCorrect : reviewFilter === "wrong" ? (r.selectedOption && !r.isCorrect) : !r.selectedOption))
              .map((r) => (
                <div key={r.id} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                      style={{ background: r.isCorrect ? "#f0fdf4" : r.selectedOption ? "#fef2f2" : "#f9f9f9", color: r.isCorrect ? "#22c55e" : r.selectedOption ? "#ef4444" : "#ccc" }}>
                      {r.isCorrect ? "✓" : r.selectedOption ? "✗" : "·"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {r.subject && <span className="text-xs font-semibold" style={{ color: "#888" }}>{fmt(r.subject)}</span>}
                        {r.topicName && <span className="text-xs" style={{ color: "#ccc" }}>· {r.topicName}</span>}
                        {r.difficulty && (
                          <span className="text-[0.625rem]" style={{ color: r.difficulty === "EASY" ? "#22c55e" : r.difficulty === "HARD" ? "#ef4444" : "#f59e0b" }}>
                            {r.difficulty.charAt(0) + r.difficulty.slice(1).toLowerCase()}
                          </span>
                        )}
                      </div>
                      {r.imageUrl && (
                        <div className="rounded-lg overflow-hidden mb-2.5" style={{ border: "1px solid #f3f3f3" }}>
                          <img src={r.imageUrl} alt="" className="max-h-44 object-contain mx-auto p-2" />
                        </div>
                      )}
                      <div className="text-sm leading-relaxed" style={{ color: "#222" }} dangerouslySetInnerHTML={{ __html: renderText(r.body) }} />
                    </div>
                  </div>

                  <div className="space-y-1 ml-8">
                    {(["A", "B", "C", "D"] as const).map((key) => {
                      const text = (r as any)[`option${key}`];
                      const isCorrect = r.correctOption === key;
                      const isSelected = r.selectedOption === key;
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm py-1.5 px-2.5 rounded-lg"
                          style={{ background: isCorrect ? "#f0fdf4" : isSelected ? "#fef2f2" : "transparent" }}>
                          <span className="font-bold w-4" style={{ fontFamily: "var(--font-mono)", color: isCorrect ? "#22c55e" : isSelected ? "#ef4444" : "#ddd" }}>{key}</span>
                          <span className="flex-1" style={{ color: isCorrect ? "#166534" : "#444" }} dangerouslySetInnerHTML={{ __html: renderText(text) }} />
                          {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#22c55e" }} />}
                          {isSelected && !isCorrect && <XCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "#ef4444" }} />}
                        </div>
                      );
                    })}
                  </div>

                  {r.explanation && (
                    <div className="mt-3 ml-8 rounded-lg p-3" style={{ background: "#fafafa", border: "1px solid #f3f3f3" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#aaa" }}>Explanation</p>
                      <div className="text-sm leading-relaxed" style={{ color: "#555" }} dangerouslySetInnerHTML={{ __html: renderText(r.explanation) }} />
                      {r.explanationImageUrl && <img src={r.explanationImageUrl} alt="" className="mt-2 rounded-lg max-h-40 object-contain" />}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <style jsx global>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}