type Props = {
  size?: number;
  className?: string;
  alt?: string;
};

export function BrandIcon({ size = 28, className = "", alt = "MindsetFit" }: Props) {
  return (
    <img
      src="/brand/mindsetfit-icon.svg"
      width={size}
      height={size}
      alt={alt}
      className={className}
      style={{ display: "block" }}
    />
  );
}

export default BrandIcon;