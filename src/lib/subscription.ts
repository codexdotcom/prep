import { db } from "./db";
import { PLANS, type PlanKey } from "./paystack";

export async function getUserPlan(userId: string): Promise<{
  plan: PlanKey;
  isActive: boolean;
  limits: (typeof PLANS)[PlanKey]["limits"];
  expiresAt: Date | null;
}> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.status !== "ACTIVE" || subscription.plan === "FREE") {
    return {
      plan: "FREE",
      isActive: true,
      limits: PLANS.FREE.limits,
      expiresAt: null,
    };
  }

  // Check expiry
  if (subscription.currentPeriodEnd && new Date() > subscription.currentPeriodEnd) {
    await db.subscription.update({
      where: { userId },
      data: { status: "EXPIRED", plan: "FREE" },
    });
    return {
      plan: "FREE",
      isActive: true,
      limits: PLANS.FREE.limits,
      expiresAt: null,
    };
  }

  const plan = subscription.plan as PlanKey;
  return {
    plan,
    isActive: true,
    limits: PLANS[plan].limits,
    expiresAt: subscription.currentPeriodEnd,
  };
}

export async function checkDailyQuestionLimit(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const { limits } = await getUserPlan(userId);

  if (limits.dailyQuestions === Infinity) {
    return { allowed: true, used: 0, limit: Infinity, remaining: Infinity };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCount = await db.questionResponse.count({
    where: {
      userId,
      answeredAt: { gte: today },
    },
  });

  return {
    allowed: todayCount < limits.dailyQuestions,
    used: todayCount,
    limit: limits.dailyQuestions,
    remaining: Math.max(0, limits.dailyQuestions - todayCount),
  };
}

export async function checkFeatureAccess(
  userId: string,
  feature: "aiTutor" | "analytics" | "studyPlan" | "mockExams"
): Promise<boolean> {
  const { limits } = await getUserPlan(userId);
  return !!limits[feature];
}