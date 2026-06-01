"use client";

import { useState, useCallback } from "react";

interface ExplanationData {
  explanation: string;
  source: "ai" | "stored";
  isCorrect: boolean | null;
  correctOption?: string;
}

export function useExplanation() {
  const [data, setData] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = useCallback(
    async (questionId: string, studentAnswer?: string) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/ai/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, studentAnswer }),
        });

        const result = await res.json();

        if (!res.ok) {
          setError(result.error || "Failed to get explanation");
          return;
        }

        setData(result);
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clear = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, fetchExplanation, clear };
}