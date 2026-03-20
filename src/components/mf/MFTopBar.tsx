import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function MFTopBar({ title, subtitle, left, right }: Props) {
  return (
    <div
      style={{
        padding: "14px var(--mf-pad-screen-x) 10px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {left}
        <div>
          <div className="mf-title">{title}</div>
          {subtitle ? <div className="mf-subtitle">{subtitle}</div> : null}
        </div>
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}
