export const tokens = {
  colors: {
    bg: "#0B0B0B",
    panel: "#111827",
    panel2: "#0F172A",
    border: "#1F2937",
    text: "#E5E7EB",
    muted: "#9CA3AF",
    blue: "#0A84FF",
    green: "#00E676",
    red: "#EF4444",
    yellow: "#F59E0B",
  },
  radius: { lg: 18, xl: 22 },
  shadow: "0 12px 30px rgba(0,0,0,.35)",
};

export function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}
