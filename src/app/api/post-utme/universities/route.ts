import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const universities = await db.university.findMany({
      where: {
        isActive: true,
        ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      },
      include: {
        _count: { select: { postUtmeExams: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      universities: universities.map((u) => ({
        id: u.id,
        name: u.name,
        shortName: u.shortName,
        state: u.state,
        type: u.type,
        examCount: u._count.postUtmeExams,
      })),
    });
  } catch (error) {
    console.error("Post-UTME universities error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}