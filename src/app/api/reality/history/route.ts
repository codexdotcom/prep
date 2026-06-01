import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checks = await db.realityCheck.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          include: { university: { select: { name: true, shortName: true } } },
        },
      },
      orderBy: { generatedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ checks });
  } catch (error) {
    console.error("Reality history error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}