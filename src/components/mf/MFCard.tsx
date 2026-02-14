// MF_NEON_UIKIT_V1

type Glow = "none" | "blue" | "purple" | "green";
type Tone = "default" | "soft";

export type MFCardProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  glow?: Glow;
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
};

const glowClass: Record<Glow, string> = {
  none: "",
  blue: "mf-panel-glow-blue",
  purple: "mf-panel-glow-purple",
  green: "mf-panel-glow-green",
};

const toneClass: Record<Tone, string> = {
  default: "",
  soft: "bg-mf-panel2/70",
};

export function MFCard({
  title,
  subtitle,
  rightSlot,
  glow = "none",
  tone = "default",
  className = "",
  children,
}: MFCardProps) {
  return (
    <section className={`mf-panel ${glowClass[glow]} ${toneClass[tone]} ${className}`.trim()}>
      {(title || subtitle || rightSlot) ? (
        <header className="px-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {title ? (
                <h2 className="text-base font-semibold tracking-tight">{title}</h2>
              ) : null}
              {subtitle ? (
                <p className="mt-1 text-sm mf-subtle">{subtitle}</p>
              ) : null}
            </div>
            {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
          </div>
        </header>
      ) : null}

      <div className={`${(title || subtitle || rightSlot) ? "px-5 pb-5 pt-4" : "p-5"}`}>
        {children}
      </div>
    </section>
  );
}
