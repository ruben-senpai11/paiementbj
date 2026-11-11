/**
 * Grille spatiale et dimensions ergonomiques (Touch Target >= 48dp pour Android/WCAG AAA).
 */

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const layout = {
  screenPaddingMobile: 20,
  screenPaddingDesktop: 32,
  minTouchTarget: 48, // Exigence Android et WCAG 2.5.8 Target Size
  primaryButtonHeight: 54,
  inputHeight: 52,
  borderRadius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    full: 9999,
  },
} as const;
