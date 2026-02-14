// MF_NEON_UIKIT_V1

type BadgeTone = "default" | "blue" | "purple" | "green";

const toneClass: Record<BadgeTone, string> = {
  default: "",
  blue: "border-mf-neonBlue/35 bg-mf-panel2/70 shadow-mf-glow-blue",
  purple: "border-mf-neonPurple/35 bg-mf-panel2/70 shadow-mf-glow-purple",
  green: "border-mf-neonGreen/35 bg-mf-panel2/70 shadow-mf-glow-green",
};

export function MFBadge({
  children,
  tone = "default",
  className = "",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={`mf-badge ${toneClass[tone]} ${className}`.trim()}>
      {children}
    </span>
  );
}
