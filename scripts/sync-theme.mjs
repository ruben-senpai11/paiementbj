import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const THEME_CSS_PATH = path.join(ROOT_DIR, 'packages', 'ui', 'src', 'tokens', 'theme.css');
const COLORS_TS_PATH = path.join(ROOT_DIR, 'packages', 'ui', 'src', 'tokens', 'colors.ts');

function parseCssCustomProperties(cssContent) {
  const vars = {};
  const regex = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match;
  while ((match = regex.exec(cssContent)) !== null) {
    vars[`--${match[1]}`] = match[2].trim();
  }
  return vars;
}

function getVar(vars, name, fallback) {
  const val = vars[name];
  if (!val) return fallback;
  return val;
}

function syncTheme() {
  if (!fs.existsSync(THEME_CSS_PATH)) {
    throw new Error(`Master theme CSS missing: ${THEME_CSS_PATH}`);
  }

  const css = fs.readFileSync(THEME_CSS_PATH, 'utf8');
  const v = parseCssCustomProperties(css);

  const tokens = {
    // Identité Bleu Roi (#4169E1) & Jaune Or (#FEBF2E)
    primary: getVar(v, '--pbj-royal', '#4169E1'),
    primaryDeep: getVar(v, '--pbj-royal-deep', '#2446B8'),
    primaryDark: getVar(v, '--pbj-royal-dark', '#13255E'),
    primarySoft: getVar(v, '--pbj-royal-soft', '#EEF2FD'),
    backgroundMint: getVar(v, '--pbj-royal-tint', '#F4F7FE'),

    // Textes
    text: getVar(v, '--pbj-ink', '#111D3D'),
    textSecondary: getVar(v, '--pbj-ink-secondary', '#39486A'),
    textMuted: getVar(v, '--pbj-ink-muted', '#516080'),
    textOnPrimary: getVar(v, '--pbj-ink-on-primary', '#FFFFFF'),
    heroSubtext: '#E6ECFC',

    // Fonds
    background: getVar(v, '--pbj-bg', '#F6F8FC'),
    surface: getVar(v, '--pbj-surface', '#FFFFFF'),
    surfaceSubtle: getVar(v, '--pbj-surface-subtle', '#EDF1FA'),

    // Accent Jaune Primary Hero
    accent: getVar(v, '--pbj-yellow', '#FEBF2E'),
    accentHover: getVar(v, '--pbj-yellow-hover', '#F2AD0E'),
    accentSoft: getVar(v, '--pbj-yellow-soft', '#FFF5D6'),
    accentDark: getVar(v, '--pbj-yellow-ink', '#10214D'),

    // Bordures & états désactivés
    border: getVar(v, '--pbj-border', '#D9E1F2'),
    borderSubtle: getVar(v, '--pbj-border-subtle', '#E7ECF7'),
    borderFocused: getVar(v, '--pbj-border-focused', '#2446B8'),
    focusRing: getVar(v, '--pbj-focus-ring', '#4169E1'),
    disabledBackground: getVar(v, '--pbj-disabled-bg', '#E6EAF5'),
    disabledBorder: getVar(v, '--pbj-disabled-border', '#BAC4DC'),
    disabledText: getVar(v, '--pbj-disabled-ink', '#475577'),

    // Statuts
    success: getVar(v, '--pbj-success', '#0E6A42'),
    successSoft: getVar(v, '--pbj-success-soft', '#E8F6EE'),
    warning: getVar(v, '--pbj-warning', '#7A4B00'),
    warningSoft: getVar(v, '--pbj-warning-soft', '#FFF4D6'),
    danger: getVar(v, '--pbj-danger', '#9E1C1C'),
    dangerSoft: getVar(v, '--pbj-danger-soft', '#FCEAEA'),

    // Drapeau national
    beninGreen: getVar(v, '--pbj-flag-green', '#008751'),
    beninYellow: getVar(v, '--pbj-flag-yellow', '#FCD116'),
    beninRed: getVar(v, '--pbj-flag-red', '#E8112D'),

    // Neutres UI
    neutralStroke: getVar(v, '--pbj-border-subtle', '#E7ECF7'),
    skeleton: '#DDE4F3',
  };

  const output = `// FICHIER GÉNÉRÉ AUTOMATIQUEMENT PAR scripts/sync-theme.mjs
// Source unique de vérité : packages/ui/src/tokens/theme.css
// Exécutez \`npm run sync:theme\` après modification de theme.css.

export const colors = ${JSON.stringify(tokens, null, 2)} as const;

export type ColorToken = keyof typeof colors;
`;

  fs.writeFileSync(COLORS_TS_PATH, output, 'utf8');
  console.log(`Synced tokens from packages/ui/src/tokens/theme.css -> packages/ui/src/tokens/colors.ts`);
}

syncTheme();
