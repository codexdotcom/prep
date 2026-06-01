import { db } from "./db";
import { randomBytes } from "crypto";

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await db.referralCode.findUnique({ where: { userId } });
  if (existing) return existing.code;

  // Generate a short, memorable code
  const code = `PG-${randomBytes(3).toString("hex").toUpperCase()}`;

  const created = await db.referralCode.create({
    data: { userId, code },
  });

  return created.code;
}

export async function applyReferralCode(
  newUserId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const referralCode = await db.referralCode.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!referralCode) {
    return { success: false, error: "Invalid referral code" };
  }

  if (referralCode.userId === newUserId) {
    return { success: false, error: "You can't refer yourself" };
  }

  // Check if already referred
  const existing = await db.referral.findUnique({
    where: { referredId: newUserId },
  });

  if (existing) {
    return { success: false, error: "You've already used a referral code" };
  }

  await db.referral.create({
    data: {
      referrerId: referralCode.userId,
      referredId: newUserId,
      referralCode: code.toUpperCase().trim(),
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  await db.referralCode.update({
    where: { id: referralCode.id },
    data: { uses: { increment: 1 } },
  });

  // Check if referrer has hit reward threshold
  await checkAndRewardReferrer(referralCode.userId);

  return { success: true };
}

async function checkAndRewardReferrer(referrerId: string) {
  const completedCount = await db.referral.count({
    where: { referrerId, status: { in: ["COMPLETED", "REWARDED"] } },
  });

  // Reward tiers
  const rewards = [
    { threshold: 3, days: 7 },    // 3 referrals = 1 week premium
    { threshold: 5, days: 30 },   // 5 referrals = 1 month premium
    { threshold: 10, days: 90 },  // 10 referrals = 3 months premium
    { threshold: 25, days: 365 }, // 25 referrals = 1 year premium
  ];

  for (const reward of rewards) {
    if (completedCount >= reward.threshold) {
      // Check if already rewarded for this tier
      const alreadyRewarded = await db.referral.count({
        where: { referrerId, status: "REWARDED" },
      });

      if (alreadyRewarded < reward.threshold) {
        // Grant premium access
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + reward.days);

        const existingSub = await db.subscription.findUnique({
          where: { userId: referrerId },
        });

        const currentEnd = existingSub?.currentPeriodEnd || new Date();
        const newEnd = currentEnd > new Date()
          ? new Date(currentEnd.getTime() + reward.days * 86400000)
          : periodEnd;

        await db.subscription.upsert({
          where: { userId: referrerId },
          update: {
            plan: "PRO",
            status: "ACTIVE",
            currentPeriodEnd: newEnd,
          },
          create: {
            userId: referrerId,
            plan: "PRO",
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: newEnd,
          },
        });

        // Mark referrals as rewarded
        await db.referral.updateMany({
          where: {
            referrerId,
            status: "COMPLETED",
          },
          data: { status: "REWARDED", rewardClaimed: true },
        });

        break;
      }
    }
  }
}

export async function getReferralStats(userId: string) {
  const [code, referrals, totalCount] = await Promise.all([
    getOrCreateReferralCode(userId),
    db.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            name: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.referral.count({
      where: { referrerId: userId, status: { in: ["COMPLETED", "REWARDED"] } },
    }),
  ]);

  const nextReward = totalCount < 3
    ? { threshold: 3, reward: "1 week Pro" }
    : totalCount < 5
    ? { threshold: 5, reward: "1 month Pro" }
    : totalCount < 10
    ? { threshold: 10, reward: "3 months Pro" }
    : totalCount < 25
    ? { threshold: 25, reward: "1 year Pro" }
    : null;

  return {
    code,
    referrals: referrals.map((r) => ({
      id: r.id,
      name: r.referred.name || "Student",
      image: r.referred.image,
      status: r.status,
      date: r.createdAt,
    })),
    totalCompleted: totalCount,
    nextReward,
    shareUrl: `https://jamb.os/join?ref=${code}`,
  };
}