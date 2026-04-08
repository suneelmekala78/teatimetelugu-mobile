import { Platform } from "react-native";

/* ─── Brand Colors ─── */
export const Brand = {
  primary: "#F25A23",
  primaryDark: "#D94A18",
  secondary: "#FF2D75",
  accent: "#FF5E62",
  gradient: ["#F25A23", "#FF2D75"] as const,
};

/* ─── Light / Dark palettes ─── */
export const Colors = {
  light: {
    text: "#1A1A2E",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    background: "#F5F5F7",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    border: "#E5E7EB",
    borderLight: "#F3F4F6",
    tint: Brand.primary,
    icon: "#6B7280",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: Brand.primary,
    tabBar: "#FFFFFF",
    tabBarBorder: "#E5E7EB",
    statusBar: Brand.primary,
    navBar: "#FFFFFF",
    cardShadow: "rgba(0,0,0,0.08)",
    skeleton: "#E5E7EB",
    overlay: "rgba(0,0,0,0.5)",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
    background: "#0D0D12",
    surface: "#1A1A24",
    surfaceElevated: "#222230",
    border: "#2D2D3A",
    borderLight: "#1F1F2C",
    tint: Brand.primary,
    icon: "#9CA3AF",
    tabIconDefault: "#6B7280",
    tabIconSelected: Brand.primary,
    tabBar: "#1A1A24",
    tabBarBorder: "#2D2D3A",
    statusBar: "#0D0D12",
    navBar: "#1A1A24",
    cardShadow: "rgba(0,0,0,0.3)",
    skeleton: "#2D2D3A",
    overlay: "rgba(0,0,0,0.7)",
    error: "#F87171",
    success: "#34D399",
    warning: "#FBBF24",
  },
};

/* ─── Spacing ─── */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/* ─── Border Radius ─── */
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

/* ─── Font Sizes ─── */
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
} as const;

/* ─── Fonts ─── */
export const TeluguFont = "Mallanna";

export const Fonts = Platform.select({
  ios: {
    sans: TeluguFont,
    serif: "Georgia",
    mono: "Menlo",
  },
  default: {
    sans: TeluguFont,
    serif: "serif",
    mono: "monospace",
  },
}) as { sans: string; serif: string; mono: string };

/* ─── Shadows ─── */
export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

