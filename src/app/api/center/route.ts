import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

// GET: Get center for current user (admin or student)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if admin
    const adminCenter = await db.tutorialCenter.findFirst({
      where: { adminId: session.user.id },
      include: {
        students: { include: { user: { select: { name: true, email: true } } }, orderBy: { joinedAt: "desc" } },
        teachers: { include: { user: { select: { name: true, email: true } } } },
        _count: { select: { students: true, teachers: true } },
      },
    });

    if (adminCenter) return NextResponse.json({ role: "admin", center: adminCenter });

    // Check if student
    const enrollment = await db.centerStudent.findFirst({
      where: { userId: session.user.id },
      include: { center: { select: { name: true, slug: true, brandColor: true, logoUrl: true } } },
    });

    if (enrollment) return NextResponse.json({ role: "student", center: enrollment.center });

    return NextResponse.json({ role: null, center: null });
  } catch (error) {
    console.error("Center error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST: Create a tutorial center
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, state, city, phone, email, brandColor } = await req.json();
    if (!name || !state || !email) return NextResponse.json({ error: "Name, state, and email required" }, { status: 400 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + `-${randomBytes(2).toString("hex")}`;

    const center = await db.tutorialCenter.create({
      data: { name, slug, state, city, phone, email, brandColor: brandColor || "#22c55e", adminId: session.user.id },
    });

    return NextResponse.json({ center }, { status: 201 });
  } catch (error) {
    console.error("Create center error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}