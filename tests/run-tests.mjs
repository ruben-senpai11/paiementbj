import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

// -----------------------------------------------------------------------------
// SUITE DE TESTS AUTOMATISÉS — PAIEMENT BJ
// -----------------------------------------------------------------------------

test('1. Vérification des actifs de marque locaux (Zéro chargement distant)', () => {
  const expectedFiles = [
    'assets/brands/mtn/mtn-logo-2022.svg',
    'assets/brands/mtn-momo/mtn-momo-logo.png',
    'assets/brands/moov-africa/moov-africa-logo.webp',
    'assets/brands/moov-money/moov-money-logo.png',
    'assets/brands/celtiis/celtiis-logo.png',
    'assets/brands/celtiis-cash/celtiis-cash-logo.png',
    'assets/brands/sbee/sbee-logo.webp',
    'assets/brands/soneb/soneb-logo.png',
    'assets/brands/canal-plus/canal-plus-logo.png',
    'assets/brands/tresor/tresor-logo.jpg',
    'assets/brands/anip/anip-logo.png',
    'assets/brands/visa/visa-logo.svg',
    'assets/brands/mastercard/mastercard-logo.svg',
  ];

  for (const relPath of expectedFiles) {
    const absPath = path.resolve(process.cwd(), relPath);
    assert.equal(fs.existsSync(absPath), true, `Logo manquant : ${relPath}`);
    const stats = fs.statSync(absPath);
    assert.ok(stats.size > 0, `Logo vide : ${relPath}`);
  }
});

test('2. Conformité Architecturale : Zéro portefeuille interne dans Prisma', () => {
  const schemaPath = path.resolve(process.cwd(), 'apps/api/prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8').toLowerCase();

  assert.equal(schemaContent.includes('wallet_balance'), false, 'Interdiction : wallet_balance détecté');
  assert.equal(schemaContent.includes('wallet_ledger'), false, 'Interdiction : wallet_ledger détecté');
  assert.equal(schemaContent.includes('internal_balance'), false, 'Interdiction : internal_balance détecté');
  assert.ok(schemaContent.includes('model paymentintent'), 'Modèle PaymentIntent requis manquant');
  assert.ok(schemaContent.includes('idempotencykey'), 'Clé d’idempotence requise manquante');
  assert.ok(schemaContent.includes('model receipt'), 'Modèle Receipt requis manquant');
  assert.ok(schemaContent.includes('model auditlog'), 'Modèle AuditLog requis manquant');
});

test('3. Vérification mathématique des contrastes WCAG 2.2 AAA (>= 7.0:1)', () => {
  function parseHex(hex) {
    const clean = hex.replace('#', '').trim();
    return [
      parseInt(clean.slice(0, 2), 16) / 255,
      parseInt(clean.slice(2, 4), 16) / 255,
      parseInt(clean.slice(4, 6), 16) / 255,
    ];
  }
  function lum(hex) {
    const [r, g, b] = parseHex(hex).map((c) =>
      c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function ratio(fg, bg) {
    const l1 = lum(fg);
    const l2 = lum(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  const pairs = [
    { name: 'Texte principal sur blanc', fg: '#123B2F', bg: '#FFFFFF' },
    { name: 'Texte principal sur fond clair', fg: '#123B2F', bg: '#F5F8F4' },
    { name: 'Blanc sur bouton vert primaire', fg: '#FFFFFF', bg: '#064B32' },
    { name: 'Blanc sur vert profond', fg: '#FFFFFF', bg: '#003F2B' },
    { name: 'Texte secondaire calibré sur blanc', fg: '#384C42', bg: '#FFFFFF' },
    { name: 'Texte atténué sur fond clair', fg: '#43574E', bg: '#F5F8F4' },
    { name: 'Succès sur badge vert pâle', fg: '#0A522E', bg: '#E6F4EC' },
    { name: 'Danger sur badge rouge pâle', fg: '#8A1919', bg: '#FCE8E8' },
    { name: 'Attention sur beige', fg: '#6B3B00', bg: '#FFF4D6' },
  ];

  for (const p of pairs) {
    const r = ratio(p.fg, p.bg);
    assert.ok(r >= 7.0, `Contraste insuffisant pour ${p.name}: ${r.toFixed(2)}:1 (Exigé >= 7.0:1)`);
  }
});

test('4. Vérification .env.example sans secrets exposés', () => {
  const envPath = path.resolve(process.cwd(), '.env.example');
  const content = fs.readFileSync(envPath, 'utf8');
  assert.equal(content.includes('sk_live_'), false, 'Clé de production interdite dans .env.example');
  assert.ok(content.includes('DATABASE_URL='), 'Variable DATABASE_URL attendue');
  assert.ok(content.includes('MTN_MOMO_ENVIRONMENT=sandbox'), 'Config Sandbox attendue');
});

test('5. Vérification présence des livrables documentaires obligatoires', () => {
  const requiredDocs = [
    'README.md',
    'docs/BRAND_ASSETS.md',
    'docs/DEPLOYMENT.md',
    'docs/accessibility/WCAG_AAA_AUDIT.md',
    'docs/security/SECURITY_REPORT.md',
    'docs/integrations/CONNECTORS.md',
    'docs/architecture/ARCHITECTURE.md',
    'docs/architecture/adr/ADR-001-no-internal-wallet.md',
    'docs/architecture/adr/ADR-002-provider-adapter-pattern.md',
  ];

  for (const doc of requiredDocs) {
    assert.equal(fs.existsSync(path.resolve(process.cwd(), doc)), true, `Document manquant : ${doc}`);
  }
});
