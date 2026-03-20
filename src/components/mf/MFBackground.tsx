import React from "react";

type Props = { children: React.ReactNode; className?: string };

export function MFBackground({ children, className }: Props) {
  return (
    <div className={["mf-app", className].filter(Boolean).join(" ")}>
      <div className="mf-grid" />
      <div className="mf-noise" />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
