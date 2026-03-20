import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  leftIcon?: React.ReactNode;
};

export function MFNeonButton({ leftIcon, className, children, ...rest }: Props) {
  return (
    <button className={["mf-btn", className].filter(Boolean).join(" ")} {...rest}>
      {leftIcon ? <span style={{ display: "inline-flex" }}>{leftIcon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
