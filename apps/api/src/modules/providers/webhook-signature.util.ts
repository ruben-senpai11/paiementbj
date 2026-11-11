import * as crypto from 'crypto';

export interface WebhookSignatureCheck {
  valid: boolean;
  reason?: string;
}

/**
 * Vérifie la signature HMAC-SHA256 et la fenêtre anti-rejeu (5 min) d'un webhook prestataire.
 * Signature attendue : HMAC_SHA256(secret, `${timestamp}.${rawPayload}`) en hexadécimal.
 */
export function verifyHmacWebhook(params: {
  secret: string;
  headers: Record<string, string | string[] | undefined>;
  rawPayload: string;
  maxAgeSeconds?: number;
}): WebhookSignatureCheck {
  const { secret, headers, rawPayload, maxAgeSeconds = 300 } = params;

  if (!secret) {
    return { valid: false, reason: 'WEBHOOK_SECRET_NOT_CONFIGURED' };
  }

  const normalizedHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (typeof v === 'string') {
      normalizedHeaders[k.toLowerCase()] = v;
    } else if (Array.isArray(v) && v[0]) {
      normalizedHeaders[k.toLowerCase()] = v[0];
    }
  }

  const signature = (normalizedHeaders['x-signature'] || '').trim().toLowerCase();
  const timestampHeader = (normalizedHeaders['x-timestamp'] || '').trim();

  if (!signature || !timestampHeader) {
    return { valid: false, reason: 'MISSING_SIGNATURE_OR_TIMESTAMP' };
  }

  // Validation fenêtre anti-rejeu
  let tsSeconds = Number(timestampHeader);
  if (Number.isNaN(tsSeconds)) {
    const parsedMs = Date.parse(timestampHeader);
    if (!Number.isNaN(parsedMs)) {
      tsSeconds = Math.floor(parsedMs / 1000);
    }
  }

  if (Number.isNaN(tsSeconds)) {
    return { valid: false, reason: 'INVALID_TIMESTAMP' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - tsSeconds) > maxAgeSeconds) {
    return { valid: false, reason: 'TIMESTAMP_OUT_OF_WINDOW' };
  }

  const signedContent = `${timestampHeader}.${rawPayload}`;
  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex')
    .toLowerCase();

  const expectedBuf = Buffer.from(expectedHex, 'utf8');
  const actualBuf = Buffer.from(signature, 'utf8');

  if (
    expectedBuf.length !== actualBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, actualBuf)
  ) {
    return { valid: false, reason: 'INVALID_HMAC_SIGNATURE' };
  }

  return { valid: true };
}
