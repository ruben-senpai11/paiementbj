import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import test from 'node:test';
import { validateAndNormalizeBeninPhone } from '../packages/shared/src/phone.ts';
import { formatFCFA, formatCurrency } from '../packages/shared/src/currency.ts';
import { calculateContrastRatio } from '../packages/shared/src/contrast.ts';

const require = createRequire(import.meta.url);
const schemas = require('../packages/schemas/dist/index.js');
const { verifyHmacWebhook } = require('../apps/api/dist/src/modules/providers/webhook-signature.util.js');
const {
  hashPasswordScrypt,
  verifyPasswordScrypt,
} = require('../apps/api/dist/src/common/password-hash.util.js');
const { getJwtAccessSecret } = require('../apps/api/dist/src/common/jwt-config.js');

test('Téléphone Bénin : Normalisation format historique 8 chiffres MTN', () => {
  const res = validateAndNormalizeBeninPhone('97 12 34 56');
  assert.equal(res.isValid, true);
  assert.equal(res.normalized, '+2290197123456');
  assert.equal(res.operator, 'MTN');
});

test('Téléphone Bénin : Normalisation nouveau plan ARCEP 10 chiffres (01) Moov', () => {
  const res = validateAndNormalizeBeninPhone('0195001122');
  assert.equal(res.isValid, true);
  assert.equal(res.normalized, '+2290195001122');
  assert.equal(res.operator, 'MOOV');
});

test('Téléphone Bénin : Normalisation format international +229 Celtiis', () => {
  const res = validateAndNormalizeBeninPhone('+229 01 40 11 22 33');
  assert.equal(res.isValid, true);
  assert.equal(res.normalized, '+2290140112233');
  assert.equal(res.operator, 'CELTIIS');
});

test('Téléphone Bénin : Rejet d’un numéro invalide ou incomplet', () => {
  const res = validateAndNormalizeBeninPhone('12345');
  assert.equal(res.isValid, false);
  assert.ok(res.error);
});

test('Devise FCFA : Formatage UEMOA avec séparateurs de milliers', () => {
  assert.equal(formatFCFA(5000), '5 000 FCFA');
  assert.equal(formatFCFA(1250000), '1 250 000 FCFA');
  assert.equal(formatFCFA(0), '0 FCFA');
  assert.equal(formatCurrency(150.5, 'EUR'), '150,50 €');
});

test('Contraste thème Bleu Royal #1746A2 & Jaune #FFC928 : Paires critiques UI', () => {
  const aaaPairs: Array<[string, string]> = [
    ['#FFFFFF', '#1746A2'],
    ['#FFFFFF', '#123B7A'],
    ['#123B7A', '#FFC928'],
    ['#14213D', '#FFFFFF'],
    ['#14213D', '#F5F8FF'],
    ['#14213D', '#EAF0FF'],
    ['#14213D', '#FFF7D6'],
    ['#40516B', '#FFFFFF'],
    ['#40516B', '#F5F8FF'],
    ['#115A34', '#E8F6EE'],
    ['#8B1E2D', '#FDF0F2'],
    ['#654400', '#FFF7D6'],
  ];

  for (const [fg, bg] of aaaPairs) {
    const res = calculateContrastRatio(fg, bg);
    assert.ok(res.ratio >= 7.0, `Contraste AAA ${fg} sur ${bg} = ${res.ratio.toFixed(2)}`);
    assert.equal(res.passesWcagAAANormal, true);
  }

  const borderContrast = calculateContrastRatio('#7185A5', '#FFFFFF');
  assert.ok(borderContrast.ratio >= 3.0, `Contraste bordure/contrôle ${borderContrast.ratio.toFixed(2)}`);
});

test('Schémas Zod (@paiementbj/schemas) : Validation OTP, Paiement, Support et Suppression APDP', () => {
  assert.equal(
    schemas.VerifyOtpSchema.safeParse({ phone: '97123456', code: '123456', platform: 'android' }).success,
    true
  );
  assert.equal(
    schemas.VerifyOtpSchema.safeParse({ phone: '97123456', code: '12AB56' }).success,
    false
  );

  const validIntent = schemas.CreatePaymentIntentSchema.safeParse({
    serviceId: 'srv_sbee_prepaye',
    amount: 5000,
    serviceReference: '14123456789',
    customerData: { meterNumber: '14123456789' },
    idempotencyKey: crypto.randomUUID(),
  });
  assert.equal(validIntent.success, true);

  assert.equal(
    schemas.CreatePaymentIntentSchema.safeParse({
      serviceId: 'srv_sbee_prepaye',
      amount: -100,
      serviceReference: '14123456789',
      idempotencyKey: 'not-a-uuid',
    }).success,
    false
  );

  assert.equal(
    schemas.PaymentQuoteSchema.safeParse({
      serviceId: 'srv_sbee_prepaye',
      providerCode: 'MTN_MOMO',
      amount: 5000,
    }).success,
    true
  );
  assert.equal(
    schemas.CreatePaymentAttemptSchema.safeParse({
      paymentIntentId: 'pi_test',
      providerCode: 'UNKNOWN_WALLET',
    }).success,
    false
  );

  // Support ticket accepts both UUID and prefixed pi_<uuid>
  assert.equal(
    schemas.CreateSupportTicketSchema.safeParse({
      transactionId: `pi_${crypto.randomUUID()}`,
      category: 'DEBITED_NOT_CREDITED',
      title: 'Facture SBEE en attente',
      description: 'Le paiement a été validé par MoMo mais le compteur n’a pas reçu le code.',
    }).success,
    true
  );

  assert.equal(
    schemas.RequestAccountDeletionSchema.safeParse({ confirmText: 'SUPPRIMER' }).success,
    true
  );
  assert.equal(
    schemas.RequestAccountDeletionSchema.safeParse({ confirmText: 'DELETE' }).success,
    false
  );
});

test('Sécurité Webhook : Signature HMAC-SHA256 et fenêtre anti-rejeu (300s)', () => {
  const secret = 'test-webhook-secret-paiement-bj';
  const payload = JSON.stringify({ status: 'SUCCESSFUL', externalId: 'MOMO-BJ-123' });
  const nowSec = Math.floor(Date.now() / 1000).toString();
  const validSig = crypto
    .createHmac('sha256', secret)
    .update(`${nowSec}.${payload}`)
    .digest('hex');

  assert.deepEqual(
    verifyHmacWebhook({
      secret,
      headers: { 'x-signature': validSig, 'x-timestamp': nowSec },
      rawPayload: payload,
    }),
    { valid: true }
  );

  // Payload falsifié
  const tampered = verifyHmacWebhook({
    secret,
    headers: { 'x-signature': validSig, 'x-timestamp': nowSec },
    rawPayload: payload.replace('123', '999'),
  });
  assert.equal(tampered.valid, false);
  assert.equal(tampered.reason, 'INVALID_HMAC_SIGNATURE');

  // Horodatage expiré (> 300s)
  const staleSec = (Math.floor(Date.now() / 1000) - 600).toString();
  const staleSig = crypto
    .createHmac('sha256', secret)
    .update(`${staleSec}.${payload}`)
    .digest('hex');
  const replayRes = verifyHmacWebhook({
    secret,
    headers: { 'x-signature': staleSig, 'x-timestamp': staleSec },
    rawPayload: payload,
  });
  assert.equal(replayRes.valid, false);
  assert.equal(replayRes.reason, 'TIMESTAMP_OUT_OF_WINDOW');

  // Secret manquant
  assert.deepEqual(
    verifyHmacWebhook({
      secret: '',
      headers: { 'x-signature': validSig, 'x-timestamp': nowSec },
      rawPayload: payload,
    }),
    { valid: false, reason: 'WEBHOOK_SECRET_NOT_CONFIGURED' }
  );
});

test('Sécurité Mots de passe Admin (scrypt) et Fail-Closed JWT Production', () => {
  const hash = hashPasswordScrypt('GouvernanceBJ#2026');
  assert.ok(hash.startsWith('scrypt$'));
  assert.equal(verifyPasswordScrypt('GouvernanceBJ#2026', hash), true);
  assert.equal(verifyPasswordScrypt('MauvaisMotDePasse', hash), false);
  assert.equal(verifyPasswordScrypt('GouvernanceBJ#2026', 'invalid_format'), false);

  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.JWT_ACCESS_SECRET;
  try {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'CHANGE_ME_IN_PRODUCTION';
    assert.throws(() => getJwtAccessSecret(), /JWT_ACCESS_SECRET/);

    process.env.JWT_ACCESS_SECRET = 'A'.repeat(64);
    assert.equal(getJwtAccessSecret(), 'A'.repeat(64));
  } finally {
    process.env.NODE_ENV = prevEnv;
    if (prevSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = prevSecret;
  }
});
