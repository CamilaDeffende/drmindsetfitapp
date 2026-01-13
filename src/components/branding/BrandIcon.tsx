type Props = {
  size?: number;        // tamanho explícito em px
  className?: string;   // override opcional
  alt?: string;
};

export function BrandIcon({ size = 24, className, alt }: Props) {
  const style = size
    ? { width: size, height: "auto" }
    : undefined;

  return (
    <img
      src="/brand/mindsetfit-logo.png"
      alt={alt ?? "MindsetFit"}
      style={style}
      className={className ?? "w-5 h-5"}
      draggable={false}
      loading="eager"
    />
  );
}