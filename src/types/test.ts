export interface TestQuestion {
  id: string;
  body: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  subject: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic: {
    id: string;
    name: string;
  };
}

export interface TestSessionData {
  sessionId: string;
  questions: TestQuestion[];
  timeLimit: number;
  totalQuestions: number;
  mode: string;
}

export interface AnswerState {
  [questionId: string]: {
    selected: "A" | "B" | "C" | "D" | null;
    flagged: boolean;
    timeSpent: number;
    synced: boolean;
  };
}

export interface TestResult {
  score: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  timeTaken: number;
  topicAccuracy: Record<string, { correct: number; total: number }>;
  totalQuestions: number;
}