import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import test, { after, before } from 'node:test';

const require = createRequire(import.meta.url);
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../apps/api/dist/src/app.module.js');
const { configureApp } = require('../apps/api/dist/src/app.setup.js');
const { hashPasswordScrypt } = require('../apps/api/dist/src/common/password-hash.util.js');

const ENV_KEYS_TO_RESTORE = [
  'NODE_ENV',
  'DATABASE_URL',
  'API_PREFIX',
  'MVP_SIMULATION_MODE',
  'SMS_PROVIDER',
  'JWT_ACCESS_SECRET',
  'MTN_MOMO_SUBSCRIPTION_KEY',
  'MTN_MOMO_API_USER',
  'MTN_MOMO_API_KEY',
  'MTN_MOMO_WEBHOOK_SECRET',
  'MOOV_MONEY_API_KEY',
  'MOOV_MONEY_MERCHANT_ID',
  'MOOV_MONEY_WEBHOOK_SECRET',
  'CELTIIS_CASH_API_KEY',
  'CELTIIS_CASH_WEBHOOK_SECRET',
  'CARD_GATEWAY_SECRET_KEY',
  'CARD_GATEWAY_CHECKOUT_URL',
  'CARD_GATEWAY_WEBHOOK_SECRET',
  'TRESOR_PUBLIC_API_KEY',
  'TRESOR_PUBLIC_WEBHOOK_SECRET',
  'ADMIN_BOOTSTRAP_EMAIL',
  'ADMIN_BOOTSTRAP_PASSWORD_HASH',
  'ADMIN_BOOTSTRAP_NAME',
  'ADMIN_BOOTSTRAP_ROLE',
] as const;

const savedEnv: Record<string, string | undefined> = {};
let app: any;
let baseUrl = '';
const ADMIN_EMAIL = 'gouvernance-ci@paiement.bj';
const ADMIN_PASS = 'PaiementBJ#Securite2026';

async function apiFetch(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
    rawBody?: string;
    headers?: Record<string, string>;
    baseUrl?: string;
  } = {}
) {
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };
  let payload: string | undefined = options.rawBody;
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(options.body);
  }
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${options.baseUrl || baseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body: payload,
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  return { status: res.status, headers: res.headers, json, text };
}

async function authenticateCitizen(phone: string, deviceId: string, deviceName: string) {
  const otpReq = await apiFetch('/v1/auth/otp/request', {
    method: 'POST',
    body: { phone, deviceId, deviceName, platform: 'android' },
  });
  assert.equal(otpReq.status, 200, `OTP request échouée: ${otpReq.text}`);
  assert.match(String(otpReq.json.devOtpCode), /^\d{6}$/);

  const verify = await apiFetch('/v1/auth/otp/verify', {
    method: 'POST',
    body: {
      phone,
      code: otpReq.json.devOtpCode,
      deviceId,
      deviceName,
      platform: 'android',
    },
  });
  assert.equal(verify.status, 200, `OTP verify échouée: ${verify.text}`);
  assert.ok(verify.json.accessToken);
  return {
    token: verify.json.accessToken as string,
    user: verify.json.user,
  };
}

before(async () => {
  for (const key of ENV_KEYS_TO_RESTORE) {
    savedEnv[key] = process.env[key];
  }

  process.env.NODE_ENV = 'test';
  process.env.API_PREFIX = 'v1';
  process.env.SMS_PROVIDER = 'sandbox';
  process.env.DATABASE_URL = 'postgresql://disabled:disabled@127.0.0.1:1/disabled?connect_timeout=1';
  process.env.JWT_ACCESS_SECRET = 'integration-test-jwt-secret-paiementbj-64-chars-minimum-ok-01';

  // Démarrage avec TOUS les connecteurs désactivés pour prouver l'état indisponible honnête
  delete process.env.MTN_MOMO_SUBSCRIPTION_KEY;
  delete process.env.MTN_MOMO_API_USER;
  delete process.env.MTN_MOMO_API_KEY;
  delete process.env.MTN_MOMO_WEBHOOK_SECRET;
  process.env.MVP_SIMULATION_MODE = 'false';
  delete process.env.MOOV_MONEY_API_KEY;
  delete process.env.MOOV_MONEY_MERCHANT_ID;
  delete process.env.MOOV_MONEY_WEBHOOK_SECRET;
  delete process.env.CELTIIS_CASH_API_KEY;
  delete process.env.CELTIIS_CASH_WEBHOOK_SECRET;
  delete process.env.CARD_GATEWAY_SECRET_KEY;
  delete process.env.CARD_GATEWAY_CHECKOUT_URL;
  delete process.env.CARD_GATEWAY_WEBHOOK_SECRET;
  delete process.env.TRESOR_PUBLIC_API_KEY;
  delete process.env.TRESOR_PUBLIC_WEBHOOK_SECRET;

  process.env.ADMIN_BOOTSTRAP_EMAIL = ADMIN_EMAIL;
  process.env.ADMIN_BOOTSTRAP_PASSWORD_HASH = hashPasswordScrypt(ADMIN_PASS);
  process.env.ADMIN_BOOTSTRAP_NAME = 'Auditeur CI';
  process.env.ADMIN_BOOTSTRAP_ROLE = 'SUPERADMIN';

  app = await NestFactory.create(AppModule, { rawBody: true, logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (app) {
    await app.close();
  }
  for (const key of ENV_KEYS_TO_RESTORE) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

test('API HTTP : OpenAPI Swagger, en-têtes de sécurité et catalogue des services', async () => {
  const docsRes = await apiFetch('/api/docs-json');
  assert.equal(docsRes.status, 200);
  assert.ok(docsRes.json.openapi);
  assert.ok(docsRes.json.paths['/v1/payments/intents']);
  assert.ok(docsRes.json.paths['/v1/admin/login']);

  const servicesRes = await apiFetch('/v1/services');
  assert.equal(servicesRes.status, 200);
  assert.equal(servicesRes.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(servicesRes.headers.get('x-frame-options'), 'DENY');
  assert.equal(servicesRes.headers.get('referrer-policy'), 'no-referrer');

  assert.ok(Array.isArray(servicesRes.json));
  assert.ok(servicesRes.json.some((s: any) => s.code === 'sbee_prepaye' && s.integrationStatus === 'SANDBOX_CONNECTED'));
  assert.ok(servicesRes.json.some((s: any) => s.code === 'soneb_facture' && s.integrationStatus === 'PENDING_AGREEMENT'));

  const filtered = await apiFetch('/v1/services?q=SBEE');
  assert.equal(filtered.status, 200);
  assert.equal(filtered.json.length, 1);
  assert.equal(filtered.json[0].code, 'sbee_prepaye');
});

test('API HTTP : État indisponible honnête sans clés API et blocage des services PENDING_AGREEMENT', async () => {
  const user = await authenticateCitizen('97000001', 'dev_unavail_01', 'Pixel 8 CI');

  const providersRes = await apiFetch('/v1/payments/providers', { token: user.token });
  assert.equal(providersRes.status, 200);
  assert.equal(providersRes.json.length, 5);
  for (const provider of providersRes.json) {
    assert.equal(provider.availability, 'UNAVAILABLE', `${provider.code} doit être UNAVAILABLE sans clés`);
  }

  // Service non conventionné => HTTP 503 obligatoire
  const blockedIntent = await apiFetch('/v1/payments/intents', {
    method: 'POST',
    token: user.token,
    body: {
      serviceId: 'srv_soneb_facture',
      amount: 12500,
      serviceReference: '01234567',
      customerData: { policeNumber: '01234567' },
      idempotencyKey: crypto.randomUUID(),
    },
  });
  assert.equal(blockedIntent.status, 503);

  // Création intention sur SBEE autorisée, mais tentative sur connecteur non configuré => FAILED honnête
  const sbeeIntent = await apiFetch('/v1/payments/intents', {
    method: 'POST',
    token: user.token,
    body: {
      serviceId: 'srv_sbee_prepaye',
      amount: 5000,
      serviceReference: '14123456789',
      customerData: { meterNumber: '14123456789' },
      idempotencyKey: crypto.randomUUID(),
    },
  });
  assert.equal(sbeeIntent.status, 201);

  const attemptRes = await apiFetch('/v1/payments/attempts', {
    method: 'POST',
    token: user.token,
    body: {
      paymentIntentId: sbeeIntent.json.id,
      providerCode: 'MTN_MOMO',
      payerPhone: user.user.phone,
    },
  });
  assert.equal(attemptRes.status, 200);
  assert.equal(attemptRes.json.status, 'FAILED');
  assert.equal(attemptRes.json.providerReference, '');

  // Webhook sans secret configuré => HTTP 503
  const webhookNoSecret = await apiFetch('/v1/payments/webhooks/MTN_MOMO', {
    method: 'POST',
    body: { status: 'SUCCESSFUL', externalId: 'ANY' },
  });
  assert.equal(webhookNoSecret.status, 503);
});

test('API HTTP : Auth OTP, limitation de débit 429, validation Zod 400, profil, sessions et consentements APDP', async () => {
  // Validation Zod malformée
  const invalidOtpReq = await apiFetch('/v1/auth/otp/request', {
    method: 'POST',
    body: { phone: '123', platform: 'android' },
  });
  assert.equal(invalidOtpReq.status, 400);
  assert.equal(invalidOtpReq.json.code, 'VALIDATION_ERROR');

  // Test rate limit 429 à la 6e demande OTP consécutive sur le même numéro
  const floodPhone = '97111222';
  for (let i = 0; i < 5; i += 1) {
    const r = await apiFetch('/v1/auth/otp/request', {
      method: 'POST',
      body: { phone: floodPhone, platform: 'android' },
    });
    assert.equal(r.status, 200);
  }
  const rateLimited = await apiFetch('/v1/auth/otp/request', {
    method: 'POST',
    body: { phone: floodPhone, platform: 'android' },
  });
  assert.equal(rateLimited.status, 429);

  // Double session appareil et révocation
  const firstSession = await authenticateCitizen('97222333', 'dev_phone_a', 'Tecno Camon');
  await authenticateCitizen('97222333', 'dev_tablet_b', 'Galaxy Tab');

  const sessionsBefore = await apiFetch('/v1/auth/sessions', { token: firstSession.token });
  assert.equal(sessionsBefore.status, 200);
  assert.equal(sessionsBefore.json.length, 2);

  const revokeRes = await apiFetch('/v1/auth/sessions/revoke', {
    method: 'POST',
    token: firstSession.token,
    body: { deviceId: 'dev_tablet_b' },
  });
  assert.equal(revokeRes.status, 200);
  assert.equal(revokeRes.json.success, true);

  const sessionsAfter = await apiFetch('/v1/auth/sessions', { token: firstSession.token });
  assert.equal(sessionsAfter.json.length, 1);
  assert.equal(sessionsAfter.json[0].deviceId, 'dev_phone_a');

  // Mise à jour profil & accessibilité
  const patchRes = await apiFetch('/v1/auth/profile', {
    method: 'PATCH',
    token: firstSession.token,
    body: {
      firstName: 'Koffi',
      lastName: 'Dossou',
      language: 'en',
      accessibilitySettings: { largeFont: true, reducedMotion: true },
    },
  });
  assert.equal(patchRes.status, 200);
  assert.equal(patchRes.json.profile.firstName, 'Koffi');
  assert.equal(patchRes.json.profile.language, 'en');
  assert.equal(patchRes.json.profile.accessibilitySettings.largeFont, true);

  // Consentements horodatés APDP
  const c1 = await apiFetch('/v1/auth/consents', {
    method: 'POST',
    token: firstSession.token,
    body: { purpose: 'terms_of_service', version: '2026.11', accepted: true },
  });
  assert.equal(c1.status, 201);
  const consentsList = await apiFetch('/v1/auth/consents', { token: firstSession.token });
  assert.equal(consentsList.status, 200);
  assert.equal(consentsList.json.length, 1);
  assert.equal(consentsList.json[0].purpose, 'terms_of_service');
});

test('API HTTP : Parcours complet MTN MoMo, idempotence, IDOR 403, webhook HMAC-SHA256, reçu SHA-256, support & Admin RBAC', async () => {
  // Activation dynamique du connecteur bac à sable MTN MoMo
  const webhookSecret = 'momo-webhook-secret-integration-2026';
  process.env.MTN_MOMO_SUBSCRIPTION_KEY = 'sub_key_sandbox_ok';
  process.env.MTN_MOMO_API_USER = 'api_user_sandbox_ok';
  process.env.MTN_MOMO_WEBHOOK_SECRET = webhookSecret;

  const citizenA = await authenticateCitizen('97333444', 'dev_a', 'Android A');
  const citizenB = await authenticateCitizen('95444555', 'dev_b', 'Android B');

  const providers = await apiFetch('/v1/payments/providers', { token: citizenA.token });
  assert.equal(providers.status, 200);
  const momo = providers.json.find((p: any) => p.code === 'MTN_MOMO');
  const moov = providers.json.find((p: any) => p.code === 'MOOV_MONEY');
  assert.equal(momo.availability, 'OPERATIONAL');
  assert.equal(moov.availability, 'UNAVAILABLE');

  // Devis & validation préalable
  const quoteRes = await apiFetch('/v1/payments/quote', {
    method: 'POST',
    token: citizenA.token,
    body: { serviceId: 'srv_sbee_prepaye', providerCode: 'MTN_MOMO', amount: 5000, currency: 'XOF' },
  });
  assert.equal(quoteRes.status, 200);
  assert.equal(quoteRes.json.providerFee, 50);
  assert.equal(quoteRes.json.platformFee, 0);
  assert.equal(quoteRes.json.totalAmount, 5050);

  const valRes = await apiFetch('/v1/payments/validate', {
    method: 'POST',
    token: citizenA.token,
    body: { serviceId: 'srv_sbee_prepaye', providerCode: 'MTN_MOMO', serviceReference: '14123456789', amount: 5000 },
  });
  assert.equal(valRes.status, 200);
  assert.equal(valRes.json.isValid, true);

  // Création intention idempotente
  const idempotencyKey = crypto.randomUUID();
  const intentPayload = {
    serviceId: 'srv_sbee_prepaye',
    amount: 5000,
    serviceReference: '14123456789',
    customerData: { meterNumber: '14123456789', payerPhone: citizenA.user.phone },
    idempotencyKey,
  };
  const intent1 = await apiFetch('/v1/payments/intents', {
    method: 'POST',
    token: citizenA.token,
    body: intentPayload,
  });
  assert.equal(intent1.status, 201);

  const intentReplay = await apiFetch('/v1/payments/intents', {
    method: 'POST',
    token: citizenA.token,
    body: intentPayload,
  });
  assert.equal(intentReplay.status, 201);
  assert.equal(intentReplay.json.id, intent1.json.id);
  assert.equal(intentReplay.json.reference, intent1.json.reference);

  // Protection IDOR sur clé d'idempotence et lecture d'intention d'un tiers
  const idorIntent = await apiFetch('/v1/payments/intents', {
    method: 'POST',
    token: citizenB.token,
    body: intentPayload,
  });
  assert.equal(idorIntent.status, 403);

  const idorStatus = await apiFetch(`/v1/payments/intents/${intent1.json.id}/status`, {
    token: citizenB.token,
  });
  assert.equal(idorStatus.status, 403);

  // Tentative réelle MTN MoMo => PENDING
  const attempt = await apiFetch('/v1/payments/attempts', {
    method: 'POST',
    token: citizenA.token,
    body: {
      paymentIntentId: intent1.json.id,
      providerCode: 'MTN_MOMO',
      payerPhone: citizenA.user.phone,
    },
  });
  assert.equal(attempt.status, 200);
  assert.equal(attempt.json.status, 'PENDING');
  assert.match(attempt.json.providerReference, /^MOMO-BJ-/);

  // Aucun reçu avant confirmation réelle
  const receiptBefore = await apiFetch(`/v1/transactions/${intent1.json.id}/receipt`, {
    token: citizenA.token,
  });
  assert.equal(receiptBefore.status, 404);

  // Rejet webhook non signé et expiré (anti-rejeu)
  const webhookBody = JSON.stringify({
    status: 'SUCCESSFUL',
    externalId: attempt.json.providerReference,
  });

  const unsignedWebhook = await apiFetch('/v1/payments/webhooks/MTN_MOMO', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    rawBody: webhookBody,
  });
  assert.equal(unsignedWebhook.status, 401);

  const staleTs = (Math.floor(Date.now() / 1000) - 600).toString();
  const staleSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${staleTs}.${webhookBody}`)
    .digest('hex');
  const staleWebhook = await apiFetch('/v1/payments/webhooks/MTN_MOMO', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-timestamp': staleTs,
      'x-signature': staleSig,
    },
    rawBody: webhookBody,
  });
  assert.equal(staleWebhook.status, 401);

  // Webhook HMAC-SHA256 valide + idempotence de rejeu
  const validTs = Math.floor(Date.now() / 1000).toString();
  const validSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${validTs}.${webhookBody}`)
    .digest('hex');
  const validWebhook = await apiFetch('/v1/payments/webhooks/MTN_MOMO', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-timestamp': validTs,
      'x-signature': validSig,
    },
    rawBody: webhookBody,
  });
  assert.equal(validWebhook.status, 200);
  assert.equal(validWebhook.json.received, true);
  assert.equal(validWebhook.json.idempotent, false);
  assert.equal(validWebhook.json.status, 'SUCCEEDED');

  const duplicateWebhook = await apiFetch('/v1/payments/webhooks/MTN_MOMO', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-timestamp': validTs,
      'x-signature': validSig,
    },
    rawBody: webhookBody,
  });
  assert.equal(duplicateWebhook.status, 200);
  assert.equal(duplicateWebhook.json.idempotent, true);
  assert.equal(duplicateWebhook.json.status, 'SUCCEEDED');

  // Vérification statut confirmé + reçu SHA-256 + notification
  const confirmedStatus = await apiFetch(`/v1/payments/intents/${intent1.json.id}/status`, {
    token: citizenA.token,
  });
  assert.equal(confirmedStatus.status, 200);
  assert.equal(confirmedStatus.json.isConfirmed, true);
  assert.equal(confirmedStatus.json.status, 'SUCCEEDED');

  const receipt = await apiFetch(`/v1/transactions/${intent1.json.id}/receipt`, {
    token: citizenA.token,
  });
  assert.equal(receipt.status, 200);
  assert.match(receipt.json.receiptNumber, /^REC-BJ-/);
  assert.match(receipt.json.digitalSignatureHash, /^[A-F0-9]{64}$/);
  assert.equal(receipt.json.totalAmount, 5050);

  const notifs = await apiFetch('/v1/notifications', { token: citizenA.token });
  assert.equal(notifs.status, 200);
  const paymentNotif = notifs.json.find((n: any) => n.resourceId === intent1.json.id);
  assert.ok(paymentNotif);
  const markRead = await apiFetch(`/v1/notifications/${paymentNotif.id}/read`, {
    method: 'PATCH',
    token: citizenA.token,
  });
  assert.equal(markRead.status, 200);

  // Ticket support rattaché à l'intent pi_<uuid>
  const ticketRes = await apiFetch('/v1/support/tickets', {
    method: 'POST',
    token: citizenA.token,
    body: {
      transactionId: intent1.json.id,
      category: 'RECEIPT_NOT_GENERATED',
      title: 'Vérification code recharge ISAGO',
      description: 'Le reçu est disponible mais je souhaite vérifier la transmission vers le compteur.',
    },
  });
  assert.equal(ticketRes.status, 201);
  assert.equal(ticketRes.json.transactionId, intent1.json.id);

  // Back-Office Admin RBAC : isolation stricte
  const unauthAdmin = await apiFetch('/v1/admin/stats');
  assert.equal(unauthAdmin.status, 401);

  const citizenOnAdmin = await apiFetch('/v1/admin/stats', { token: citizenA.token });
  assert.equal(citizenOnAdmin.status, 403);

  const badAdminLogin = await apiFetch('/v1/admin/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: 'WrongPassword123' },
  });
  assert.equal(badAdminLogin.status, 401);

  const adminLogin = await apiFetch('/v1/admin/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASS },
  });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.json.accessToken as string;
  assert.equal(adminLogin.json.admin.role, 'SUPERADMIN');

  const adminStats = await apiFetch('/v1/admin/stats', { token: adminToken });
  assert.equal(adminStats.status, 200);
  assert.ok(adminStats.json.transactionsCount >= 2);
  assert.equal(adminStats.json.volumeTotal, 5050);
  assert.equal(adminStats.json.openTicketsCount, 1);

  const adminTx = await apiFetch('/v1/admin/transactions', { token: adminToken });
  assert.equal(adminTx.status, 200);
  assert.ok(adminTx.json.some((t: any) => t.id === intent1.json.id && t.status === 'SUCCEEDED'));

  const resolveTicket = await apiFetch(`/v1/admin/support/tickets/${ticketRes.json.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: {
      status: 'RESOLVED',
      resolutionNotes: 'Code ISAGO transmis au facturier et confirmé.',
    },
  });
  assert.equal(resolveTicket.status, 200);
  assert.equal(resolveTicket.json.status, 'RESOLVED');

  const auditLogs = await apiFetch('/v1/admin/audit-logs', { token: adminToken });
  assert.equal(auditLogs.status, 200);
  assert.ok(auditLogs.json.some((l: any) => l.action === 'PAYMENT_CONFIRMED_WEBHOOK'));
  assert.ok(auditLogs.json.some((l: any) => l.action === 'SUPPORT_TICKET_UPDATED_BY_ADMIN'));

  // Gouvernance catalogue dynamique (suspension => 503 immédiat, puis rétablissement)
  const suspendRes = await apiFetch('/v1/admin/services/srv_sbee_prepaye/status', {
    method: 'PATCH',
    token: adminToken,
    body: { status: 'UNAVAILABLE' },
  });
  assert.equal(suspendRes.status, 200);

  const blockedAfterSuspend = await apiFetch('/v1/payments/intents', {
    method: 'POST',
    token: citizenA.token,
    body: {
      serviceId: 'srv_sbee_prepaye',
      amount: 2000,
      serviceReference: '14123456789',
      idempotencyKey: crypto.randomUUID(),
    },
  });
  assert.equal(blockedAfterSuspend.status, 503);

  await apiFetch('/v1/admin/services/srv_sbee_prepaye/status', {
    method: 'PATCH',
    token: adminToken,
    body: { status: 'SANDBOX_CONNECTED' },
  });

  // Demande d'effacement APDP
  const delBad = await apiFetch('/v1/auth/account/delete-request', {
    method: 'POST',
    token: citizenB.token,
    body: { confirmText: 'CONFIRMER' },
  });
  assert.equal(delBad.status, 400);

  const delOk = await apiFetch('/v1/auth/account/delete-request', {
    method: 'POST',
    token: citizenB.token,
    body: { confirmText: 'SUPPRIMER', reason: 'Fin d’utilisation' },
  });
  assert.equal(delOk.status, 202);
  assert.equal(delOk.json.accepted, true);

  // Vérification découverte racine, santé API (/v1/health) et OpenAPI
  const healthRes = await apiFetch('/v1/health');
  assert.equal(healthRes.status, 200);
  assert.equal(healthRes.json.name, 'Paiement BJ API');
  assert.equal(healthRes.json.apiPrefix, '/v1');
  assert.equal(healthRes.json.database.connected, false);
  assert.equal(healthRes.json.status, 'degraded');

  const rootDiscovery = await apiFetch('/');
  assert.equal(rootDiscovery.status, 200);
  assert.equal(rootDiscovery.json.healthUrl, '/v1/health');

  const apiDiscovery = await apiFetch('/api');
  assert.equal(apiDiscovery.status, 200);
  assert.equal(apiDiscovery.json.docsUrl, '/api/docs');

  const docsJsonRes = await apiFetch('/api/docs-json');
  assert.equal(docsJsonRes.status, 200);
  assert.ok(docsJsonRes.json?.openapi);
});

test('Intégration Serverless Vercel — Adaptateur apps/api/api/index.js sans app.listen()', async () => {
  const http = require('node:http');
  const prevNodeEnv = process.env.NODE_ENV;
  const prevVercel = process.env.VERCEL;
  process.env.NODE_ENV = 'test';
  process.env.VERCEL = '1';

  const vercelHandler = require('../apps/api/api/index.js');
  assert.equal(typeof vercelHandler, 'function');
  assert.equal(vercelHandler.config?.api?.bodyParser, false);

  const serverlessHttp = http.createServer(vercelHandler);
  await new Promise<void>((resolve) => serverlessHttp.listen(0, '127.0.0.1', () => resolve()));

  try {
    const addr = serverlessHttp.address();
    const svUrl = `http://127.0.0.1:${addr.port}`;

    const healthResp = await fetch(`${svUrl}/v1/health`);
    assert.equal(healthResp.status, 200);
    const healthJson: any = await healthResp.json();
    assert.equal(healthJson.runtime, 'vercel-serverless');

    const servicesResp = await fetch(`${svUrl}/v1/services`);
    assert.equal(servicesResp.status, 200);
    const servicesJson: any = await servicesResp.json();
    assert.ok(Array.isArray(servicesJson) && servicesJson.length >= 6);

    const swaggerHtml = await fetch(`${svUrl}/api/docs`);
    assert.equal(swaggerHtml.status, 200);
    const htmlBody = await swaggerHtml.text();
    assert.ok(htmlBody.includes('Paiement BJ — API OpenAPI') && htmlBody.includes('swagger-ui.css'));

    const swaggerInit = await fetch(`${svUrl}/api/docs/swagger-ui-init.js`);
    assert.equal(swaggerInit.status, 200);
  } finally {
    await new Promise<void>((resolve) => serverlessHttp.close(() => resolve()));
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNodeEnv;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
  }

  // Vérification du point d'entrée racine unifié /api/index.js
  const rootVercelHandler = require('../api/index.js');
  assert.equal(typeof rootVercelHandler, 'function');
  assert.equal(rootVercelHandler.config?.api?.bodyParser, false);
});

test('Mode MVP actif par défaut : OTP, 6 services LIVE, 5 canaux opérationnels et règlement bout en bout', async () => {
  const prevMvp = process.env.MVP_SIMULATION_MODE;
  const prevNodeEnv = process.env.NODE_ENV;
  const prevMtnSub = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
  const prevMtnUser = process.env.MTN_MOMO_API_USER;
  const prevMtnWebhook = process.env.MTN_MOMO_WEBHOOK_SECRET;
  delete process.env.MVP_SIMULATION_MODE;
  delete process.env.MTN_MOMO_SUBSCRIPTION_KEY;
  delete process.env.MTN_MOMO_API_USER;
  delete process.env.MTN_MOMO_WEBHOOK_SECRET;
  process.env.NODE_ENV = 'production';

  const mvpApp = await NestFactory.create(AppModule, { rawBody: true, logger: false });
  configureApp(mvpApp);
  await mvpApp.listen(0, '127.0.0.1');
  const mvpAddress = mvpApp.getHttpServer().address();
  const mvpBaseUrl = `http://127.0.0.1:${mvpAddress.port}`;

  try {
    const phone = '+2290197887766';
    const deviceId = 'dev-mvp-e2e-001';
    const otpReq = await apiFetch('/v1/auth/otp/request', {
      method: 'POST',
      baseUrl: mvpBaseUrl,
      body: { phone, platform: 'web', deviceId },
    });
    assert.equal(otpReq.status, 200);
    assert.match(otpReq.json.devOtpCode || '', /^\d{6}$/);

    const otpVerify = await apiFetch('/v1/auth/otp/verify', {
      method: 'POST',
      baseUrl: mvpBaseUrl,
      body: {
        phone,
        code: otpReq.json.devOtpCode,
        platform: 'web',
        deviceId,
        deviceName: 'Test MVP E2E',
      },
    });
    assert.equal(otpVerify.status, 200);
    const token = otpVerify.json.accessToken as string;
    assert.ok(token);

    const servicesRes = await apiFetch('/v1/services', { baseUrl: mvpBaseUrl });
    assert.equal(servicesRes.status, 200);
    assert.ok(Array.isArray(servicesRes.json) && servicesRes.json.length >= 6);
    for (const srv of servicesRes.json) {
      assert.equal(srv.integrationStatus, 'LIVE');
    }

    const providersRes = await apiFetch('/v1/payments/providers', {
      baseUrl: mvpBaseUrl,
      token,
    });
    assert.equal(providersRes.status, 200);
    assert.equal(providersRes.json.length, 5);
    for (const p of providersRes.json) {
      assert.equal(p.availability, 'OPERATIONAL');
    }

    const intentRes = await apiFetch('/v1/payments/intents', {
      method: 'POST',
      baseUrl: mvpBaseUrl,
      token,
      body: {
        serviceId: 'srv_soneb_facture',
        amount: 3500,
        serviceReference: 'SNB-998877',
        customerData: { subscriberNumber: 'SNB-998877' },
        idempotencyKey: crypto.randomUUID(),
      },
    });
    assert.equal(intentRes.status, 201);

    const attemptRes = await apiFetch('/v1/payments/attempts', {
      method: 'POST',
      baseUrl: mvpBaseUrl,
      token,
      body: {
        paymentIntentId: intentRes.json.id,
        providerCode: 'MTN_MOMO',
        payerPhone: phone,
      },
    });
    assert.equal(attemptRes.status, 200);

    const statusRes = await apiFetch(`/v1/payments/intents/${intentRes.json.id}/status`, {
      baseUrl: mvpBaseUrl,
      token,
    });
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.json.isConfirmed, true);
    assert.equal(statusRes.json.status, 'SUCCEEDED');

    const receiptRes = await apiFetch(`/v1/transactions/${intentRes.json.id}/receipt`, {
      baseUrl: mvpBaseUrl,
      token,
    });
    assert.equal(receiptRes.status, 200);
    assert.match(receiptRes.json.receiptNumber, /^REC-BJ-/);
    assert.match(receiptRes.json.digitalSignatureHash, /^[A-F0-9]{64}$/);

    const verifyNew = await apiFetch(
      `/v1/payments/receipts/verify?reference=${encodeURIComponent(receiptRes.json.receiptNumber)}`,
      { baseUrl: mvpBaseUrl }
    );
    assert.equal(verifyNew.status, 200);
    assert.equal(verifyNew.json.found, true);
    assert.equal(verifyNew.json.receipt?.isVerified, true);

    const verifySeed = await apiFetch('/v1/payments/receipts/verify?reference=PBJ-2026-0001', {
      baseUrl: mvpBaseUrl,
    });
    assert.equal(verifySeed.status, 200);
    assert.equal(verifySeed.json.found, true);
    assert.equal(verifySeed.json.receipt?.receiptNumber, 'REC-BJ-2026-0001');
  } finally {
    await mvpApp.close();
    if (prevMvp === undefined) delete process.env.MVP_SIMULATION_MODE;
    else process.env.MVP_SIMULATION_MODE = prevMvp;
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNodeEnv;
    if (prevMtnSub === undefined) delete process.env.MTN_MOMO_SUBSCRIPTION_KEY;
    else process.env.MTN_MOMO_SUBSCRIPTION_KEY = prevMtnSub;
    if (prevMtnUser === undefined) delete process.env.MTN_MOMO_API_USER;
    else process.env.MTN_MOMO_API_USER = prevMtnUser;
    if (prevMtnWebhook === undefined) delete process.env.MTN_MOMO_WEBHOOK_SECRET;
    else process.env.MTN_MOMO_WEBHOOK_SECRET = prevMtnWebhook;
  }
});
