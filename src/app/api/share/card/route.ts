import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "score"; // score, rank, achievement, test
    const sessionId = searchParams.get("sessionId");

    const userId = session.user.id;

    const [profile, xp, streak] = await Promise.all([
      db.studentProfile.findUnique({ where: { userId } }),
      db.userXP.findUnique({ where: { userId } }),
      db.studyStreak.findUnique({ where: { userId } }),
    ]);

    const name = profile
      ? `${profile.firstName} ${profile.lastName?.charAt(0) || ""}.`
      : session.user.name || "Student";

    let cardData: any = {
      name,
      type,
      level: xp?.level || 1,
      totalXP: xp?.totalXP || 0,
      streak: streak?.currentStreak || 0,
    };

    if (type === "test" && sessionId) {
      const testSession = await db.testSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (testSession) {
        cardData.score = testSession.score || 0;
        cardData.correct = testSession.totalCorrect || 0;
        cardData.total = testSession.totalQuestions;
        cardData.accuracy = testSession.totalQuestions > 0
          ? Math.round(((testSession.totalCorrect || 0) / testSession.totalQuestions) * 100)
          : 0;
        cardData.mode = testSession.mode;
      }
    }

    if (type === "score") {
      // Get predicted score
      const responses = await db.questionResponse.findMany({
        where: { userId, session: { status: "COMPLETED" } },
        select: { isCorrect: true },
      });

      const totalCorrect = responses.filter((r) => r.isCorrect).length;
      const accuracy = responses.length > 0
        ? Math.round((totalCorrect / responses.length) * 100)
        : 0;
      cardData.predictedScore = Math.round((accuracy / 100) * 400);
      cardData.accuracy = accuracy;
      cardData.questionsAnswered = responses.length;
    }

    if (type === "rank") {
      const allUsers = await db.userXP.findMany({
        where: { totalXP: { gt: 0 } },
        orderBy: { totalXP: "desc" },
        select: { userId: true },
      });

      const rank = allUsers.findIndex((u) => u.userId === userId) + 1;
      cardData.rank = rank;
      cardData.totalStudents = allUsers.length;
      cardData.state = profile?.state;
    }

    // Generate SVG card
    const svg = generateShareSVG(cardData);

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Share card error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function generateShareSVG(data: any): string {
  const width = 600;
  const height = 340;

  const getScoreColor = (score: number) => {
    if (score >= 300) return "#a78bfa";
    if (score >= 250) return "#60a5fa";
    if (score >= 200) return "#22c55e";
    return "#fbbf24";
  };

  if (data.type === "test") {
    const scoreColor = getScoreColor(data.score || 0);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a1f0a"/>
          <stop offset="100%" style="stop-color:#0f2b0f"/>
        </linearGradient>
        <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${scoreColor};stop-opacity:0.1"/>
          <stop offset="50%" style="stop-color:${scoreColor};stop-opacity:0.05"/>
          <stop offset="100%" style="stop-color:${scoreColor};stop-opacity:0.1"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="24" fill="url(#bg)"/>
      <rect width="${width}" height="${height}" rx="24" fill="url(#glow)"/>
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="23" fill="none" stroke="${scoreColor}" stroke-opacity="0.2"/>

      <!-- Logo -->
      <text x="32" y="42" font-family="Georgia, serif" font-size="18" fill="white">Jamb<tspan fill="#22c55e">OS</tspan></text>
      <circle cx="118" cy="37" r="3" fill="#22c55e" opacity="0.8"/>

      <!-- Score -->
      <text x="${width / 2}" y="135" text-anchor="middle" font-family="Georgia, serif" font-size="72" fill="${scoreColor}" font-weight="bold">${data.score}</text>
      <text x="${width / 2}" y="160" text-anchor="middle" font-family="system-ui" font-size="13" fill="rgba(255,255,255,0.4)">Estimated JAMB Score</text>

      <!-- Stats -->
      <line x1="80" y1="190" x2="${width - 80}" y2="190" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

      <text x="130" y="225" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="white">${data.correct}</text>
      <text x="130" y="245" text-anchor="middle" font-family="system-ui" font-size="11" fill="rgba(255,255,255,0.4)">Correct</text>

      <text x="${width / 2}" y="225" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="white">${data.accuracy}%</text>
      <text x="${width / 2}" y="245" text-anchor="middle" font-family="system-ui" font-size="11" fill="rgba(255,255,255,0.4)">Accuracy</text>

      <text x="${width - 130}" y="225" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="white">${data.total}</text>
      <text x="${width - 130}" y="245" text-anchor="middle" font-family="system-ui" font-size="11" fill="rgba(255,255,255,0.4)">Questions</text>

      <!-- Name + CTA -->
      <text x="32" y="300" font-family="system-ui" font-size="14" fill="rgba(255,255,255,0.6)" font-weight="600">${escapeXml(data.name)}</text>
      <text x="${width - 32}" y="300" text-anchor="end" font-family="system-ui" font-size="11" fill="#22c55e">jambos.ng</text>

      <!-- Level badge -->
      <rect x="${width - 90}" y="22" width="58" height="26" rx="13" fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.2)"/>
      <text x="${width - 61}" y="40" text-anchor="middle" font-family="system-ui" font-size="11" fill="#22c55e" font-weight="600">Lv ${data.level}</text>
    </svg>`;
  }

  if (data.type === "rank") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a1f0a"/>
          <stop offset="100%" style="stop-color:#0f2b0f"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="24" fill="url(#bg)"/>
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="23" fill="none" stroke="rgba(34,197,94,0.2)"/>

      <text x="32" y="42" font-family="Georgia, serif" font-size="18" fill="white">Jamb<tspan fill="#22c55e">OS</tspan></text>
      <circle cx="118" cy="37" r="3" fill="#22c55e" opacity="0.8"/>

      <!-- Rank -->
      <text x="${width / 2}" y="100" text-anchor="middle" font-family="system-ui" font-size="13" fill="rgba(255,255,255,0.4)">National Ranking</text>
      <text x="${width / 2}" y="160" text-anchor="middle" font-family="Georgia, serif" font-size="80" fill="#22c55e" font-weight="bold">#${data.rank}</text>
      <text x="${width / 2}" y="190" text-anchor="middle" font-family="system-ui" font-size="14" fill="rgba(255,255,255,0.5)">out of ${data.totalStudents?.toLocaleString()} students</text>

      <!-- Stats -->
      <line x1="80" y1="215" x2="${width - 80}" y2="215" stroke="rgba(255,255,255,0.08)"/>

      <text x="170" y="250" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="white">${data.totalXP?.toLocaleString()}</text>
      <text x="170" y="268" text-anchor="middle" font-family="system-ui" font-size="11" fill="rgba(255,255,255,0.4)">Total XP</text>

      <text x="${width / 2}" y="250" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="white">Lv ${data.level}</text>
      <text x="${width / 2}" y="268" text-anchor="middle" font-family="system-ui" font-size="11" fill="rgba(255,255,255,0.4)">Level</text>

      <text x="${width - 170}" y="250" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#fbbf24">${data.streak} 🔥</text>
      <text x="${width - 170}" y="268" text-anchor="middle" font-family="system-ui" font-size="11" fill="rgba(255,255,255,0.4)">Day Streak</text>

      <text x="32" y="310" font-family="system-ui" font-size="14" fill="rgba(255,255,255,0.6)" font-weight="600">${escapeXml(data.name)}${data.state ? ` · ${data.state}` : ""}</text>
      <text x="${width - 32}" y="310" text-anchor="end" font-family="system-ui" font-size="11" fill="#22c55e">jamb.os</text>
    </svg>`;
  }

  // Default: score card
  const scoreColor = getScoreColor(data.predictedScore || 0);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0a1f0a"/>
        <stop offset="100%" style="stop-color:#0f2b0f"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" rx="24" fill="url(#bg)"/>
    <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="23" fill="none" stroke="${scoreColor}" stroke-opacity="0.2"/>

    <text x="32" y="42" font-family="Georgia, serif" font-size="18" fill="white">Jamb<tspan fill="#22c55e">OS</tspan></text>
    <circle cx="118" cy="37" r="3" fill="#22c55e" opacity="0.8"/>

    <text x="${width / 2}" y="100" text-anchor="middle" font-family="system-ui" font-size="13" fill="rgba(255,255,255,0.4)">My Predicted JAMB Score</text>
    <text x="${width / 2}" y="165" text-anchor="middle" font-family="Georgia, serif" font-size="80" fill="${scoreColor}" font-weight="bold">${data.predictedScore || 0}</text>
    <text x="${width / 2}" y="190" text-anchor="middle" font-family="system-ui" font-size="13" fill="rgba(255,255,255,0.4)">out of 400</text>

    <line x1="80" y1="215" x2="${width - 80}" y2="215" stroke="rgba(255,255,255,0.08)"/>

    <text x="170" y="250" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="white">${data.accuracy || 0}%</text>
    <text x="170" y="268" text-anchor="middle" font-family="system-ui" font-size="11" fill="rgba(255,255,255,0.4)">Accuracy</text>

    <text x="${width / 2}" y="250" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="white">${data.questionsAnswered || 0}</text>
    <text x="${width / 2}" y="268" text-anchor="middle" font-family="system-ui" font-size="11" fill="rgba(255,255,255,0.4)">Questions</text>

    <text x="${width - 170}" y="250" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#fbbf24">${data.streak} 🔥</text>
    <text x="${width - 170}" y="268" text-anchor="middle" font-family="system-ui" font-size="11" fill="rgba(255,255,255,0.4)">Day Streak</text>

    <text x="32" y="310" font-family="system-ui" font-size="14" fill="rgba(255,255,255,0.6)" font-weight="600">${escapeXml(data.name)} · Level ${data.level}</text>
    <text x="${width - 32}" y="310" text-anchor="end" font-family="system-ui" font-size="11" fill="#22c55e">jamb.os</text>
  </svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}