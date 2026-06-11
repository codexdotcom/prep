export const AMBASSADOR_TIERS = [
  {
    key: "STARTER" as const,
    label: "Starter",
    title: "Student Partner",
    min: 0,
    color: "#9ca3af",
    perVerified: 300,
    perPremium: 0,
    perSchool: 0,
    rewards: ["Personal referral link", "Track your signups"],
  },
  {
    key: "BRONZE" as const,
    label: "Bronze",
    title: "Admission Ambassador",
    min: 10,
    color: "#CD7F32",
    perVerified: 500,
    perPremium: 1000,
    perSchool: 0,
    rewards: ["JambOS Premium (free)", "Ambassador badge", "₦500 per verified referral"],
  },
  {
    key: "SILVER" as const,
    label: "Silver",
    title: "Silver Ambassador",
    min: 50,
    color: "#C0C0C0",
    perVerified: 750,
    perPremium: 1500,
    perSchool: 10000,
    rewards: ["₦750 per verified referral", "₦1,500 per premium upgrade", "Certificate", "Ambassador leaderboard"],
  },
  {
    key: "GOLD" as const,
    label: "Gold",
    title: "Gold Ambassador",
    min: 200,
    color: "#FFD700",
    perVerified: 1000,
    perPremium: 1500,
    perSchool: 25000,
    rewards: ["₦1,000 per verified referral", "Early feature access", "Featured profile", "School Captain eligible"],
  },
  {
    key: "DIAMOND" as const,
    label: "Diamond",
    title: "Diamond Ambassador",
    min: 500,
    color: "#B9F2FF",
    perVerified: 1500,
    perPremium: 2000,
    perSchool: 50000,
    rewards: ["₦1,500 per verified referral", "Exclusive mentorship", "Public recognition", "Priority payouts"],
  },
  {
    key: "LEGEND" as const,
    label: "Legend",
    title: "Legend Ambassador",
    min: 1000,
    color: "#a78bfa",
    perVerified: 2000,
    perPremium: 2500,
    perSchool: 100000,
    rewards: ["₦2,000 per verified referral", "Internship opportunities", "Annual awards ceremony", "Revenue share"],
  },
] as const;

export type TierKey = (typeof AMBASSADOR_TIERS)[number]["key"];

export function getTier(key: string) {
  return AMBASSADOR_TIERS.find((t) => t.key === key) || AMBASSADOR_TIERS[0];
}

export function computeTier(verifiedReferrals: number): TierKey {
  // Walk backwards to find highest qualifying tier
  for (let i = AMBASSADOR_TIERS.length - 1; i >= 0; i--) {
    if (verifiedReferrals >= AMBASSADOR_TIERS[i].min) {
      return AMBASSADOR_TIERS[i].key;
    }
  }
  return "STARTER";
}

export function getNextTier(currentKey: string) {
  const idx = AMBASSADOR_TIERS.findIndex((t) => t.key === currentKey);
  if (idx < AMBASSADOR_TIERS.length - 1) return AMBASSADOR_TIERS[idx + 1];
  return null;
}

export function getEarningsForTier(tierKey: string) {
  const tier = getTier(tierKey);
  return {
    perVerified: tier.perVerified,
    perPremium: tier.perPremium,
    perSchool: tier.perSchool,
  };
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

export function potentialEarnings(tierKey: string): string {
  const tier = getTier(tierKey);
  const nextTier = getNextTier(tierKey);
  const maxReferrals = nextTier ? nextTier.min - 1 : 2000;
  const total = maxReferrals * tier.perVerified;
  return formatNaira(total);
}