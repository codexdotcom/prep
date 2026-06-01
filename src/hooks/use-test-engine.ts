"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { TestQuestion, AnswerState, TestResult } from "@/types/test";

interface UseTestEngineProps {
  sessionId: string;
  questions: TestQuestion[];
  timeLimit: number; // seconds, 0 = untimed
  onComplete: (result: TestResult) => void;
}

export function useTestEngine({
  sessionId,
  questions,
  timeLimit,
  onComplete,
}: UseTestEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const questionStartTime = useRef(Date.now());
  const syncQueue = useRef<string[]>([]);
  const isSyncing = useRef(false);

  const currentQuestion = questions[currentIndex];
  const totalAnswered = Object.values(answers).filter((a) => a.selected !== null).length;
  const totalFlagged = Object.values(answers).filter((a) => a.flagged).length;

  // Timer
  useEffect(() => {
    if (timeLimit === 0 || hasSubmitted) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit, hasSubmitted]);

  // Track time spent on current question
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentIndex]);

  // Background sync
  const syncAnswer = useCallback(
    async (questionId: string) => {
      syncQueue.current.push(questionId);

      if (isSyncing.current) return;
      isSyncing.current = true;

      while (syncQueue.current.length > 0) {
        const qid = syncQueue.current.shift()!;
        const answer = answers[qid];
        if (!answer) continue;

        try {
          await fetch(`/api/tests/${sessionId}/answer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionId: qid,
              selectedOption: answer.selected,
              timeSpent: answer.timeSpent,
              isFlagged: answer.flagged,
            }),
          });

          setAnswers((prev) => ({
            ...prev,
            [qid]: { ...prev[qid], synced: true },
          }));
        } catch {
          // Re-queue on failure
          syncQueue.current.push(qid);
        }
      }

      isSyncing.current = false;
    },
    [answers, sessionId]
  );

  const selectOption = useCallback(
    (option: "A" | "B" | "C" | "D") => {
      const qid = currentQuestion.id;
      const elapsed = Date.now() - questionStartTime.current;
      const prevTime = answers[qid]?.timeSpent ?? 0;

      setAnswers((prev) => ({
        ...prev,
        [qid]: {
          selected: prev[qid]?.selected === option ? null : option,
          flagged: prev[qid]?.flagged ?? false,
          timeSpent: prevTime + elapsed,
          synced: false,
        },
      }));

      questionStartTime.current = Date.now();
    },
    [currentQuestion, answers]
  );

  const toggleFlag = useCallback(() => {
    const qid = currentQuestion.id;
    setAnswers((prev) => ({
      ...prev,
      [qid]: {
        ...prev[qid],
        selected: prev[qid]?.selected ?? null,
        flagged: !(prev[qid]?.flagged ?? false),
        timeSpent: prev[qid]?.timeSpent ?? 0,
        synced: false,
      },
    }));
  }, [currentQuestion]);

  const goToQuestion = useCallback(
    (index: number) => {
      // Save time for current question before navigating
      const qid = currentQuestion.id;
      const elapsed = Date.now() - questionStartTime.current;
      const prevTime = answers[qid]?.timeSpent ?? 0;

      if (answers[qid]) {
        const updated = {
          ...answers[qid],
          timeSpent: prevTime + elapsed,
        };
        setAnswers((prev) => ({ ...prev, [qid]: updated }));
        syncAnswer(qid);
      }

      setCurrentIndex(Math.max(0, Math.min(index, questions.length - 1)));
    },
    [currentQuestion, answers, questions.length, syncAnswer]
  );

  const goNext = useCallback(() => {
    if (currentIndex < questions.length - 1) goToQuestion(currentIndex + 1);
  }, [currentIndex, questions.length, goToQuestion]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goToQuestion(currentIndex - 1);
  }, [currentIndex, goToQuestion]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || hasSubmitted) return;
    setIsSubmitting(true);

    // Sync any remaining answers
    const unsyncedIds = Object.entries(answers)
      .filter(([, a]) => !a.synced)
      .map(([id]) => id);

    for (const qid of unsyncedIds) {
      try {
        await fetch(`/api/tests/${sessionId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: qid,
            selectedOption: answers[qid].selected,
            timeSpent: answers[qid].timeSpent,
            isFlagged: answers[qid].flagged,
          }),
        });
      } catch {
        // Continue even if some fail
      }
    }

    try {
      const res = await fetch(`/api/tests/${sessionId}/submit`, {
        method: "POST",
      });
      const result = await res.json();
      setHasSubmitted(true);
      onComplete(result);
    } catch {
      setIsSubmitting(false);
    }
  }, [answers, sessionId, isSubmitting, hasSubmitted, onComplete]);

  return {
    currentQuestion,
    currentIndex,
    answers,
    timeRemaining,
    totalAnswered,
    totalFlagged,
    isSubmitting,
    hasSubmitted,
    selectOption,
    toggleFlag,
    goToQuestion,
    goNext,
    goPrev,
    handleSubmit,
  };
}