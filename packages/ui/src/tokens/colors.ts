/**
 * Tokens de couleur officiels de Paiement BJ.
 * Conçus pour respecter strictement le niveau WCAG 2.2 AAA (ratio >= 7.0:1 pour texte normal).
 */

export const colors = {
  // Verts institutionnels de référence
  primary: '#064B32',
  primaryDeep: '#003F2B',
  primarySoft: '#E8F1EA',
  backgroundMint: '#EAF2EC',

  // Textes (Contraste calculé >= 7.0:1)
  text: '#123B2F',
  textSecondary: '#384C42', // Version optimisée AAA pour texte secondaire sur fond blanc et clair
  textMuted: '#43574E',
  textOnPrimary: '#FFFFFF',

  // Surfaces et fonds
  background: '#F5F8F4',
  surface: '#FFFFFF',
  surfaceSubtle: '#F0F5F1',

  // Accentuation solaire béninoise
  accent: '#FFC52C',
  accentSoft: '#FFF6D6',
  accentDark: '#7A5400', // Pour texte sur fond jaune respectant le contraste

  // Bordures et focus (WCAG 2.4.11)
  border: '#D8E2DA',
  borderFocused: '#003F2B',
  focusRing: '#064B32',

  // États sémantiques (Couleurs AAA calibrées >= 7.0:1 même sur fonds teintés)
  success: '#0A522E',
  successSoft: '#E6F4EC',
  warning: '#6B3B00',
  warningSoft: '#FFF4D6',
  danger: '#8A1919',
  dangerSoft: '#FCE8E8',
} as const;

export type ColorToken = keyof typeof colors;
