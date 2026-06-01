const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-20250514";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  text: string;
  error?: string;
}

export async function generateAIResponse(
  systemPrompt: string,
  messages: Message[],
  maxTokens: number = 1024
): Promise<AIResponse> {
  if (!ANTHROPIC_API_KEY) {
    return { text: "", error: "AI service not configured" };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("AI API error:", err);
      return { text: "", error: "AI service temporarily unavailable" };
    }

    const data = await res.json();
    const text = data.content
      ?.filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("\n") || "";

    return { text };
  } catch (error) {
    console.error("AI request failed:", error);
    return { text: "", error: "Failed to reach AI service" };
  }
}

export function buildQuestionContext(question: {
  body: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string | null;
  subject: string;
  difficulty: string;
  topic?: { name: string } | null;
}): string {
  return `
Subject: ${question.subject.replace(/_/g, " ")}
Topic: ${question.topic?.name || "General"}
Difficulty: ${question.difficulty}

Question: ${question.body}

A) ${question.optionA}
B) ${question.optionB}
C) ${question.optionC}
D) ${question.optionD}

Correct Answer: ${question.correctOption}
${question.explanation ? `\nExisting Explanation: ${question.explanation}` : ""}
`.trim();
}

export const TUTOR_SYSTEM_PROMPT = `You are JAMB OS AI, a warm, encouraging JAMB tutor for Nigerian students. You specialize in breaking down complex topics into simple, clear explanations.

Your guidelines:
- Use simple, conversational English. Avoid unnecessarily complex vocabulary.
- When explaining math or science, show step-by-step working.
- Use relatable Nigerian examples and contexts where appropriate.
- Be encouraging but honest. If a student is struggling, acknowledge it and simplify.
- Keep responses concise — students are studying, not reading essays. Aim for 150-300 words unless the topic genuinely requires more.
- Use markdown formatting: **bold** for key terms, numbered lists for steps, backticks for formulas.
- If a student asks something outside JAMB scope, gently redirect them.
- Never just give the answer — explain the reasoning so they can solve similar problems.
- Address common misconceptions directly.
- End explanations with a brief "Quick check" — a simple question to verify understanding.`;

export const EXPLANATION_SYSTEM_PROMPT = `You are JAMB OS AI, an expert JAMB question explainer. For each question, provide a clear, structured explanation.

Format your response as:
1. **Why [correct option] is correct** — clear reasoning with steps if applicable
2. **Why other options are wrong** — brief explanation for each wrong option
3. **Key concept** — the underlying principle being tested
4. **Exam tip** — a practical tip for similar questions in JAMB

Keep it concise (200-350 words). Use simple English. Show working for calculations. Use Nigerian context where helpful.`;