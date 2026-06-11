import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAIResponse } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { interests, strengths, preferredStyle } = await req.json();

    const prompt = `You are a Nigerian career counselor helping a JAMB student choose the right university course and career path.

Student profile:
- Interests: ${interests.join(", ")}
- Academic strengths: ${strengths.join(", ")}
- Preferred work style: ${preferredStyle}

Based on this profile, suggest exactly 5 career paths. For each career, provide:
1. Career name
2. Recommended university course
3. Required JAMB subjects (list of 3, excluding Use of English)
4. Average entry salary in Nigeria (in Naira)
5. Growth potential (High/Medium/Low)
6. Why this suits the student (1 sentence)
7. Top 3 universities in Nigeria for this course

Respond ONLY with a JSON array. No other text. Format:
[{"career":"...","course":"...","subjects":["..."],"salary":"...","growth":"...","reason":"...","universities":["..."]}]`;

    const { text } = await generateAIResponse(
      "You are a career counselor. Respond only with valid JSON arrays.",
      [{ role: "user", content: prompt }],
      800
    );

    let careers = [];
    try {
      const cleaned = (text || "").replace(/```json|```/g, "").trim();
      careers = JSON.parse(cleaned);
    } catch {
      careers = [];
    }

    // Save to profile
    await db.careerProfile.upsert({
      where: { userId: session.user.id },
      update: { interests, strengths, preferredStyle, suggestedCareers: careers, completedAt: new Date() },
      create: { userId: session.user.id, interests, strengths, preferredStyle, suggestedCareers: careers, completedAt: new Date() },
    });

    return NextResponse.json({ careers });
  } catch (error) {
    console.error("Career discovery error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}