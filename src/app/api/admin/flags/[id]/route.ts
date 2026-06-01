import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status, resolution } = await req.json();

    const flag = await db.flaggedQuestion.update({
      where: { id },
      data: {
        status,
        resolution,
        resolvedBy: session.user.id,
        resolvedAt: status === "RESOLVED" || status === "DISMISSED" ? new Date() : undefined,
      },
    });

    return NextResponse.json(flag);
  } catch (error) {
    console.error("Update flag error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}