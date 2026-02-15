// MF_NEON_DS_V1
export const mfNeon = {
  hex: {
    neonBlue: "#34C9FF",
    neonPurple: "#B85CFF",
    neonGreen: "#2BFF88",
    bg: "#070B12",
    panel: "#0B1020",
    panel2: "#0E1630",
    text: "#F3F7FF",
    muted: "#B7C1D6",
    border: "#1E2A44",
    danger: "#FF3B5C",
    warn: "#FFB020",
    ok: "#2ED47A",
  },
  hsl: {
    neonBlue: "198 95% 60%",
    neonPurple: "270 92% 65%",
    neonGreen: "145 92% 55%",
  },
} as const;

export type MFNeonKey = keyof typeof mfNeon.hex;
