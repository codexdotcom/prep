import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, subject, slides, totalDuration } = await req.json();

    const video = await db.savedVideo.create({
      data: {
        userId: session.user.id,
        title: title || "Untitled Video",
        subject: subject || null,
        data: { slides, totalDuration },
      },
    });

    return NextResponse.json({ id: video.id });
  } catch (error: any) {
    console.error("Save video error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}