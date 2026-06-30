import { SubscriptionTier } from "@prisma/client";

export interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  price: number; // in Naira
  priceLabel: string;
  period: string;
  features: string[];
  limits: Record<string, number>; // -1 = unlimited
  highlight?: boolean;
  badge?: string;
}

export const PLANS: PlanConfig[] = [
  {
    tier: "FREE",
    name: "Free",
    price: 0,
    priceLabel: "Free",
    period: "",
    features: [
      "Dashboard with basic analytics",
      "2 quizzes per day",
      "1 flashcard deck per week",
      "Quick explainer only",
      "1 arcade game per day",
      "10 chat messages per day",
      "Basic study drills",
    ],
    limits: {
      quizfetch: 2,
      flashcards: 1,
      essay: 0,
      "audio-recap": 0,
      "visual-explainer": 1,
      "explainer-video": 0,
      "record-lecture": 0,
      call: 0,
      chat: 10,
      arcade: 1,
      explainer: 3,
    },
  },
  {
    tier: "BASIC",
    name: "Basic",
    price: 3000,
    priceLabel: "3,000",
    period: "/month",
    features: [
      "Everything in Free",
      "Unlimited quizzes",
      "Full study system",
      "5 flashcard decks per day",
      "Full arcade access",
      "Explainer (all depths)",
      "50 chat messages per day",
    ],
    limits: {
      quizfetch: -1,
      flashcards: 5,
      essay: 0,
      "audio-recap": 0,
      "visual-explainer": 3,
      "explainer-video": 0,
      "record-lecture": 0,
      call: 0,
      chat: 50,
      arcade: -1,
      explainer: -1,
    },
  },
  {
    tier: "STANDARD",
    name: "Standard",
    price: 8000,
    priceLabel: "8,000",
    period: "/month",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Everything in Basic",
      "Essay Grader with full breakdown",
      "Audio Recap generator",
      "Visual Explainer (unlimited)",
      "Advanced analytics",
      "100 chat messages per day",
      "Spaced repetition engine",
    ],
    limits: {
      quizfetch: -1,
      flashcards: -1,
      essay: -1,
      "audio-recap": -1,
      "visual-explainer": -1,
      "explainer-video": 0,
      "record-lecture": 0,
      call: 0,
      chat: 100,
      arcade: -1,
      explainer: -1,
    },
  },
  {
    tier: "PREMIUM",
    name: "Premium",
    price: 18000,
    priceLabel: "18,000",
    period: "/month",
    features: [
      "Everything in Standard",
      "Explainer Video generator",
      "Record Lecture (AI notes + PDF)",
      "Unlimited chat",
      "Priority AI processing",
      "Advanced adaptive engine",
      "Risk optimization system",
    ],
    limits: {
      quizfetch: -1,
      flashcards: -1,
      essay: -1,
      "audio-recap": -1,
      "visual-explainer": -1,
      "explainer-video": -1,
      "record-lecture": -1,
      call: 0,
      chat: -1,
      arcade: -1,
      explainer: -1,
    },
  },
  {
    tier: "ELITE",
    name: "Elite",
    price: 35000,
    priceLabel: "35,000",
    period: "/month",
    badge: "Best Results",
    features: [
      "Everything in Premium",
      "Live Voice Tutor calls",
      "4 tutor sessions per month",
      "Personalized study plan engine",
      "Exam prediction insights",
      "AI + human hybrid coaching",
    ],
    limits: {
      quizfetch: -1,
      flashcards: -1,
      essay: -1,
      "audio-recap": -1,
      "visual-explainer": -1,
      "explainer-video": -1,
      "record-lecture": -1,
      call: 4,
      chat: -1,
      arcade: -1,
      explainer: -1,
    },
  },
];

export const MICRO_PRICES: Record<string, { price: number; label: string }> = {
  quizfetch: { price: 200, label: "Extra quiz generation" },
  flashcards: { price: 150, label: "Extra flashcard deck" },
  essay: { price: 400, label: "Essay grading" },
  "audio-recap": { price: 300, label: "Audio recap" },
  "visual-explainer": { price: 200, label: "Visual analysis" },
  "explainer-video": { price: 500, label: "Explainer video" },
  "record-lecture": { price: 400, label: "Lecture notes" },
  call: { price: 2000, label: "Tutor call session" },
  chat: { price: 100, label: "10 extra messages" },
  arcade: { price: 100, label: "Extra game session" },
};

export function getPlan(tier: SubscriptionTier): PlanConfig {
  return PLANS.find((p) => p.tier === tier) || PLANS[0];
}

export function getLimit(tier: SubscriptionTier, feature: string): number {
  const plan = getPlan(tier);
  return plan.limits[feature] ?? 0;
}