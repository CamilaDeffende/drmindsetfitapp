// MF_NEON_UIKIT_V1

type Variant = "primary" | "ghost" | "neonGreen" | "neonPurple" | "neonBlue";

const variantClass: Record<Variant, string> = {
  primary: "mf-btn-primary",
  ghost:
    "rounded-[1.1rem] border border-mf-border/80 bg-mf-panel2/40 text-mf-text hover:bg-mf-panel2/60",
  neonBlue:
    "rounded-[1.1rem] border border-mf-neonBlue/35 bg-mf-panel2/40 text-mf-text shadow-mf-glow-blue hover:bg-mf-panel2/60",
  neonPurple:
    "rounded-[1.1rem] border border-mf-neonPurple/35 bg-mf-panel2/40 text-mf-text shadow-mf-glow-purple hover:bg-mf-panel2/60",
  neonGreen:
    "rounded-[1.1rem] border border-mf-neonGreen/35 bg-mf-panel2/40 text-mf-text shadow-mf-glow-green hover:bg-mf-panel2/60",
};

export type MFButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function MFButton({ variant = "primary", className = "", ...props }: MFButtonProps) {
  return (
    <button
      {...props}
      className={`mf-focus-ring px-4 py-2 text-sm font-semibold ${variantClass[variant]} ${className}`.trim()}
    />
  );
}
