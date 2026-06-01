const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE_URL = "https://api.paystack.co";

interface PaystackResponse {
  status: boolean;
  message: string;
  data: any;
}

async function paystackRequest(
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: any
): Promise<PaystackResponse> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
  plan?: string;
}) {
  return paystackRequest("/transaction/initialize", "POST", {
    email: params.email,
    amount: params.amount,
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata,
    plan: params.plan,
  });
}

export async function verifyTransaction(reference: string) {
  return paystackRequest(`/transaction/verify/${reference}`);
}

export async function createPlan(params: {
  name: string;
  amount: number; // kobo
  interval: "monthly" | "yearly";
}) {
  return paystackRequest("/plan", "POST", {
    name: params.name,
    amount: params.amount,
    interval: params.interval,
  });
}

export async function cancelSubscription(subscriptionCode: string, emailToken: string) {
  return paystackRequest("/subscription/disable", "POST", {
    code: subscriptionCode,
    token: emailToken,
  });
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(body)
    .digest("hex");
  return hash === signature;
}

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    priceLabel: "₦0",
    features: [
      "20 questions per day",
      "Basic CBT simulator",
      "Limited past questions",
    ],
    limits: {
      dailyQuestions: 20,
      mockExams: 0,
      aiTutor: false,
      analytics: false,
      studyPlan: false,
    },
  },
  STARTER: {
    name: "Starter",
    price: 150000, // ₦1,500 in kobo
    priceLabel: "₦1,500",
    features: [
      "100 questions per day",
      "Full CBT simulator",
      "All past questions",
      "Basic analytics",
      "Study planner",
    ],
    limits: {
      dailyQuestions: 100,
      mockExams: 5,
      aiTutor: false,
      analytics: true,
      studyPlan: true,
    },
  },
  PRO: {
    name: "Pro",
    price: 300000, // ₦3,000 in kobo
    priceLabel: "₦3,000",
    popular: true,
    features: [
      "Unlimited questions",
      "Full mock exams",
      "AI Tutor",
      "Advanced analytics",
      "Personalized study plan",
      "Score prediction",
    ],
    limits: {
      dailyQuestions: Infinity,
      mockExams: Infinity,
      aiTutor: true,
      analytics: true,
      studyPlan: true,
    },
  },
  ELITE: {
    name: "Elite",
    price: 500000, // ₦5,000 in kobo
    priceLabel: "₦5,000",
    features: [
      "Everything in Pro",
      "Priority AI responses",
      "Detailed weak-topic reports",
      "Performance prediction model",
      "Early access to new features",
      "Email support",
    ],
    limits: {
      dailyQuestions: Infinity,
      mockExams: Infinity,
      aiTutor: true,
      analytics: true,
      studyPlan: true,
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;