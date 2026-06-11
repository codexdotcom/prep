import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { examId } = await req.json();

    const exam = await db.postUtmeExam.findUnique({
      where: { id: examId },
      include: {
        questions: { orderBy: { createdAt: "asc" } },
        university: { select: { name: true, shortName: true } },
      },
    });

    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const testSession = await db.postUtmeSession.create({
      data: { userId: session.user.id, examId },
    });

    return NextResponse.json({
      sessionId: testSession.id,
      exam: {
        university: exam.university.name,
        universityShort: exam.university.shortName,
        year: exam.year,
        course: exam.course,
        duration: exam.duration,
      },
      questions: exam.questions.map((q) => ({
        id: q.id,
        subject: q.subject,
        body: q.body,
        imageUrl: q.imageUrl,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
      })),
    });
  } catch (error) {
    console.error("Start post-UTME error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}