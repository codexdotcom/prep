import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "national"; // national, state, school, subject
    const subject = searchParams.get("subject");

    // Get current user's profile
    const profile = await db.studentProfile.findUnique({
      where: { userId },
    });

    // Get all users with XP and profiles for ranking
    const allUsers = await db.userXP.findMany({
      where: { totalXP: { gt: 0 } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                state: true,
                schoolName: true,
              },
            },
          },
        },
      },
      orderBy: { totalXP: "desc" },
    });

    let filtered = allUsers;

    // Filter by type
    if (type === "state" && profile?.state) {
      filtered = allUsers.filter(
        (u) => u.user.profile?.state === profile.state
      );
    } else if (type === "school" && profile?.schoolName) {
      filtered = allUsers.filter(
        (u) =>
          u.user.profile?.schoolName?.toLowerCase() ===
          profile.schoolName?.toLowerCase()
      );
    }

    // Subject ranking: rank by subject-specific accuracy
    if (type === "subject" && subject) {
      const subjectScores = await db.questionResponse.groupBy({
        by: ["userId"],
        where: {
          question: { subject: subject as any },
          session: { status: "COMPLETED" },
        },
        _count: true,
        _sum: { timeSpent: true },
      });

      // Get correct counts separately
      const correctCounts = await db.questionResponse.groupBy({
        by: ["userId"],
        where: {
          question: { subject: subject as any },
          session: { status: "COMPLETED" },
          isCorrect: true,
        },
        _count: true,
      });


      const correctMap = new Map<string, number>(
        correctCounts.map((c) => [c.userId, Number(c._count)])
      );

      const subjectRanking = subjectScores
        .filter((s) => Number(s._count) >= 10)
        .map((s) => {
          const correct = correctMap.get(s.userId) ?? 0;
          const total = Number(s._count);
          const accuracy = Math.round((correct / total) * 100);
          const user = allUsers.find((u) => u.userId === s.userId);

          return {
            userId: s.userId,
            name:
              user?.user.profile
                ? `${user.user.profile.firstName} ${user.user.profile.lastName?.charAt(0)}.`
                : user?.user.name || "Student",
            image: user?.user.image || null,
            score: accuracy,
            questionsAnswered: total,
            state: user?.user.profile?.state || null,
            school: user?.user.profile?.schoolName || null,
          };
        })
        .sort((a, b) => b.score - a.score);


      // Find current user's rank
      const myRank =
        subjectRanking.findIndex((r) => r.userId === userId) + 1;

      return NextResponse.json({
        rankings: subjectRanking.slice(0, 50),
        myRank: myRank || null,
        myScore: subjectRanking.find((r) => r.userId === userId)?.score || null,
        totalRanked: subjectRanking.length,
        type,
        subject,
        label: subject.replace(/_/g, " "),
      });
    }

    // Build ranking list
    const rankings = filtered.map((u, i) => ({
      rank: i + 1,
      userId: u.userId,
      name: u.user.profile
        ? `${u.user.profile.firstName} ${u.user.profile.lastName?.charAt(0)}.`
        : u.user.name || "Student",
      image: u.user.image || null,
      score: u.totalXP,
      level: u.level,
      state: u.user.profile?.state || null,
      school: u.user.profile?.schoolName || null,
      isCurrentUser: u.userId === userId,
    }));

    // Find current user
    const myRank = rankings.findIndex((r) => r.isCurrentUser) + 1;
    const myEntry = rankings.find((r) => r.isCurrentUser);

    // Get counts for context
    const totalInCategory = filtered.length;

    // Percentile
    const percentile =
      myRank > 0 ? Math.round(((totalInCategory - myRank) / totalInCategory) * 100) : null;

    // Labels
    const labels: Record<string, string> = {
      national: "Nigeria",
      state: profile?.state || "Your State",
      school: profile?.schoolName || "Your School",
    };

    return NextResponse.json({
      rankings: rankings.slice(0, 50),
      myRank: myRank || null,
      myScore: myEntry?.score || 0,
      myLevel: myEntry?.level || 1,
      percentile,
      totalRanked: totalInCategory,
      type,
      label: labels[type] || type,
      userState: profile?.state || null,
      userSchool: profile?.schoolName || null,
    });
  } catch (error) {
    console.error("Rankings error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}