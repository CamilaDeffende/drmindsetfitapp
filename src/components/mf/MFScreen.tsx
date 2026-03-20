import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function MFScreen({ children, className }: Props) {
  return (
    <div
      className={className}
      style={{
        padding: "var(--mf-pad-screen-y) var(--mf-pad-screen-x) 18px",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      {children}
    </div>
  );
}
