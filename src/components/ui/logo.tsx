export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizes = {
    small: "text-xl",
    default: "text-2xl",
    large: "text-4xl",
  };

  return (
    <div className={`${sizes[size]} font-bold tracking-tight`}>
      <span className="text-white">Jamb</span>
      <span className="text-accent-green">OS</span>
      <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-accent-green animate-pulse" />
    </div>
  );
}