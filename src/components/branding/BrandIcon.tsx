type Props = {
  className?: string;
  size?: number;
  alt?: string;
};

export function BrandIcon({ className, size, alt }: Props) {
  const cls =
    className ??
    (typeof size === "number" ? `w-[${size}px] h-[${size}px]` : "w-6 h-6");

  return (
    <img
      src="/brand/mindsetfit-logo.png"
      alt={alt ?? "MindsetFit"}
      className={cls}
      draggable={false}
      loading="eager"
    />
  );
}
