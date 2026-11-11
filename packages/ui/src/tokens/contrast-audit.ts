import { calculateContrastRatio, ContrastResult } from '@paiementbj/shared';
import { colors } from './colors';

export interface AuditRecord {
  name: string;
  foreground: string;
  background: string;
  result: ContrastResult;
  usageContext: string;
}

export function runColorPaletteAudit(): AuditRecord[] {
  const tests: Array<{ name: string; fg: string; bg: string; usage: string }> = [
    {
      name: 'Texte principal sur fond clair',
      fg: colors.text,
      bg: colors.background,
      usage: 'Titres, paragraphes généraux sur fond d’écran',
    },
    {
      name: 'Texte principal sur surface blanche',
      fg: colors.text,
      bg: colors.surface,
      usage: 'Contenu des cartes, fiches de services et formulaires',
    },
    {
      name: 'Texte principal sur fond mint',
      fg: colors.text,
      bg: colors.backgroundMint,
      usage: 'Bandeaux institutionnels et fiches secondaires',
    },
    {
      name: 'Texte blanc sur bouton vert primaire',
      fg: colors.textOnPrimary,
      bg: colors.primary,
      usage: 'Bouton d’action principal (CTA)',
    },
    {
      name: 'Texte blanc sur vert profond',
      fg: colors.textOnPrimary,
      bg: colors.primaryDeep,
      usage: 'Hero header, bannières d’authentification forte',
    },
    {
      name: 'Texte secondaire optimisé sur surface blanche',
      fg: colors.textSecondary,
      bg: colors.surface,
      usage: 'Métadonnées, labels de formulaires, descriptions',
    },
    {
      name: 'Texte d’erreur/danger sur surface blanche',
      fg: colors.danger,
      bg: colors.surface,
      usage: 'Messages d’alerte bloquants et échecs confirmés',
    },
    {
      name: 'Texte de succès confirmé sur surface blanche',
      fg: colors.success,
      bg: colors.surface,
      usage: 'Statut confirmé par le serveur',
    },
    {
      name: 'Texte d’avertissement sur fond beige clair',
      fg: colors.warning,
      bg: colors.warningSoft,
      usage: 'Informations en attente ou vérification en cours',
    },
  ];

  return tests.map((t) => ({
    name: t.name,
    foreground: t.fg,
    background: t.bg,
    result: calculateContrastRatio(t.fg, t.bg),
    usageContext: t.usage,
  }));
}
