type Props = {
  size?: number;
  className?: string;
  alt?: string;
};

export function BrandIcon({ size = 64, className = "", alt = "MindsetFit" }: Props) {
  return (
    <img
      src="/brand/mindsetfit-logo.png"
      alt={alt}
      draggable={false}
      style={{ width: size, height: size }}
      className={("select-none object-contain " + className).trim()}
    />
  );
}
