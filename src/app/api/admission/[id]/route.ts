import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const tracker = await db.admissionTracker.findUnique({ where: { id } });
    if (!tracker || tracker.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const oldStatus = tracker.status;
    const updateData: any = { updatedAt: new Date() };

    if (body.status) updateData.status = body.status;
    if (body.jambScore !== undefined) updateData.jambScore = body.jambScore;
    if (body.postUtmeScore !== undefined) updateData.postUtmeScore = body.postUtmeScore;
    if (body.oLevelGrades) updateData.oLevelGrades = body.oLevelGrades;
    if (body.screeningDate) updateData.screeningDate = new Date(body.screeningDate);
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updated = await db.admissionTracker.update({
      where: { id },
      data: updateData,
      include: {
        university: { select: { name: true, shortName: true } },
        course: { select: { name: true } },
      },
    });

    // Log status change
    if (body.status && body.status !== oldStatus) {
      const STATUS_LABELS: Record<string, string> = {
        AWAITING_RESULTS: "Awaiting JAMB results",
        JAMB_SUBMITTED: "JAMB score submitted",
        POST_UTME_SCHEDULED: "Post-UTME screening scheduled",
        POST_UTME_COMPLETED: "Post-UTME completed",
        SCREENING: "Under screening/review",
        MERIT_LIST: "Appeared on merit list",
        ADMITTED: "Admission offered",
        SUPPLEMENTARY: "On supplementary list",
        NOT_ADMITTED: "Not admitted",
        DEFERRED: "Admission deferred",
      };

      await db.admissionUpdate.create({
        data: {
          trackerId: id,
          title: `Status: ${STATUS_LABELS[body.status] || body.status}`,
          description: body.updateNote || `Your admission status has been updated to "${STATUS_LABELS[body.status] || body.status}".`,
          type: body.status === "ADMITTED" ? "MILESTONE" : body.status === "NOT_ADMITTED" ? "WARNING" : "INFO",
        },
      });
    }

    return NextResponse.json({ tracker: updated });
  } catch (error) {
    console.error("Update tracker error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const tracker = await db.admissionTracker.findUnique({ where: { id } });
    if (!tracker || tracker.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.admissionUpdate.deleteMany({ where: { trackerId: id } });
    await db.admissionTracker.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete tracker error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}