import { db } from "../src/lib/db";

const ACHIEVEMENTS = [
  // Milestones
  { key: "first_test", title: "First Steps", description: "Complete your first test", icon: "🎯", category: "MILESTONE", requirement: 1, xpReward: 50 },
  { key: "tests_5", title: "Getting Serious", description: "Complete 5 tests", icon: "📝", category: "MILESTONE", requirement: 5, xpReward: 100 },
  { key: "tests_25", title: "Committed", description: "Complete 25 tests", icon: "💪", category: "MILESTONE", requirement: 25, xpReward: 250 },
  { key: "tests_100", title: "Centurion", description: "Complete 100 tests", icon: "🏛️", category: "MILESTONE", requirement: 100, xpReward: 500 },
  { key: "questions_500", title: "Half a Thousand", description: "Answer 500 questions", icon: "📚", category: "MILESTONE", requirement: 500, xpReward: 200 },
  { key: "questions_2000", title: "Knowledge Machine", description: "Answer 2000 questions", icon: "🤖", category: "MILESTONE", requirement: 2000, xpReward: 500 },

  // Streaks
  { key: "streak_3", title: "Three-peat", description: "3-day study streak", icon: "🔥", category: "STREAK", requirement: 3, xpReward: 75 },
  { key: "streak_7", title: "Week Warrior", description: "7-day study streak", icon: "⚡", category: "STREAK", requirement: 7, xpReward: 150 },
  { key: "streak_14", title: "Fortnight Force", description: "14-day study streak", icon: "🌟", category: "STREAK", requirement: 14, xpReward: 300 },
  { key: "streak_30", title: "Monthly Monster", description: "30-day study streak", icon: "👑", category: "STREAK", requirement: 30, xpReward: 750 },

  // Accuracy
  { key: "accuracy_80", title: "Sharpshooter", description: "Score 80%+ on a test", icon: "🎯", category: "ACCURACY", requirement: 80, xpReward: 100 },
  { key: "accuracy_90", title: "Sniper", description: "Score 90%+ on a test", icon: "🔫", category: "ACCURACY", requirement: 90, xpReward: 200 },
  { key: "perfect_test", title: "Flawless", description: "Score 100% on a test", icon: "💎", category: "ACCURACY", requirement: 100, xpReward: 500 },
  { key: "score_250", title: "250 Club", description: "Predicted score above 250", icon: "🏅", category: "ACCURACY", requirement: 250, xpReward: 300 },
  { key: "score_300", title: "300 Club", description: "Predicted score above 300", icon: "🏆", category: "ACCURACY", requirement: 300, xpReward: 500 },

  // Speed
  { key: "speed_demon", title: "Speed Demon", description: "Complete a timed test with 5+ minutes to spare", icon: "⏱️", category: "SPEED", requirement: 300, xpReward: 150 },
  { key: "quick_study", title: "Quick Study", description: "Answer 10 questions in under 5 minutes", icon: "💨", category: "SPEED", requirement: 10, xpReward: 100 },

  // Mastery
  { key: "topic_master", title: "Topic Master", description: "Score 90%+ on a topic with 20+ questions", icon: "🎓", category: "MASTERY", requirement: 90, xpReward: 200 },
  { key: "subject_master", title: "Subject Master", description: "Score 80%+ across all topics in a subject", icon: "📖", category: "MASTERY", requirement: 80, xpReward: 400 },
  { key: "all_subjects", title: "Renaissance Student", description: "Practice all 4 of your JAMB subjects", icon: "🌍", category: "MASTERY", requirement: 4, xpReward: 150 },
];

async function main() {
  for (const achievement of ACHIEVEMENTS) {
    await db.achievement.upsert({
      where: { key: achievement.key },
      update: achievement as any,
      create: achievement as any,
    });
  }
  console.log(`Seeded ${ACHIEVEMENTS.length} achievements`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());