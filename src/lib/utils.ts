export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getScoreColor(score: number): string {
  if (score >= 300) return "var(--color-tier-elite)";
  if (score >= 250) return "var(--color-tier-top)";
  if (score >= 200) return "var(--color-tier-competitive)";
  return "var(--color-tier-solid)";
}

export function getScoreLabel(score: number): string {
  if (score >= 300) return "Elite";
  if (score >= 250) return "Top Tier";
  if (score >= 200) return "Competitive";
  return "Keep Pushing";
}