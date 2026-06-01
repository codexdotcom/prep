import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    const testSession = await db.testSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
      include: {
        responses: {
          include: {
            question: {
              include: {
                topic: { select: { name: true } },
              },
            },
          },
          orderBy: { answeredAt: "asc" },
        },
      },
    });

    if (!testSession) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(testSession);
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}