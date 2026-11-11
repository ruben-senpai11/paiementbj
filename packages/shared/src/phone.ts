/**
 * Utilitaires de validation et normalisation des numéros de téléphone au Bénin (+229).
 * Prend en charge le plan à 8 chiffres historique et le plan à 10 chiffres (ARCEP 2024 avec préfixe 01).
 */

export type BeninOperator = 'MTN' | 'MOOV' | 'CELTIIS' | 'UNKNOWN';

export interface PhoneValidationResult {
  isValid: boolean;
  raw: string;
  normalized?: string; // Format E.164: +229XXXXXXXX ou +22901XXXXXXXX
  nationalFormat?: string; // Format lisible: "01 97 XX XX XX" ou "97 XX XX XX"
  operator: BeninOperator;
  error?: string;
}

const MTN_PREFIXES = ['51', '52', '53', '54', '56', '57', '59', '61', '62', '66', '67', '69', '90', '91', '96', '97'];
const MOOV_PREFIXES = ['45', '55', '60', '64', '65', '68', '94', '95'];
const CELTIIS_PREFIXES = ['40', '41', '42', '43', '44', '46', '47', '48', '49'];

export function detectBeninOperator(eightDigitPrefix: string): BeninOperator {
  const p = eightDigitPrefix.substring(0, 2);
  if (MTN_PREFIXES.includes(p)) return 'MTN';
  if (MOOV_PREFIXES.includes(p)) return 'MOOV';
  if (CELTIIS_PREFIXES.includes(p)) return 'CELTIIS';
  return 'UNKNOWN';
}

export function validateAndNormalizeBeninPhone(input: string): PhoneValidationResult {
  const raw = input.trim();
  if (!raw) {
    return { isValid: false, raw, operator: 'UNKNOWN', error: 'Veuillez saisir un numéro de téléphone.' };
  }

  // Nettoyage: supprimer espaces, tirets, parenthèses
  let cleaned = raw.replace(/[\s\-\(\)\.]/g, '');

  // Supprimer l'indicatif international si présent (+229 ou 00229)
  if (cleaned.startsWith('+229')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('00229')) {
    cleaned = cleaned.substring(5);
  } else if (cleaned.startsWith('229') && cleaned.length >= 11) {
    cleaned = cleaned.substring(3);
  }

  // Cas 1 : Plan à 10 chiffres ARCEP (commence par 01)
  if (cleaned.length === 10 && cleaned.startsWith('01')) {
    const core8 = cleaned.substring(2);
    const operator = detectBeninOperator(core8);
    const normalized = `+229${cleaned}`;
    const nationalFormat = `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    return {
      isValid: true,
      raw,
      normalized,
      nationalFormat,
      operator,
    };
  }

  // Cas 2 : Plan à 8 chiffres (standard historique encore largement utilisé)
  if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) {
    const operator = detectBeninOperator(cleaned);
    // Normaliser avec le format 10 chiffres ARCEP (+229 01 XXXXXXXX)
    const normalized = `+22901${cleaned}`;
    const nationalFormat = `01 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
    return {
      isValid: true,
      raw,
      normalized,
      nationalFormat,
      operator,
    };
  }

  return {
    isValid: false,
    raw,
    operator: 'UNKNOWN',
    error: 'Numéro invalide. Le numéro béninois doit comporter 8 ou 10 chiffres (ex: 01 97 00 00 00).',
  };
}
