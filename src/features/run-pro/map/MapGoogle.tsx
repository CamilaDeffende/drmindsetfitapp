type Props = {
  center: { lat: number; lng: number };
  path?: Array<{ lat: number; lng: number }>;
  heightClassName?: string;
};

// Compile-safe stub (sem depender do SDK). Quando habilitar de verdade,
// trocamos por @react-google-maps/api ou loader oficial.
export function MapGoogle({ center, heightClassName = "h-[320px]" }: Props) {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border bg-card ${heightClassName}`}>
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="text-sm font-semibold">Google Maps (Satellite)</div>
        <div className="text-xs text-muted-foreground">
          Provider configurado, mas SDK ainda não carregado neste build.
        </div>
        <div className="text-xs text-muted-foreground">
          Centro: {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
        </div>
      </div>
    </div>
  );
}
