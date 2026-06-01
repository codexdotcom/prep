"use client";

import { useState, useEffect } from "react";

interface Overview {
  predictedJambScore: number;
  riskLevel: string;
  totalQuestionsAttempted: number;
  totalTestsTaken: number;
  overallAccuracy: number;
  avgTimePerQuestion: number;
  speedRating: string;
  carelessErrorRate: number;
  bestStudyTime: string | null;
  targetScore: number;
}

interface SubjectStat {
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
  predictedScore: number;
  weakTopics: string[];
  strongTopics: string[];
}

interface TopicStat {
  topicId: string;
  topicName: string;
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
  avgTimeMs: number;
  carelessErrors: number;
}

interface ScoreTrendPoint {
  date: string;
  score: number;
  mode: string;
}

interface DifficultyBreakdown {
  easy: { correct: number; total: number; accuracy: number };
  medium: { correct: number; total: number; accuracy: number };
  hard: { correct: number; total: number; accuracy: number };
}

interface Recommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
  subject?: string;
  topicId?: string;
}

interface AnalyticsData {
  hasData: boolean;
  overview: Overview;
  subjectStats: SubjectStat[];
  topicStats: TopicStat[];
  scoreTrend: ScoreTrendPoint[];
  difficultyBreakdown: DifficultyBreakdown;
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [analyticsRes, recsRes] = await Promise.all([
          fetch("/api/analytics/diagnostic"),
          fetch("/api/analytics/recommendations"),
        ]);

        const analyticsData = await analyticsRes.json();
        const recsData = await recsRes.json();

        if (analyticsRes.ok) setData(analyticsData);
        else setError(analyticsData.error);

        if (recsRes.ok) setRecommendations(recsData.recommendations || []);
      } catch {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  return { data, recommendations, loading, error };
}