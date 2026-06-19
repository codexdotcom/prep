export interface TopicAbilityState {
  topicId: string;
  subject: string;
  ability: number;        // 0-100
  confidence: number;     // 0-1
  totalAttempts: number;
  totalCorrect: number;
  recentResults: boolean[]; // last 10
  avgTimeMs: number | null;
  currentStreak: number;  // positive = correct, negative = wrong
  lastPracticedAt: Date | null;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: Date | null;
}

export interface AdaptiveState {
  ability: number;
  streak: number;
  wrongStreak: number;
  totalAnswered: number;
  totalCorrect: number;
  difficultyHistory: Array<{ difficulty: string; correct: boolean; timeMs: number }>;
  momentum: "rising" | "stable" | "falling";
  sessionFatigue: number; // 0-1, increases with questions answered
}

export interface QuestionMeta {
  id: string;
  difficulty: string;
  topicId?: string;
  subject?: string;
}

// ─── Constants ───

const DIFFICULTY_WEIGHT: Record<string, number> = { EASY: 25, MEDIUM: 50, HARD: 75 };
const SIGMOID_K = 0.08;
const BASE_LEARNING_RATE = 15;
const MAX_RECENT_RESULTS = 10;
const FORGETTING_DECAY = 0.95; // per day

// ─── Session State ───

export function createInitialState(): AdaptiveState {
  return {
    ability: 50,
    streak: 0,
    wrongStreak: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    difficultyHistory: [],
    momentum: "stable",
    sessionFatigue: 0,
  };
}

// ─── Probability Model ───

function pCorrect(ability: number, difficultyWeight: number): number {
  return 1 / (1 + Math.exp(-SIGMOID_K * (ability - difficultyWeight)));
}

// ─── Time-Based Signals ───

export type TimeSignal = "fast_correct" | "fast_wrong" | "normal" | "slow_correct" | "slow_wrong" | "guessing";

export function classifyResponseTime(timeMs: number, isCorrect: boolean): TimeSignal {
  const timeSec = timeMs / 1000;
  if (timeSec < 5 && !isCorrect) return "guessing";
  if (timeSec < 15 && !isCorrect) return "fast_wrong";
  if (timeSec < 30 && isCorrect) return "fast_correct";
  if (timeSec > 90 && isCorrect) return "slow_correct";
  if (timeSec > 90 && !isCorrect) return "slow_wrong";
  return "normal";
}

function getTimeMultiplier(signal: TimeSignal): { abilityMult: number; confidenceMult: number } {
  switch (signal) {
    case "fast_correct": return { abilityMult: 1.2, confidenceMult: 1.3 }; // knows it cold
    case "fast_wrong": return { abilityMult: 0.5, confidenceMult: 0.8 };   // careless, don't penalize full
    case "slow_correct": return { abilityMult: 0.7, confidenceMult: 0.9 }; // can do it but struggles
    case "slow_wrong": return { abilityMult: 1.0, confidenceMult: 1.0 };   // genuinely doesn't know
    case "guessing": return { abilityMult: 0.0, confidenceMult: 0.3 };     // ignore this data point
    case "normal": return { abilityMult: 1.0, confidenceMult: 1.0 };
  }
}

// ─── Session-Level Ability Update ───

export function updateSessionAbility(
  state: AdaptiveState,
  difficulty: string,
  isCorrect: boolean,
  timeMs: number
): AdaptiveState {
  const diffWeight = DIFFICULTY_WEIGHT[difficulty] || 50;
  const prob = pCorrect(state.ability, diffWeight);
  const lr = BASE_LEARNING_RATE / (1 + state.totalAnswered * 0.03);
  const timeSignal = classifyResponseTime(timeMs, isCorrect);
  const timeMult = getTimeMultiplier(timeSignal);

  let newAbility = state.ability;
  let newStreak = state.streak;
  let newWrongStreak = state.wrongStreak;

  if (timeMult.abilityMult === 0) {
    // Guessing — don't update ability
    return {
      ...state,
      totalAnswered: state.totalAnswered + 1,
      difficultyHistory: [...state.difficultyHistory, { difficulty, correct: isCorrect, timeMs }],
      sessionFatigue: Math.min(1, state.totalAnswered / 50),
    };
  }

  if (isCorrect) {
    const surprise = 1 - prob;
    newAbility += lr * surprise * timeMult.abilityMult;
    newStreak = state.streak + 1;
    newWrongStreak = 0;

    // Streak bonus (3+ correct)
    if (newStreak >= 3) {
      newAbility += lr * 0.12 * Math.min(newStreak - 2, 5);
    }
  } else {
    const surprise = prob;
    newAbility -= lr * surprise * timeMult.abilityMult;
    newWrongStreak = state.wrongStreak + 1;
    newStreak = 0;

    // Wrong streak penalty (3+ wrong)
    if (newWrongStreak >= 3) {
      newAbility -= lr * 0.08 * Math.min(newWrongStreak - 2, 3);
    }
  }

  newAbility = Math.max(5, Math.min(95, newAbility));

  // Momentum detection
  const recent5 = [...state.difficultyHistory.slice(-4), { difficulty, correct: isCorrect, timeMs }];
  const recentCorrect = recent5.filter((h) => h.correct).length;
  const momentum: "rising" | "stable" | "falling" =
    recentCorrect >= 4 ? "rising" : recentCorrect <= 1 ? "falling" : "stable";

  return {
    ability: newAbility,
    streak: newStreak,
    wrongStreak: newWrongStreak,
    totalAnswered: state.totalAnswered + 1,
    totalCorrect: state.totalCorrect + (isCorrect ? 1 : 0),
    difficultyHistory: [...state.difficultyHistory, { difficulty, correct: isCorrect, timeMs }],
    momentum,
    sessionFatigue: Math.min(1, (state.totalAnswered + 1) / 50),
  };
}

// ─── Per-Topic Ability Update (for database persistence) ───

export function updateTopicAbility(
  current: TopicAbilityState,
  isCorrect: boolean,
  difficulty: string,
  timeMs: number
): TopicAbilityState {
  const diffWeight = DIFFICULTY_WEIGHT[difficulty] || 50;
  const prob = pCorrect(current.ability, diffWeight);
  const lr = BASE_LEARNING_RATE / (1 + current.totalAttempts * 0.05);
  const timeSignal = classifyResponseTime(timeMs, isCorrect);
  const timeMult = getTimeMultiplier(timeSignal);

  let newAbility = current.ability;

  if (timeMult.abilityMult > 0) {
    if (isCorrect) {
      newAbility += lr * (1 - prob) * timeMult.abilityMult;
    } else {
      newAbility -= lr * prob * timeMult.abilityMult;
    }
  }

  // Streak effects
  let newStreak = current.currentStreak;
  if (isCorrect) {
    newStreak = newStreak >= 0 ? newStreak + 1 : 1;
    if (newStreak >= 3) newAbility += lr * 0.1 * Math.min(newStreak - 2, 5);
  } else {
    newStreak = newStreak <= 0 ? newStreak - 1 : -1;
    if (newStreak <= -3) newAbility -= lr * 0.08 * Math.min(Math.abs(newStreak) - 2, 3);
  }

  newAbility = Math.max(5, Math.min(95, newAbility));

  // Confidence increases with data
  const newConfidence = Math.min(1, current.confidence + 0.04 * timeMult.confidenceMult);

  // Recent results (keep last 10)
  const newRecent = [...current.recentResults, isCorrect].slice(-MAX_RECENT_RESULTS);

  // Running average time
  const newAvgTime = current.avgTimeMs
    ? Math.round((current.avgTimeMs * current.totalAttempts + timeMs) / (current.totalAttempts + 1))
    : timeMs;

  // Spaced repetition update (SM-2 variant)
  let newEase = current.easeFactor;
  let newInterval = current.intervalDays;

  if (isCorrect) {
    // Correct: increase interval
    const recentAcc = newRecent.filter(Boolean).length / newRecent.length;
    if (recentAcc >= 0.8) {
      newEase = Math.max(1.3, newEase + 0.1);
      newInterval = current.intervalDays * newEase;
    } else {
      newInterval = current.intervalDays * 1.2;
    }
  } else {
    // Wrong: reset interval, decrease ease
    newEase = Math.max(1.3, newEase - 0.2);
    newInterval = 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + Math.ceil(newInterval));

  return {
    ...current,
    ability: newAbility,
    confidence: newConfidence,
    totalAttempts: current.totalAttempts + 1,
    totalCorrect: current.totalCorrect + (isCorrect ? 1 : 0),
    recentResults: newRecent,
    avgTimeMs: newAvgTime,
    currentStreak: newStreak,
    lastPracticedAt: new Date(),
    intervalDays: newInterval,
    easeFactor: newEase,
    nextReviewAt: nextReview,
  };
}

// ─── Forgetting Curve ───

export function applyForgettingCurve(ability: number, daysSinceLastPractice: number): number {
  if (daysSinceLastPractice <= 0) return ability;
  return ability * Math.pow(FORGETTING_DECAY, daysSinceLastPractice);
}

// ─── Next Difficulty Selection ───

export function getNextDifficulty(state: AdaptiveState): "EASY" | "MEDIUM" | "HARD" {
  const ability = state.ability;

  // First 3 questions: calibrate with medium
  if (state.totalAnswered < 3) return "MEDIUM";

  // Apply momentum adjustments
  let adjustedAbility = ability;
  if (state.momentum === "rising") adjustedAbility += 8;
  if (state.momentum === "falling") adjustedAbility -= 8;

  // Session fatigue: slightly reduce difficulty late in session
  adjustedAbility -= state.sessionFatigue * 5;

  // 70/20/10 pattern with zone targeting
  const rand = Math.random();

  if (adjustedAbility < 30) {
    return rand < 0.65 ? "EASY" : rand < 0.95 ? "MEDIUM" : "HARD";
  }
  if (adjustedAbility < 50) {
    return rand < 0.25 ? "EASY" : rand < 0.80 ? "MEDIUM" : "HARD";
  }
  if (adjustedAbility < 70) {
    return rand < 0.12 ? "EASY" : rand < 0.60 ? "MEDIUM" : "HARD";
  }
  // High ability
  return rand < 0.05 ? "EASY" : rand < 0.30 ? "MEDIUM" : "HARD";
}

// ─── Question Selection ───

export function selectNextQuestion(
  remaining: QuestionMeta[],
  targetDifficulty: string,
  answeredIds: Set<string>
): string | null {
  const available = remaining.filter((q) => !answeredIds.has(q.id));
  if (available.length === 0) return null;

  // Prefer target difficulty
  const matching = available.filter((q) => q.difficulty === targetDifficulty);
  if (matching.length > 0) {
    return matching[Math.floor(Math.random() * matching.length)].id;
  }

  // Fallback order
  const fallbacks: Record<string, string[]> = {
    EASY: ["MEDIUM", "HARD"],
    MEDIUM: ["EASY", "HARD"],
    HARD: ["MEDIUM", "EASY"],
  };

  for (const fb of (fallbacks[targetDifficulty] || [])) {
    const fbMatches = available.filter((q) => q.difficulty === fb);
    if (fbMatches.length > 0) {
      return fbMatches[Math.floor(Math.random() * fbMatches.length)].id;
    }
  }

  return available[Math.floor(Math.random() * available.length)].id;
}

// ─── JAMB Score Prediction ───

export function predictJambScore(
  subjectAbilities: Record<string, number>, // subject -> weighted average ability
  subjects: string[] // [English, subj2, subj3, subj4]
): number {
  if (subjects.length !== 4) return 0;

  let totalScore = 0;
  for (let i = 0; i < subjects.length; i++) {
    const ability = subjectAbilities[subjects[i]] || 50;
    const questionCount = i === 0 ? 60 : 40;
    // Map ability (0-100) to expected correct answers
    // Using sigmoid: at ability 50, expect ~50% correct
    const expectedCorrectRate = 1 / (1 + Math.exp(-0.06 * (ability - 50)));
    const expectedCorrect = Math.round(expectedCorrectRate * questionCount);
    totalScore += expectedCorrect;
  }

  // Scale to 400 (180 questions total, each worth 400/180 ≈ 2.22)
  return Math.round((totalScore / 180) * 400);
}

// ─── Generate Insights ───

export interface Insight {
  type: "strength" | "weakness" | "improvement" | "risk" | "recommendation";
  title: string;
  body: string;
  metric?: number;
  subject?: string;
  topicName?: string;
}

export function generateInsights(
  abilities: TopicAbilityState[],
  subjects: string[]
): Insight[] {
  const insights: Insight[] = [];

  if (abilities.length === 0) return insights;

  // Sort by ability
  const sorted = [...abilities].sort((a, b) => a.ability - b.ability);
  const weakest = sorted.slice(0, 3);
  const strongest = sorted.slice(-3).reverse();

  // Weaknesses
  for (const w of weakest) {
    if (w.ability < 40 && w.confidence > 0.3) {
      insights.push({
        type: "weakness",
        title: `${w.topicId} needs urgent attention`,
        body: `Your ability in this topic is ${Math.round(w.ability)}%. ${w.totalAttempts >= 5 ? `You've attempted ${w.totalAttempts} questions and gotten ${w.totalCorrect} right.` : "More practice data will improve this estimate."}`,
        metric: Math.round(w.ability),
        subject: w.subject,
      });
    }
  }

  // Strengths
  for (const s of strongest) {
    if (s.ability > 75 && s.confidence > 0.4) {
      insights.push({
        type: "strength",
        title: `Strong in this topic`,
        body: `${Math.round(s.ability)}% mastery with ${s.totalCorrect}/${s.totalAttempts} correct. Keep it sharp with occasional review.`,
        metric: Math.round(s.ability),
        subject: s.subject,
      });
    }
  }

  // Topics due for review (spaced repetition)
  const overdue = abilities.filter((a) => a.nextReviewAt && new Date(a.nextReviewAt) < new Date());
  if (overdue.length > 0) {
    insights.push({
      type: "recommendation",
      title: `${overdue.length} topics due for review`,
      body: "These topics are at risk of being forgotten. A quick drill session would lock them in.",
      metric: overdue.length,
    });
  }

  // Topics with forgetting decay
  const decaying = abilities.filter((a) => {
    if (!a.lastPracticedAt) return false;
    const days = (Date.now() - new Date(a.lastPracticedAt).getTime()) / (1000 * 60 * 60 * 24);
    return days > 7 && a.ability > 50;
  });

  if (decaying.length > 0) {
    insights.push({
      type: "risk",
      title: `${decaying.length} topics may be fading`,
      body: "You haven't practiced these in over a week. Knowledge decays without reinforcement.",
      metric: decaying.length,
    });
  }

  return insights;
}