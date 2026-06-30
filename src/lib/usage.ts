import { db } from "@/lib/db";
import { SubscriptionTier } from "@prisma/client";
import { getLimit } from "@/lib/plans";

interface UsageCheck {
  allowed: boolean;
  used: number;
  limit: number; // -1 = unlimited
  tier: SubscriptionTier;
  remaining: number; // -1 = unlimited
}

export async function checkUsage(userId: string, feature: string): Promise<UsageCheck> {
  // Get subscription
  const sub = await db.subscription.findUnique({ where: { userId } });
  const tier = sub?.tier || ("FREE" as SubscriptionTier);

  // Check if subscription is active
  if (sub && sub.endDate && new Date(sub.endDate) < new Date()) {
    // Expired - treat as free
    return checkWithTier(userId, feature, "FREE" as SubscriptionTier);
  }

  return checkWithTier(userId, feature, tier);
}

async function checkWithTier(userId: string, feature: string, tier: SubscriptionTier): Promise<UsageCheck> {
  const limit = getLimit(tier, feature);

  // Unlimited
  if (limit === -1) {
    return { allowed: true, used: 0, limit: -1, tier, remaining: -1 };
  }

  // Not available at all
  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0, tier, remaining: 0 };
  }

  // Count today's usage (or this week for flashcards on free)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dateFilter: Date;
  if (feature === "flashcards" && tier === "FREE") {
    // Weekly limit for free flashcards
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    dateFilter = weekAgo;
  } else if (feature === "call") {
    // Monthly limit for calls
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    dateFilter = monthStart;
  } else {
    dateFilter = today;
  }

  const records = await db.usageRecord.findMany({
    where: {
      userId,
      feature,
      date: { gte: dateFilter },
    },
  });

  const used = records.reduce((sum, r) => sum + r.count, 0);
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    used,
    limit,
    tier,
    remaining,
  };
}

export async function recordUsage(userId: string, feature: string, count: number = 1): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await db.usageRecord.upsert({
    where: { userId_feature_date: { userId, feature, date: today } },
    update: { count: { increment: count } },
    create: { userId, feature, date: today, count },
  });
}

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub) return "FREE" as SubscriptionTier;
  if (sub.endDate && new Date(sub.endDate) < new Date()) return "FREE" as SubscriptionTier;
  return sub.tier;
}