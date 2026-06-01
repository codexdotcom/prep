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
    const query = searchParams.get("q") || "";
    const universityId = searchParams.get("universityId");

    if (universityId) {
      // Get courses for a specific university
      const courses = await db.course.findMany({
        where: { universityId, isActive: true },
        include: { university: { select: { name: true, shortName: true } } },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({ courses });
    }

    // Search universities
    const universities = await db.university.findMany({
      where: {
        isActive: true,
        OR: query
          ? [
              { name: { contains: query, mode: "insensitive" } },
              { shortName: { contains: query, mode: "insensitive" } },
              { state: { contains: query, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: {
        _count: { select: { courses: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ universities });
  } catch (error) {
    console.error("Reality search error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}