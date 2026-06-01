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
    const userId = session.user.id;
    const period = (searchParams.get("period") || "WEEKLY") as "WEEKLY" | "MONTHLY" | "ALL_TIME";

    let entries;

    if (period === "ALL_TIME") {
      entries = await db.userXP.findMany({
        orderBy: { totalXP: "desc" },
        take: 50,
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      });

      const leaderboard = entries.map((e, i) => ({
        rank: i + 1,
        userId: e.userId,
        name: e.user.name || "Student",
        image: e.user.image,
        score: e.totalXP,
        level: e.level,
        isCurrentUser: e.userId === userId,
      }));

      return NextResponse.json({ leaderboard, period });
    }

    // Weekly/Monthly from leaderboard entries
    const now = new Date();
    let periodKey: string;

    if (period === "WEEKLY") {
      const weekNum = getWeekNumber(now);
      periodKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
    } else {
      periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    // Upsert current user's entry
    const userXP = await db.userXP.findUnique({ where: { userId: session.user.id } });
    const score = period === "WEEKLY" ? (userXP?.weeklyXP || 0) : (userXP?.monthlyXP || 0);

    await db.leaderboardEntry.upsert({
      where: {
        userId_period_periodKey: {
          userId: session.user.id,
          period,
          periodKey,
        },
      },
      update: { score },
      create: {
        userId: session.user.id,
        period,
        periodKey,
        score,
      },
    });

    entries = await db.leaderboardEntry.findMany({
      where: { period, periodKey },
      orderBy: { score: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    const leaderboard = entries.map((e, i) => ({
      rank: i + 1,
      userId: e.userId,
      name: e.user.name || "Student",
      image: e.user.image,
      score: e.score,
      isCurrentUser: e.userId === userId,
    }));

    return NextResponse.json({ leaderboard, period, periodKey });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}