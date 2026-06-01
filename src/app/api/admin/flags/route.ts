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
    const status = searchParams.get("status") || "OPEN";

    const flags = await db.flaggedQuestion.findMany({
      where: { status: status as any },
      include: {
        question: {
          select: {
            id: true,
            body: true,
            subject: true,
            correctOption: true,
            topic: { select: { name: true } },
          },
        },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const counts = await db.flaggedQuestion.groupBy({
      by: ["status"],
      _count: true,
    });

    const statusCounts: Record<string, number> = {};
    counts.forEach((c) => { statusCounts[c.status] = c._count; });

    return NextResponse.json({ flags, statusCounts });
  } catch (error) {
    console.error("Flags error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}