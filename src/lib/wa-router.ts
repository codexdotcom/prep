import { db } from "./db";
import { sendWhatsAppMessage, formatForWhatsApp, splitMessage, markAsRead } from "./whatsapp";
import { generateAIResponse, TUTOR_SYSTEM_PROMPT } from "./ai";
import { awardXP, updateMissionProgress } from "./gamification";
import { getOrCreateTodaysChallenge } from "./daily-challenge";

interface IncomingMessage {
  phone: string;
  text: string;
  messageId: string;
  type: string;
  buttonReplyId?: string;
  listReplyId?: string;
}

// ─── Personality Layer ───
const BOT_NAME = "Genius";

const MOTIVATIONAL = [
  "You're doing amazing. Consistency beats cramming every single time. 💪",
  "Every question you answer is one step closer to your dream university. 🎯",
  "Small progress is still progress. Keep going! 🚀",
  "The students who score 300+ aren't smarter — they just practiced more. That's you right now. 🔥",
  "Your future self will thank you for studying today. Let's go! ⚡",
  "JAMB is a game. The more you practice, the more cheat codes you unlock. 🎮",
  "You're not just studying — you're building your future. Don't stop. 🏗️",
  "Picture yourself checking your result and seeing 300+. That's where we're heading. 🎉",
];

const CORRECT_REACTIONS = [
  "Yessss! 🔥 You nailed it!",
  "Correct! Big brain energy! 🧠✨",
  "On point! ✅ You're cooking!",
  "Right answer! 🎯 Sharp sharp!",
  "Correct! You dey see am! 💯",
  "That's it! 🏆 No dulling!",
  "Spot on! You too sabi! ⚡",
  "✅ Correct! E be like you go hammer this JAMB!",
];

const WRONG_REACTIONS = [
  "Not quite — but that's how we learn! 📚",
  "Close! The answer is *{answer}*. Let me explain why 👇",
  "Almost! It's *{answer}*. Don't worry, this one go stick now 🧠",
  "Wrong this time, but now you'll never forget it! The answer is *{answer}* 💡",
  "It's *{answer}*. No stress — even the best students miss this one 🤝",
  "Not this time! Answer: *{answer}*. But I know you'll get the next one 💪",
];

const STREAK_CELEBRATIONS = [
  { min: 3, msg: "3 in a row! 🔥 You're heating up!" },
  { min: 5, msg: "5 straight! 🔥🔥 You're on FIRE!" },
  { min: 7, msg: "7 consecutive! 🌟 JAMB should be scared of you!" },
  { min: 10, msg: "10 IN A ROW?! 🏆👑 You're basically a professor at this point!" },
];

const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ─── Main Handler ───

export async function handleIncomingMessage(msg: IncomingMessage) {
  await markAsRead(msg.messageId);

  let session = await db.whatsAppSession.findUnique({
    where: { phone: msg.phone },
  });

  if (!session) {
    session = await db.whatsAppSession.create({
      data: { phone: msg.phone, state: "IDLE", context: { streak: 0, totalAnswered: 0, totalCorrect: 0 } },
    });
    // First time user — send welcome
    return handleFirstTime(msg, session);
  }

  await db.whatsAppSession.update({
    where: { id: session.id },
    data: { lastMessageAt: new Date() },
  });

  // Handle button/list replies
  if (msg.buttonReplyId || msg.listReplyId) {
    return handleInteractiveReply(msg, session);
  }

  // Handle active quiz state
  if (session.state === "QUIZ_ACTIVE" || session.state === "WAITING_ANSWER") {
    const upper = msg.text.trim().toUpperCase();
    if (/^[ABCD]$/.test(upper)) {
      return handleAnswer(msg, session, upper);
    }
    // If they type something else during quiz, be helpful
    if (/^(skip|next|pass)/i.test(msg.text)) {
      return handleAnswer(msg, session, "SKIP");
    }
    if (/^(quit|stop|end|exit|done)/i.test(msg.text)) {
      return endQuiz(msg, session);
    }
    // Let them ask questions even during quiz
    if (msg.text.length > 15) {
      return handleAIQuestion(msg, session);
    }
    await sendWhatsAppMessage({
      to: msg.phone,
      text: "Reply with *A*, *B*, *C*, or *D* to answer\n\nOr type *skip* to skip, *done* to end quiz",
    });
    return;
  }

  // Handle onboarding states
  if (session.state === "ONBOARDING_NAME") {
    return handleOnboardingName(msg, session);
  }
  if (session.state === "ONBOARDING_SUBJECTS") {
    return handleOnboardingSubjects(msg, session);
  }

  // Free-form intent detection
  const lower = msg.text.toLowerCase().trim();

  // Quick triggers
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|sup|yo|what'?s?\s*up|hy)/i.test(lower)) {
    return handleGreeting(msg, session);
  }
  if (/^(test|quiz|question|test\s*me|give\s*me|practice|let'?s?\s*go|run\s*it)/i.test(lower)) {
    return handleTestMe(msg, session);
  }
  if (/^(daily|challenge|today|daily\s*challenge)/i.test(lower)) {
    return handleDailyChallenge(msg, session);
  }
  if (/^(score|progress|stats|how\s*am\s*i|my\s*score|performance)/i.test(lower)) {
    return handleScore(msg, session);
  }
  if (/^(predict|jamb\s*score|what\s*will\s*i|my\s*chances|chance)/i.test(lower)) {
    return handlePredict(msg, session);
  }
  if (/^(help|menu|commands|options|what\s*can)/i.test(lower)) {
    return handleMenu(msg, session);
  }
  if (/^(motivat|encourage|i\s*(can'?t|cant)|tired|give\s*up|stressed|hard)/i.test(lower)) {
    return handleMotivation(msg, session);
  }
  if (/^(tip|trick|hack|shortcut|fast)/i.test(lower)) {
    return handleQuickTip(msg, session);
  }
  if (/^(panic|cram|emergency|exam\s*(is\s*)?(tomorrow|soon|close|near))/i.test(lower)) {
    return handlePanicMode(msg, session);
  }
  if (/^(explain\s*like|eli5|simple|dumb\s*it\s*down|break\s*it\s*down)/i.test(lower)) {
    return handleSimplify(msg, session);
  }
  if (/^(subscribe|premium|upgrade|pro|plan|pricing|pay)/i.test(lower)) {
    return handleSubscribe(msg, session);
  }
  if (/^(refer|invite|share|friend)/i.test(lower)) {
    return handleReferral(msg, session);
  }
  if (/^(streak|fire|🔥)/i.test(lower)) {
    return handleStreakCheck(msg, session);
  }

  // Default: AI tutor
  return handleAIQuestion(msg, session);
}

// ─── First Time Welcome ───

async function handleFirstTime(msg: IncomingMessage, session: any) {
  await sendWhatsAppMessage({
    to: msg.phone,
    text: `Hey! 👋 I'm *${BOT_NAME}*, your AI study partner for JAMB.\n\n` +
      `I'm not a boring textbook — think of me as that friend who's really good at explaining things and won't judge you for asking "dumb" questions 😄\n\n` +
      `Here's what I can do:\n` +
      `🧠 Answer any JAMB question\n` +
      `📝 Give you quizzes\n` +
      `📊 Track your progress\n` +
      `🎯 Predict your JAMB score\n` +
      `💡 Share tricks and shortcuts\n\n` +
      `First things first — what's your name?`,
  });

  await db.whatsAppSession.update({
    where: { id: session.id },
    data: { state: "ONBOARDING_NAME" },
  });
}

async function handleOnboardingName(msg: IncomingMessage, session: any) {
  const name = msg.text.trim().split(" ")[0]; // first name only
  const context = (session.context as any) || {};
  context.name = name;

  await db.whatsAppSession.update({
    where: { id: session.id },
    data: { state: "ONBOARDING_SUBJECTS", context },
  });

  await sendWhatsAppMessage({
    to: msg.phone,
    text: `Nice to meet you, *${name}*! 🤝\n\n` +
      `What subjects are you writing in JAMB?\n\n` +
      `(Use of English is automatic — just pick your other 3)`,
    listSections: [
      {
        title: "Sciences",
        rows: [
          { id: "subj_MATHEMATICS", title: "Mathematics", description: "Numbers, algebra, geometry" },
          { id: "subj_PHYSICS", title: "Physics", description: "Mechanics, waves, electricity" },
          { id: "subj_CHEMISTRY", title: "Chemistry", description: "Organic, inorganic, physical" },
          { id: "subj_BIOLOGY", title: "Biology", description: "Cells, genetics, ecology" },
        ],
      },
      {
        title: "Arts & Commercial",
        rows: [
          { id: "subj_LITERATURE", title: "Literature", description: "Prose, poetry, drama" },
          { id: "subj_GOVERNMENT", title: "Government", description: "Political systems, constitution" },
          { id: "subj_ECONOMICS", title: "Economics", description: "Demand, supply, trade" },
          { id: "subj_ACCOUNTING", title: "Accounting", description: "Books, ledgers, statements" },
          { id: "subj_COMMERCE", title: "Commerce", description: "Trade, business, banking" },
          { id: "subj_CRS", title: "CRS", description: "Christian Religious Studies" },
        ],
      },
    ],
    listButtonText: "Pick Subject",
  });
}

async function handleOnboardingSubjects(msg: IncomingMessage, session: any) {
  const context = (session.context as any) || {};
  if (!context.subjects) context.subjects = [];

  // This handles the list reply in handleInteractiveReply
  // If they type a subject name, try to match
  const subjectMap: Record<string, string> = {
    math: "MATHEMATICS", maths: "MATHEMATICS", mathematics: "MATHEMATICS",
    physics: "PHYSICS", phy: "PHYSICS",
    chemistry: "CHEMISTRY", chem: "CHEMISTRY",
    biology: "BIOLOGY", bio: "BIOLOGY",
    literature: "LITERATURE", lit: "LITERATURE",
    government: "GOVERNMENT", govt: "GOVERNMENT", gov: "GOVERNMENT",
    economics: "ECONOMICS", econs: "ECONOMICS",
    accounting: "ACCOUNTING", acc: "ACCOUNTING",
    commerce: "COMMERCE",
    crs: "CRS",
  };

  const matched = subjectMap[msg.text.toLowerCase().trim()];
  if (matched && !context.subjects.includes(matched)) {
    context.subjects.push(matched);
  }

  if (context.subjects.length >= 3) {
    return finishOnboarding(msg, session, context);
  }

  await db.whatsAppSession.update({
    where: { id: session.id },
    data: { context },
  });

  const remaining = 3 - context.subjects.length;
  const picked = context.subjects.map((s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
  );

  await sendWhatsAppMessage({
    to: msg.phone,
    text: `Got it! ✅ ${picked.join(", ")}\n\nPick ${remaining} more subject${remaining > 1 ? "s" : ""}:`,
    listSections: [
      {
        title: "Available Subjects",
        rows: [
          { id: "subj_MATHEMATICS", title: "Mathematics" },
          { id: "subj_PHYSICS", title: "Physics" },
          { id: "subj_CHEMISTRY", title: "Chemistry" },
          { id: "subj_BIOLOGY", title: "Biology" },
          { id: "subj_LITERATURE", title: "Literature" },
          { id: "subj_GOVERNMENT", title: "Government" },
          { id: "subj_ECONOMICS", title: "Economics" },
          { id: "subj_ACCOUNTING", title: "Accounting" },
        ].filter((r) => !context.subjects.includes(r.id.replace("subj_", ""))),
      },
    ],
    listButtonText: "Pick Subject",
  });
}

async function finishOnboarding(msg: IncomingMessage, session: any, context: any) {
  await db.whatsAppSession.update({
    where: { id: session.id },
    data: {
      state: "IDLE",
      context: { ...context, streak: 0, totalAnswered: 0, totalCorrect: 0, correctStreak: 0 },
    },
  });

  const subjects = context.subjects
    .map((s: string) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()))
    .join(", ");

  await sendWhatsAppMessage({
    to: msg.phone,
    text: `You're all set, *${context.name}*! 🎉\n\n` +
      `Your subjects: *Use of English, ${subjects}*\n\n` +
      `Here's the deal - I'll make JAMB prep feel less like punishment and more like a game.\n\n` +
      `Ready to start? 👇`,
    buttons: [
      { id: "quick_5", title: "⚡ Quick 5 Questions" },
      { id: "daily_challenge", title: "🏆 Daily Challenge" },
      { id: "ask_ai", title: "💬 Ask Me Anything" },
    ],
  });
}

// ─── Greeting ───

async function handleGreeting(msg: IncomingMessage, session: any) {
  const context = (session.context as any) || {};
  const name = context.name || "there";
  const hour = new Date().getHours();

  let timeGreeting = "Hey";
  if (hour < 12) timeGreeting = "Good morning";
  else if (hour < 17) timeGreeting = "Good afternoon";
  else timeGreeting = "Good evening";

  const streak = context.correctStreak || 0;
  const answered = context.totalAnswered || 0;

  let statusLine = "";
  if (answered > 0) {
    const accuracy = context.totalCorrect
      ? Math.round((context.totalCorrect / answered) * 100)
      : 0;
    statusLine = `\n📊 So far: *${answered}* questions answered (*${accuracy}%* accuracy)`;
    if (streak > 0) statusLine += `\n🔥 Current streak: *${streak}* correct in a row`;
  }

  await sendWhatsAppMessage({
    to: msg.phone,
    text: `${timeGreeting}, *${name}*! 👋${statusLine}\n\nWhat's the plan today?`,
    buttons: [
      { id: "quick_5", title: "⚡ Quick 5" },
      { id: "daily_challenge", title: "🏆 Daily Challenge" },
      { id: "menu", title: "📋 Full Menu" },
    ],
  });
}

// ─── Menu ───

async function handleMenu(msg: IncomingMessage, session: any) {
  await sendWhatsAppMessage({
    to: msg.phone,
    text: `📋 *What can ${BOT_NAME} do?*\n\n` +
      `⚡ *"test me"* — Quick quiz (5 questions)\n` +
      `🔟 *"test me 10"* — Longer quiz\n` +
      `🏆 *"daily"* — Today's challenge (compete!)\n` +
      `📊 *"score"* — Your progress & accuracy\n` +
      `🎯 *"predict"* — Predicted JAMB score\n` +
      `🔥 *"streak"* — Your answer streak\n` +
      `💡 *"tip"* — Random study trick\n` +
      `🆘 *"panic"* — Emergency cram plan\n` +
      `💬 *Ask anything* — I'll explain it\n` +
      `👫 *"invite"* — Get free Pro access\n\n` +
      `_Or just type any JAMB question — I'll break it down for you!_ 🧠`,
  });
}

// ─── Quiz System ───

async function handleTestMe(msg: IncomingMessage, session: any) {
  const context = (session.context as any) || {};

  // Check if they specified a count
  const countMatch = msg.text.match(/(\d+)/);
  const questionCount = countMatch ? Math.min(Math.max(parseInt(countMatch[1]), 3), 20) : 5;

  // If they have subjects saved, offer those
  if (context.subjects?.length > 0) {
    const rows = context.subjects.map((s: string) => ({
      id: `quiz_${s}_${questionCount}`,
      title: s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
      description: `${questionCount} questions`,
    }));

    // Add "surprise me" option
    rows.push({
      id: `quiz_MIX_${questionCount}`,
      title: "🎲 Surprise Me",
      description: `Mix of all your subjects`,
    });

    await sendWhatsAppMessage({
      to: msg.phone,
      text: `Let's go! 💪 Pick a subject (${questionCount} questions):`,
      listSections: [{ title: "Your Subjects", rows }],
      listButtonText: "Choose Subject",
    });
  } else {
    // No subjects saved — show all
    await sendWhatsAppMessage({
      to: msg.phone,
      text: `Let's test your knowledge! 📝\n\nPick a subject:`,
      listSections: [
        {
          title: "Sciences",
          rows: [
            { id: `quiz_MATHEMATICS_${questionCount}`, title: "Mathematics" },
            { id: `quiz_PHYSICS_${questionCount}`, title: "Physics" },
            { id: `quiz_CHEMISTRY_${questionCount}`, title: "Chemistry" },
            { id: `quiz_BIOLOGY_${questionCount}`, title: "Biology" },
          ],
        },
        {
          title: "Arts & Social",
          rows: [
            { id: `quiz_USE_OF_ENGLISH_${questionCount}`, title: "Use of English" },
            { id: `quiz_ECONOMICS_${questionCount}`, title: "Economics" },
            { id: `quiz_GOVERNMENT_${questionCount}`, title: "Government" },
          ],
        },
      ],
      listButtonText: "Choose Subject",
    });
  }
}

async function startQuiz(msg: IncomingMessage, session: any, subject: string, count: number) {
  const context = (session.context as any) || {};
  const isMix = subject === "MIX";

  const whereClause: any = { isActive: true };

  if (isMix && context.subjects?.length > 0) {
    whereClause.subject = { in: ["USE_OF_ENGLISH", ...context.subjects] };
  } else if (!isMix) {
    whereClause.subject = subject;
  }

  const questions = await db.question.findMany({
    where: whereClause,
    select: { id: true, body: true, optionA: true, optionB: true, optionC: true, optionD: true, subject: true },
    take: count * 4,
  });

  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, count);

  if (shuffled.length === 0) {
    await sendWhatsAppMessage({
      to: msg.phone,
      text: "No questions available for this subject yet 😅\n\nTry another subject or type *test me*!",
    });
    return;
  }

  const formatSubj = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const subjectLabel = isMix ? "Mixed Subjects" : formatSubj(subject);

  await db.whatsAppSession.update({
    where: { id: session.id },
    data: {
      state: "QUIZ_ACTIVE",
      context: {
        ...context,
        quiz: {
          subject: subjectLabel,
          questions: shuffled.map((q) => q.id),
          currentIndex: 0,
          answers: {},
          correctStreak: 0,
          startedAt: Date.now(),
        },
      },
    },
  });

  await sendWhatsAppMessage({
    to: msg.phone,
    text: `📝 *${subjectLabel} Quiz* — ${shuffled.length} questions\n\n` +
      `Get 5+ correct in a row for bonus XP! 🔥\n` +
      `Type the letter (A, B, C, or D) to answer.\n` +
      `Type *skip* to skip, *done* to finish early.\n\n` +
      `Let's begin! 👇`,
  });

  // Small delay for dramatic effect
  await new Promise((r) => setTimeout(r, 800));

  await sendQuestion(msg.phone, shuffled[0], 1, shuffled.length);
}

async function sendQuestion(
  phone: string,
  question: { id: string; body: string; optionA: string; optionB: string; optionC: string; optionD: string },
  number: number,
  total: number
) {
  const progress = "█".repeat(number - 1) + "░".repeat(total - number + 1);

  await sendWhatsAppMessage({
    to: phone,
    text: `*Question ${number}/${total}*\n${progress}\n\n` +
      `${question.body}\n\n` +
      `*A.* ${question.optionA}\n` +
      `*B.* ${question.optionB}\n` +
      `*C.* ${question.optionC}\n` +
      `*D.* ${question.optionD}`,
  });
}

async function handleAnswer(msg: IncomingMessage, session: any, answer: string) {
  const context = (session.context as any) || {};
  const quiz = context.quiz;

  if (!quiz || !quiz.questions) {
    await db.whatsAppSession.update({
      where: { id: session.id },
      data: { state: "IDLE" },
    });
    return handleMenu(msg, session);
  }

  const currentQId = quiz.questions[quiz.currentIndex];

  // Handle skip
  if (answer === "SKIP") {
    quiz.answers[currentQId] = { selected: null, isCorrect: false, skipped: true };
    quiz.correctStreak = 0;

    return advanceQuiz(msg, session, context, "⏭ Skipped!\n");
  }

  // Get correct answer
  const question = await db.question.findUnique({
    where: { id: currentQId },
    select: { correctOption: true, explanation: true, body: true, topic: { select: { name: true } } },
  });

  if (!question) {
    return advanceQuiz(msg, session, context, "");
  }

  const isCorrect = answer === question.correctOption;
  quiz.answers[currentQId] = { selected: answer, correct: question.correctOption, isCorrect };

  // Update stats
  context.totalAnswered = (context.totalAnswered || 0) + 1;
  if (isCorrect) {
    context.totalCorrect = (context.totalCorrect || 0) + 1;
    context.correctStreak = (context.correctStreak || 0) + 1;
    quiz.correctStreak = (quiz.correctStreak || 0) + 1;
  } else {
    context.correctStreak = 0;
    quiz.correctStreak = 0;
  }

  // Record in DB if linked
  if (session.userId) {
    try {
      await db.questionResponse.create({
        data: {
          sessionId: `wa-${session.id}`,
          questionId: currentQId,
          userId: session.userId,
          selectedOption: answer as any,
          isCorrect,
          timeSpent: 0,
        },
      }).catch(() => {});

      if (isCorrect) {
        await awardXP(session.userId, 5, "QUESTION_CORRECT", currentQId).catch(() => {});
        await updateMissionProgress(session.userId, "ANSWER_QUESTIONS", 1).catch(() => {});
      }
    } catch {}
  }

  // Build feedback
  let feedback = "";

  if (isCorrect) {
    feedback = randomPick(CORRECT_REACTIONS) + "\n";

    // Streak celebrations
    const streakMsg = STREAK_CELEBRATIONS.find((s) => quiz.correctStreak === s.min);
    if (streakMsg) {
      feedback += `\n${streakMsg.msg}\n`;
    }
  } else {
    const wrongMsg = randomPick(WRONG_REACTIONS).replace("{answer}", question.correctOption);
    feedback = wrongMsg + "\n";

    // Show brief explanation for wrong answers
    if (question.explanation) {
      const shortExpl = question.explanation.length > 250
        ? question.explanation.slice(0, 250) + "..."
        : question.explanation;
      feedback += `\n💡 *Why?*\n${formatForWhatsApp(shortExpl)}\n`;
    }
  }

  return advanceQuiz(msg, session, context, feedback);
}

async function advanceQuiz(msg: IncomingMessage, session: any, context: any, feedback: string) {
  const quiz = context.quiz;
  quiz.currentIndex += 1;

  // Check if quiz is done
  if (quiz.currentIndex >= quiz.questions.length) {
    return finishQuiz(msg, session, context, feedback);
  }

  // Save state
  await db.whatsAppSession.update({
    where: { id: session.id },
    data: { context },
  });

  // Send feedback
  if (feedback) {
    await sendWhatsAppMessage({ to: msg.phone, text: feedback });
    await new Promise((r) => setTimeout(r, 500));
  }

  // Send next question
  const nextQId = quiz.questions[quiz.currentIndex];
  const nextQ = await db.question.findUnique({
    where: { id: nextQId },
    select: { id: true, body: true, optionA: true, optionB: true, optionC: true, optionD: true },
  });

  if (nextQ) {
    await sendQuestion(msg.phone, nextQ, quiz.currentIndex + 1, quiz.questions.length);
  }
}

async function finishQuiz(msg: IncomingMessage, session: any, context: any, lastFeedback: string) {
  const quiz = context.quiz;
  const answers = Object.values(quiz.answers) as Array<{ isCorrect: boolean; skipped?: boolean }>;
  const correct = answers.filter((a) => a.isCorrect).length;
  const skipped = answers.filter((a) => a.skipped).length;
  const total = quiz.questions.length;
  const accuracy = Math.round((correct / total) * 100);
  const timeTaken = Math.round((Date.now() - quiz.startedAt) / 1000);

  // Emoji-based grade
  let grade = "";
  let comment = "";
  if (accuracy === 100) { grade = "🎯 PERFECT"; comment = "You absolutely crushed it! 🏆"; }
  else if (accuracy >= 80) { grade = "🔥 EXCELLENT"; comment = "JAMB should be worried about you! 💪"; }
  else if (accuracy >= 60) { grade = "👍 GOOD"; comment = "Solid performance! A few more rounds and you'll ace this."; }
  else if (accuracy >= 40) { grade = "📈 IMPROVING"; comment = "You're getting there! Focus on the topics you missed."; }
  else { grade = "📚 KEEP GOING"; comment = "Don't give up! Every wrong answer is a lesson learned."; }

  // Visual progress bar
  const filled = Math.round((correct / total) * 10);
  const progressBar = "🟩".repeat(filled) + "⬜".repeat(10 - filled);

  let resultText = lastFeedback ? lastFeedback + "\n" : "";
  resultText += `━━━━━━━━━━━━━━━━\n`;
  resultText += `${grade}\n\n`;
  resultText += `📝 *${quiz.subject} Quiz Results*\n\n`;
  resultText += `${progressBar}\n\n`;
  resultText += `✅ Correct: *${correct}/${total}*\n`;
  resultText += `📊 Accuracy: *${accuracy}%*\n`;
  if (skipped > 0) resultText += `⏭ Skipped: *${skipped}*\n`;
  resultText += `⏱ Time: *${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s*\n\n`;
  resultText += `${comment}\n\n`;

  // Lifetime stats
  const totalAns = context.totalAnswered || 0;
  const totalCorr = context.totalCorrect || 0;
  const lifetimeAcc = totalAns > 0 ? Math.round((totalCorr / totalAns) * 100) : 0;
  resultText += `📈 *Lifetime: ${totalAns} answered, ${lifetimeAcc}% accuracy*`;

  // Reset quiz state
  delete context.quiz;
  await db.whatsAppSession.update({
    where: { id: session.id },
    data: { state: "IDLE", context },
  });

  await sendWhatsAppMessage({ to: msg.phone, text: resultText });

  // Prompt for next action
  await new Promise((r) => setTimeout(r, 1000));

  await sendWhatsAppMessage({
    to: msg.phone,
    text: "What next? 👇",
    buttons: [
      { id: "quick_5", title: "⚡ Go Again" },
      { id: "daily_challenge", title: "🏆 Daily Challenge" },
      { id: "tip", title: "💡 Study Tip" },
    ],
  });
}

// ─── Daily Challenge ───

async function handleDailyChallenge(msg: IncomingMessage, session: any) {
  const challenge = await getOrCreateTodaysChallenge();

  if (!challenge || challenge.questionIds.length === 0) {
    await sendWhatsAppMessage({
      to: msg.phone,
      text: "Today's challenge isn't ready yet ⏳\n\nType *test me* for a quick quiz instead!",
    });
    return;
  }

  // Check if already attempted (by phone session, not just userId)
  const context = (session.context as any) || {};
  if (context.lastChallengeId === challenge.id) {
    await sendWhatsAppMessage({
      to: msg.phone,
      text: `You already smashed today's challenge! 🏆\n\n` +
        `Your score: *${context.lastChallengeScore}*\n\n` +
        `New challenge drops at midnight ⏰\n\nType *test me* for more practice!`,
    });
    return;
  }

  const questions = await db.question.findMany({
    where: { id: { in: challenge.questionIds } },
    select: { id: true, body: true, optionA: true, optionB: true, optionC: true, optionD: true },
  });

  const formatSubj = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  context.quiz = {
    type: "daily_challenge",
    challengeId: challenge.id,
    subject: `Daily Challenge — ${formatSubj(challenge.subject)}`,
    questions: questions.map((q) => q.id),
    currentIndex: 0,
    answers: {},
    correctStreak: 0,
    startedAt: Date.now(),
  };

  await db.whatsAppSession.update({
    where: { id: session.id },
    data: { state: "QUIZ_ACTIVE", context },
  });

  await sendWhatsAppMessage({
    to: msg.phone,
    text: `🏆 *Daily Challenge*\n\n` +
      `${challenge.title}\n` +
      `${questions.length} questions · ${formatSubj(challenge.subject)}\n\n` +
      `⚡ Earn *${challenge.xpReward} XP* for completing\n` +
      `👑 Top 10% earn *${challenge.bonusXP} bonus XP*\n\n` +
      `Let's see what you've got! 💪`,
  });

  await new Promise((r) => setTimeout(r, 1000));
  await sendQuestion(msg.phone, questions[0], 1, questions.length);
}

// ─── AI Tutor ───

async function handleAIQuestion(msg: IncomingMessage, session: any) {
  const context = (session.context as any) || {};
  const name = context.name || "friend";

  const systemPrompt = TUTOR_SYSTEM_PROMPT +
    `\n\nYou're chatting on WhatsApp with a student named ${name}.` +
    `\n\nIMPORTANT FORMATTING RULES:` +
    `\n- Keep responses under 250 words — WhatsApp is for quick learning` +
    `\n- Use *bold* for key terms (WhatsApp uses single asterisks)` +
    `\n- Use numbered lists for steps` +
    `\n- Use emojis sparingly but effectively` +
    `\n- End with ONE follow-up question or a practical tip` +
    `\n- Be warm, encouraging, and slightly informal — like a smart friend` +
    `\n- If relevant, suggest they type "test me" to practice what you just taught` +
    `\n- Use Nigerian context/examples when it fits naturally`;

  const { text, error } = await generateAIResponse(
    systemPrompt,
    [{ role: "user", content: msg.text }],
    500
  );

  if (error || !text) {
    await sendWhatsAppMessage({
      to: msg.phone,
      text: `Hmm, I got a bit confused by that one 😅\n\nCould you rephrase your question? Or type *help* to see what I can do!`,
    });
    return;
  }

  const formatted = formatForWhatsApp(text);
  const chunks = splitMessage(formatted);

  for (const chunk of chunks) {
    await sendWhatsAppMessage({ to: msg.phone, text: chunk });
  }
}

async function handleSimplify(msg: IncomingMessage, session: any) {
  const context = (session.context as any) || {};
  const topic = msg.text.replace(/^(explain\s*like|eli5|simple|dumb\s*it\s*down|break\s*it\s*down)\s*/i, "").trim();

  if (!topic || topic.length < 3) {
    await sendWhatsAppMessage({
      to: msg.phone,
      text: `Tell me what to simplify! 😄\n\nExample: *"break it down photosynthesis"*\nOr: *"explain like I'm 10 quadratic equations"*`,
    });
    return;
  }

  const systemPrompt = TUTOR_SYSTEM_PROMPT +
    `\n\nThe student asked you to explain something in the SIMPLEST possible way.` +
    `\nUse analogies, everyday Nigerian examples, and assume zero background knowledge.` +
    `\nImagine explaining to a 10-year-old.` +
    `\nKeep it under 200 words. Use emojis. Be fun.`;

  const { text, error } = await generateAIResponse(
    systemPrompt,
    [{ role: "user", content: `Explain this like I'm 10 years old: ${topic}` }],
    400
  );

  if (text) {
    await sendWhatsAppMessage({ to: msg.phone, text: formatForWhatsApp(text) });
  } else {
    await sendWhatsAppMessage({
      to: msg.phone,
      text: `I couldn't simplify that right now 😅 Try again in a bit!`,
    });
  }
}

// ─── Score & Prediction ───

async function handleScore(msg: IncomingMessage, session: any) {
  const context = (session.context as any) || {};
  const name = context.name || "there";
  const totalAns = context.totalAnswered || 0;
  const totalCorr = context.totalCorrect || 0;
  const accuracy = totalAns > 0 ? Math.round((totalCorr / totalAns) * 100) : 0;
  const streak = context.correctStreak || 0;

  if (totalAns === 0) {
    await sendWhatsAppMessage({
      to: msg.phone,
      text: `You haven't answered any questions yet, *${name}*! 📝\n\nType *test me* to start building your stats!`,
    });
    return;
  }

  // Grade emoji
  let gradeEmoji = "📈";
  if (accuracy >= 80) gradeEmoji = "🏆";
  else if (accuracy >= 60) gradeEmoji = "💪";
  else if (accuracy >= 40) gradeEmoji = "📚";

  // Visual accuracy bar
  const filled = Math.round(accuracy / 10);
  const bar = "🟩".repeat(filled) + "⬜".repeat(10 - filled);

  let scoreText = `${gradeEmoji} *${name}'s Stats*\n\n`;
  scoreText += `${bar}\n\n`;
  scoreText += `📝 Questions answered: *${totalAns}*\n`;
  scoreText += `✅ Correct: *${totalCorr}* (${accuracy}%)\n`;
  scoreText += `❌ Wrong: *${totalAns - totalCorr}*\n`;
  if (streak > 0) scoreText += `🔥 Current streak: *${streak}*\n`;
  scoreText += `\n`;

  if (accuracy >= 80) {
    scoreText += `_You're smashing it! Keep this consistency into the exam hall._`;
  } else if (accuracy >= 60) {
    scoreText += `_Good progress! Focus on your weak areas and you'll break 80% soon._`;
  } else {
    scoreText += `_Every question makes you smarter. Keep going — consistency is your superpower._`;
  }

  if (session.userId) {
    scoreText += `\n\n📊 _Full analytics at jamb.os/analytics_`;
  }

  await sendWhatsAppMessage({ to: msg.phone, text: scoreText });
}

async function handlePredict(msg: IncomingMessage, session: any) {
  const context = (session.context as any) || {};
  const name = context.name || "there";
  const totalAns = context.totalAnswered || 0;
  const totalCorr = context.totalCorrect || 0;

  if (totalAns < 15) {
    await sendWhatsAppMessage({
      to: msg.phone,
      text: `I need at least 15 answered questions to predict your score, *${name}*.\n\n` +
        `You've answered *${totalAns}* so far.\n\n` +
        `Type *test me* and let's get those numbers up! 📝`,
    });
    return;
  }

  const accuracy = totalCorr / totalAns;
  const predicted = Math.round(accuracy * 400);

  let emoji = "📈";
  let reaction = "";

  if (predicted >= 300) {
    emoji = "👑";
    reaction = "You're aiming for the stars — and hitting them! Top universities are calling your name.";
  } else if (predicted >= 250) {
    emoji = "🎯";
    reaction = "You're in competitive territory. A little more push and you're golden!";
  } else if (predicted >= 200) {
    emoji = "💪";
    reaction = "Solid foundation. Focus on your weak topics and you can easily add 50+ points.";
  } else {
    emoji = "📚";
    reaction = "Room to grow — and that's exciting! Consistent practice is the key.";
  }

  const bar = "🟩".repeat(Math.round(predicted / 40)) + "⬜".repeat(10 - Math.round(predicted / 40));

  let text = `${emoji} *Predicted JAMB Score*\n\n`;
  text += `${bar}\n\n`;
  text += `🎯 *${predicted}/400*\n`;
  text += `📊 Based on ${totalAns} questions (${Math.round(accuracy * 100)}% accuracy)\n\n`;
  text += `${reaction}\n\n`;

  if (predicted < 250) {
    text += `💡 *To improve:*\n`;
    text += `1. Take 2 quizzes daily\n`;
    text += `2. Focus on topics you get wrong\n`;
    text += `3. Type any question you're stuck on — I'll explain it\n\n`;
  }

  text += `_This prediction gets more accurate with more questions!_`;

  if (session.userId) {
    text += `\n\n🎓 _Check university chances at prepgenius.ng/reality_`;
  }

  await sendWhatsAppMessage({ to: msg.phone, text });
}

// ─── Motivation & Tips ───

async function handleMotivation(msg: IncomingMessage, session: any) {
  const context = (session.context as any) || {};
  const name = context.name || "friend";

  const message = randomPick(MOTIVATIONAL);

  await sendWhatsAppMessage({
    to: msg.phone,
    text: `*${name}*, hear me out:\n\n${message}\n\n_Now let's turn that energy into practice:_`,
    buttons: [
      { id: "quick_5", title: "⚡ Let's Practice" },
      { id: "tip", title: "💡 Study Tip" },
    ],
  });
}

async function handleQuickTip(msg: IncomingMessage, session: any) {
  // Get a random micro content piece
  const tips = await db.microContent.findMany({
    where: { isActive: true, type: { in: ["TRICK", "HACK", "MNEMONIC"] } },
    select: { title: true, body: true, type: true, subject: true },
    take: 20,
  });

  if (tips.length === 0) {
    // Fallback tips
    const fallbackTips = [
      `💡 *Percentage Shortcut*\n\n8% of 50 = 50% of 8 = *4*\n\nAlways flip to whichever is easier to calculate!`,
      `💡 *Comprehension Hack*\n\nRead the questions FIRST, then the passage. Your brain will automatically highlight relevant parts. Saves 40% time!`,
      `💡 *SUVAT Trick*\n\nLook at what variable is NOT given in the question. That tells you which equation to use instantly.`,
      `💡 *Log Rule*\n\nlog(a+b) ≠ log(a) + log(b)\n\nBut log(a×b) = log(a) + log(b)\n\nJAMB catches 70% of students with this!`,
    ];
    await sendWhatsAppMessage({ to: msg.phone, text: randomPick(fallbackTips) });
  } else {
    const tip = randomPick(tips);
    const formatted = formatForWhatsApp(tip.body);
    const formatSubj = (s: string) =>
      s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

    await sendWhatsAppMessage({
      to: msg.phone,
      text: `💡 *${tip.title}*\n_${formatSubj(tip.subject)}_\n\n${formatted}`,
    });
  }

  await new Promise((r) => setTimeout(r, 500));
  await sendWhatsAppMessage({
    to: msg.phone,
    text: `Want to practice this? Type *test me* 📝\nOr type *tip* for another one!`,
  });
}

async function handlePanicMode(msg: IncomingMessage, session: any) {
  const context = (session.context as any) || {};
  const name = context.name || "there";

  await sendWhatsAppMessage({
    to: msg.phone,
    text: `🚨 *PANIC MODE ACTIVATED* 🚨\n\n` +
      `Okay *${name}*, breathe. Here's your emergency plan:\n\n` +
      `*Day 1-2:* Use of English\n` +
      `→ Focus on comprehension tricks and grammar rules\n` +
      `→ Do 50 past questions\n\n` +
      `*Day 3-4:* Your strongest subject\n` +
      `→ Lock in the marks you KNOW you can get\n` +
      `→ 50 past questions + review wrong answers\n\n` +
      `*Day 5-6:* Your weakest subject\n` +
      `→ Focus on the 5 most common topics only\n` +
      `→ Don't try to learn everything — learn the high-frequency stuff\n\n` +
      `*Day 7:* Full mock exam\n` +
      `→ Time yourself strictly\n` +
      `→ Review every wrong answer\n\n` +
      `*General rules:*\n` +
      `• Sleep 7+ hours — your brain needs it\n` +
      `• No new topics on exam eve — only revise\n` +
      `• Practice timing — 1 min per question max\n\n` +
      `_You've got this. Let's start NOW:_`,
    buttons: [
      { id: "quick_5", title: "⚡ Start Drilling" },
    ],
  });
}

// ─── Streak ───

async function handleStreakCheck(msg: IncomingMessage, session: any) {
  const context = (session.context as any) || {};
  const streak = context.correctStreak || 0;

  if (streak === 0) {
    await sendWhatsAppMessage({
      to: msg.phone,
      text: `Your streak is at *0* right now 😅\n\nTime to build it up! Every correct answer adds to your streak.\n\nType *test me* to start! 🔥`,
    });
  } else {
    const flames = "🔥".repeat(Math.min(streak, 10));
    await sendWhatsAppMessage({
      to: msg.phone,
      text: `${flames}\n\n*${streak} correct in a row!*\n\n` +
        `${streak >= 10 ? "You're absolutely on fire! 🏆" : streak >= 5 ? "Keep this streak alive! 💪" : "Good start! Can you hit 5? ⚡"}\n\n` +
        `Type *test me* to keep it going!`,
    });
  }
}

// ─── Referral ───

async function handleReferral(msg: IncomingMessage, session: any) {
  await sendWhatsAppMessage({
    to: msg.phone,
    text: `👫 *Invite Friends, Get Pro FREE!*\n\n` +
      `Share JAMB OS with your classmates:\n\n` +
      `🎁 *3 friends* → 1 week Pro\n` +
      `⭐ *5 friends* → 1 month Pro\n` +
      `🏆 *10 friends* → 3 months Pro\n` +
      `👑 *25 friends* → 1 YEAR Pro\n\n` +
      `Sign up at *jamb.os* to get your unique referral code!\n\n` +
      `_Or just forward this message to your WhatsApp groups:_\n\n` +
      `"I've been using JAMB OS to prep for JAMB — it has an AI tutor that explains everything, daily challenges, and score predictions. Try it: jamb.os 🎯"`,
  });
}

// ─── Subscribe ───

async function handleSubscribe(msg: IncomingMessage, session: any) {
  await sendWhatsAppMessage({
    to: msg.phone,
    text: `💎 *JAMB OS Plans*\n\n` +
      `*🆓 Free* — What you're using now!\n` +
      `• 20 questions/day on the web\n` +
      `• Unlimited WhatsApp quizzes\n\n` +
      `*⚡ Starter — ₦1,500/mo*\n` +
      `• 100 questions/day\n` +
      `• Basic analytics\n\n` +
      `*⭐ Pro — ₦3,000/mo* (MOST POPULAR)\n` +
      `• Unlimited everything\n` +
      `• AI tutor on web\n` +
      `• Study planner\n` +
      `• Score prediction\n\n` +
      `*👑 Elite — ₦5,000/mo*\n` +
      `• Everything in Pro\n` +
      `• Priority AI\n` +
      `• Detailed reports\n\n` +
      `Subscribe at: *jamb.os/subscription*\n\n` +
      `💡 _Or invite 5 friends for FREE Pro! Type *invite* for details._`,
  });
}

// ─── Interactive Reply Handler ───

async function handleInteractiveReply(msg: IncomingMessage, session: any) {
  const replyId = msg.buttonReplyId || msg.listReplyId || "";

  if (replyId === "quick_5" || replyId === "test_me") {
    return handleTestMe(msg, session);
  }
  if (replyId === "daily_challenge") {
    return handleDailyChallenge(msg, session);
  }
  if (replyId === "menu" || replyId === "help") {
    return handleMenu(msg, session);
  }
  if (replyId === "ask_ai") {
    await sendWhatsAppMessage({
      to: msg.phone,
      text: "Ask me anything about JAMB! 🧠\n\nJust type your question and I'll break it down for you.",
    });
    return;
  }
  if (replyId === "tip") {
    return handleQuickTip(msg, session);
  }

  // Quiz subject selection: quiz_SUBJECT_COUNT
  if (replyId.startsWith("quiz_")) {
    const parts = replyId.replace("quiz_", "").split("_");
    const count = parseInt(parts.pop() || "5") || 5;
    const subject = parts.join("_");
    return startQuiz(msg, session, subject, count);
  }

  // Subject selection during onboarding
  if (replyId.startsWith("subj_")) {
    const subject = replyId.replace("subj_", "");
    const context = (session.context as any) || {};
    if (!context.subjects) context.subjects = [];

    if (!context.subjects.includes(subject)) {
      context.subjects.push(subject);
    }

    await db.whatsAppSession.update({
      where: { id: session.id },
      data: { context },
    });

    if (context.subjects.length >= 3) {
      return finishOnboarding(msg, session, context);
    }

    const remaining = 3 - context.subjects.length;
    const picked = context.subjects.map((s: string) =>
      s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
    );

    await sendWhatsAppMessage({
      to: msg.phone,
      text: `✅ ${picked.join(", ")}\n\nPick ${remaining} more:`,
      listSections: [
        {
          title: "Subjects",
          rows: [
            { id: "subj_MATHEMATICS", title: "Mathematics" },
            { id: "subj_PHYSICS", title: "Physics" },
            { id: "subj_CHEMISTRY", title: "Chemistry" },
            { id: "subj_BIOLOGY", title: "Biology" },
            { id: "subj_LITERATURE", title: "Literature" },
            { id: "subj_GOVERNMENT", title: "Government" },
            { id: "subj_ECONOMICS", title: "Economics" },
            { id: "subj_ACCOUNTING", title: "Accounting" },
          ].filter((r) => !context.subjects.includes(r.id.replace("subj_", ""))),
        },
      ],
      listButtonText: "Pick Subject",
    });
    return;
  }

  // Answer buttons
  if (/^answer_[ABCD]$/.test(replyId)) {
    return handleAnswer(msg, session, replyId.replace("answer_", ""));
  }
}

// ─── Quiz End ───

async function endQuiz(msg: IncomingMessage, session: any) {
  const context = (session.context as any) || {};

  if (context.quiz) {
    // Finish with current progress
    return finishQuiz(msg, session, context, "");
  }

  await db.whatsAppSession.update({
    where: { id: session.id },
    data: { state: "IDLE" },
  });

  await sendWhatsAppMessage({
    to: msg.phone,
    text: "Quiz ended! 📊\n\nType *test me* for another round or *score* to check your stats.",
  });
}