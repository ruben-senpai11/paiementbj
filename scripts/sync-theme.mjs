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
    // Identité Bleu Royal (#1746A2) & Jaune (#FFC928)
    primary: getVar(v, '--pbj-royal', '#1746A2'),
    primaryDeep: getVar(v, '--pbj-royal-deep', '#123B7A'),
    primaryDark: getVar(v, '--pbj-royal-dark', '#14213D'),
    primarySoft: getVar(v, '--pbj-royal-soft', '#EAF0FF'),
    backgroundMint: getVar(v, '--pbj-royal-tint', '#EAF0FF'),

    // Textes
    text: getVar(v, '--pbj-ink', '#14213D'),
    textSecondary: getVar(v, '--pbj-ink-secondary', '#40516B'),
    textMuted: getVar(v, '--pbj-ink-muted', '#40516B'),
    textOnPrimary: getVar(v, '--pbj-ink-on-primary', '#FFFFFF'),
    heroSubtext: '#EAF0FF',

    // Fonds
    background: getVar(v, '--pbj-bg', '#F5F8FF'),
    surface: getVar(v, '--pbj-surface', '#FFFFFF'),
    surfaceSubtle: getVar(v, '--pbj-surface-subtle', '#EAF0FF'),

    // Accent Jaune Primary Hero
    accent: getVar(v, '--pbj-yellow', '#FFC928'),
    accentHover: getVar(v, '--pbj-yellow-hover', '#E8B310'),
    accentSoft: getVar(v, '--pbj-yellow-soft', '#FFF7D6'),
    accentDark: getVar(v, '--pbj-yellow-ink', '#123B7A'),

    // Bordures & états désactivés
    border: getVar(v, '--pbj-border', '#7185A5'),
    borderSubtle: getVar(v, '--pbj-border-subtle', '#D5DFEE'),
    borderFocused: getVar(v, '--pbj-border-focused', '#1746A2'),
    focusRing: getVar(v, '--pbj-focus-ring', '#1746A2'),
    disabledBackground: getVar(v, '--pbj-disabled-bg', '#EAF0FF'),
    disabledBorder: getVar(v, '--pbj-disabled-border', '#7185A5'),
    disabledText: getVar(v, '--pbj-disabled-ink', '#40516B'),

    // Statuts
    success: getVar(v, '--pbj-success', '#115A34'),
    successSoft: getVar(v, '--pbj-success-soft', '#E8F6EE'),
    warning: getVar(v, '--pbj-warning', '#654400'),
    warningSoft: getVar(v, '--pbj-warning-soft', '#FFF7D6'),
    danger: getVar(v, '--pbj-danger', '#8B1E2D'),
    dangerSoft: getVar(v, '--pbj-danger-soft', '#FDF0F2'),

    // Drapeau national
    beninGreen: getVar(v, '--pbj-flag-green', '#008751'),
    beninYellow: getVar(v, '--pbj-flag-yellow', '#FCD116'),
    beninRed: getVar(v, '--pbj-flag-red', '#E8112D'),

    // Neutres UI
    neutralStroke: getVar(v, '--pbj-border-subtle', '#D5DFEE'),
    skeleton: '#DCE5F5',
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
