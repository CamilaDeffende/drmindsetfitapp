import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "thin";
};

export function MFGlassCard({ variant = "default", className, ...rest }: Props) {
  const pad = variant === "thin" ? "12px" : "14px";
  return (
    <div
      className={["mf-glass", className].filter(Boolean).join(" ")}
      style={{ padding: pad }}
      {...rest}
    />
  );
}
