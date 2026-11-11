export function getJwtAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.includes('CHANGE_ME') || secret.length < 32) {
      throw new Error(
        'ERREUR DE SÉCURITÉ CRITIQUE : JWT_ACCESS_SECRET doit être défini (>= 32 caractères) en production.'
      );
    }
  }
  return secret || 'DEV_ONLY_EPHEMERAL_SECRET_PAIEMENT_BJ_2026_MIN_LEN_64_CHARS_OK';
}
