import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug } = await req.json();

    const center = await db.tutorialCenter.findUnique({ where: { slug } });
    if (!center || !center.isActive) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    const count = await db.centerStudent.count({ where: { centerId: center.id } });
    if (count >= center.maxStudents) return NextResponse.json({ error: "Center is full" }, { status: 400 });

    const existing = await db.centerStudent.findUnique({
      where: { centerId_userId: { centerId: center.id, userId: session.user.id } },
    });
    if (existing) return NextResponse.json({ error: "Already enrolled" }, { status: 400 });

    await db.centerStudent.create({ data: { centerId: center.id, userId: session.user.id } });

    return NextResponse.json({ ok: true, centerName: center.name });
  } catch (error) {
    console.error("Join center error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}