/**
 * Typographie officielle Paiement BJ :
 * - Outfit pour les titres et surfaces d'impact
 * - DM Sans pour le corps d'interface, boutons et données tabulaires
 */

export const typography = {
  fonts: {
    title: 'Outfit',
    body: 'DMSans',
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
  sizes: {
    h1: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700' as const,
      fontFamily: 'Outfit',
    },
    h2: {
      fontSize: 22,
      lineHeight: 30,
      fontWeight: '700' as const,
      fontFamily: 'Outfit',
    },
    h3: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600' as const,
      fontFamily: 'Outfit',
    },
    bodyLarge: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '400' as const,
      fontFamily: 'DMSans',
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
      fontFamily: 'DMSans',
    },
    bodyMedium: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500' as const,
      fontFamily: 'DMSans',
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
      fontFamily: 'DMSans',
    },
    caption: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      fontFamily: 'DMSans',
    },
    amountDisplay: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '800' as const,
      fontFamily: 'Outfit',
      fontVariant: ['tabular-nums'] as const,
    },
  },
} as const;
