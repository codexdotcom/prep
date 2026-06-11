import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAIResponse } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { trackerId } = await req.json();

    const tracker = await db.admissionTracker.findUnique({
      where: { id: trackerId },
      include: {
        university: true,
        course: true,
      },
    });

    if (!tracker || tracker.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const prompt = `You are a Nigerian university admissions expert. Analyze this student's admission chances:

University: ${tracker.university.name} (${tracker.university.state})
Course: ${tracker.course.name}
JAMB Score: ${tracker.jambScore || "Not submitted"}
Post-UTME Score: ${tracker.postUtmeScore || "Not taken"}
Cutoff Score: ${tracker.course.cutoffScore || "Unknown"}
O-Level Grades: ${tracker.oLevelGrades ? JSON.stringify(tracker.oLevelGrades) : "Not provided"}
Current Status: ${tracker.status}

Provide a brief analysis covering:
1. Overall admission probability (percentage)
2. Key strengths
3. Potential risks
4. Recommended next steps
5. Timeline estimate

Keep it concise and actionable. Respond ONLY with valid JSON:
{"probability":70,"strengths":["..."],"risks":["..."],"nextSteps":["..."],"timeline":"...","summary":"..."}`;

    const { text } = await generateAIResponse(
      "You are an admissions advisor. Respond only with valid JSON.",
      [{ role: "user", content: prompt }],
      600
    );

    let analysis = null;
    try {
      const cleaned = (text || "").replace(/```json|```/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = { probability: 50, summary: "Unable to generate detailed analysis. Please ensure all scores are entered.", strengths: [], risks: [], nextSteps: ["Complete all required fields"], timeline: "Results typically come 2-4 weeks after screening" };
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("AI predict error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}