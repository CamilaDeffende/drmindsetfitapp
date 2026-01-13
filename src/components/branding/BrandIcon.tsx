
type Props = {
  className?: string;
  alt?: string;
  title?: string;
};

/**
 * BrandIcon
 * Renderiza a logo oficial do MindsetFit (PNG transparente) preservando className.
 * Use como substituto direto de ícones do tipo User/UserCircle em headers/cards.
 */
export function BrandIcon({ className, alt = "MindsetFit", title }: Props) {
  return (
    <img
      src="/brand/mindsetfit-logo.png"
      alt={alt}
      title={title}
      className={className ?? "w-6 h-6"}
      draggable={false}
    />
  );
}
