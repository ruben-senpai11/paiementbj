/**
 * Outil de vérification et d'audit des contrastes conforme aux exigences WCAG 2.2 AAA.
 * Formules mathématiques officielles du W3C.
 */

export interface ContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  ratioFormatted: string;
  passesWcagAAANormal: boolean; // Seuil >= 7.0:1
  passesWcagAAALarge: boolean;  // Seuil >= 4.5:1
  passesWcagAANormal: boolean;  // Seuil >= 4.5:1
  passesWcagAALarge: boolean;   // Seuil >= 3.0:1
}

function parseHex(hex: string): [number, number, number] {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function channelLuminance(val: number): number {
  return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
}

export function calculateRelativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  const R = channelLuminance(r);
  const G = channelLuminance(g);
  const B = channelLuminance(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function calculateContrastRatio(foregroundHex: string, backgroundHex: string): ContrastResult {
  const lum1 = calculateRelativeLuminance(foregroundHex);
  const lum2 = calculateRelativeLuminance(backgroundHex);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  const ratio = (brightest + 0.05) / (darkest + 0.05);
  const roundedRatio = Math.round(ratio * 100) / 100;

  return {
    foreground: foregroundHex,
    background: backgroundHex,
    ratio: roundedRatio,
    ratioFormatted: `${roundedRatio.toFixed(2)}:1`,
    passesWcagAAANormal: roundedRatio >= 7.0,
    passesWcagAAALarge: roundedRatio >= 4.5,
    passesWcagAANormal: roundedRatio >= 4.5,
    passesWcagAALarge: roundedRatio >= 3.0,
  };
}
