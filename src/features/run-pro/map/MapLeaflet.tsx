import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

type Props = {
  center: { lat: number; lng: number };
  path?: Array<{ lat: number; lng: number }>;
  zoom?: number;
  heightClassName?: string;
};

export function MapLeaflet({ center, path = [], zoom = 15, heightClassName = "h-[320px]" }: Props) {
  const poly: LatLngExpression[] = path.map((p) => [p.lat, p.lng]);

  return (
    <div className={`w-full overflow-hidden rounded-2xl border bg-card ${heightClassName}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[center.lat, center.lng]} />
        {poly.length >= 2 && <Polyline positions={poly} />}
      </MapContainer>
    </div>
  );
}
