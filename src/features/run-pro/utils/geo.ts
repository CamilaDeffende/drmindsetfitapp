export function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// Haversine (metros)
export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// suavização simples (EMA)
export function ema(prev: number, next: number, alpha: number) {
  return prev + alpha * (next - prev);
}
