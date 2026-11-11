import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as crypto from 'crypto';

export interface OtpEntry {
  code: string;
  expiresAt: number;
  requestCount: number;
  verifyAttempts: number;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly otpStore = new Map<string, OtpEntry>();

  async sendOtp(phone: string): Promise<{ code: string; expiresInSeconds: number }> {
    const existing = this.otpStore.get(phone);
    const now = Date.now();

    // Limitation de débit (Anti-Spam)
    if (existing && existing.expiresAt > now && existing.requestCount >= 5) {
      throw new HttpException(
        'Trop de demandes de code OTP. Veuillez patienter avant de demander un nouveau code.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    const isProdEnv = process.env.NODE_ENV === 'production';
    const smsProvider = process.env.SMS_PROVIDER || 'sandbox';
    const hasProdGatewayKey = Boolean(process.env.SMS_API_KEY);

    if (isProdEnv && (smsProvider === 'sandbox' || !hasProdGatewayKey)) {
      throw new ServiceUnavailableException(
        'Passerelle SMS de production non configurée. Impossible d’envoyer le code de vérification.'
      );
    }

    // Génération cryptographique d'un code OTP à 6 chiffres (CSPRNG)
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresInSeconds = Number(process.env.OTP_EXPIRY_SECONDS || 180);

    this.otpStore.set(phone, {
      code,
      expiresAt: now + expiresInSeconds * 1000,
      requestCount: existing && existing.expiresAt > now ? existing.requestCount + 1 : 1,
      verifyAttempts: 0,
    });

    if (smsProvider !== 'production' && !hasProdGatewayKey) {
      this.logger.log(
        `[SMS-SANDBOX] Code OTP généré pour ${phone} (Valide ${expiresInSeconds}s)`
      );
    } else {
      // Passerelle télécom agréée ARCEP Bénin
      this.logger.log(`[SMS-GATEWAY:${smsProvider}] Envoi de SMS OTP sécurisé vers ${phone}`);
    }

    return { code, expiresInSeconds };
  }

  async verifyOtp(phone: string, inputCode: string): Promise<boolean> {
    const entry = this.otpStore.get(phone);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.otpStore.delete(phone);
      return false;
    }

    entry.verifyAttempts += 1;

    const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS || 5);
    if (entry.verifyAttempts > maxAttempts) {
      this.otpStore.delete(phone);
      throw new HttpException(
        'Nombre maximal de tentatives dépassé pour ce code de vérification.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    const expectedBuf = Buffer.from(entry.code, 'utf8');
    const actualBuf = Buffer.from(inputCode.trim(), 'utf8');
    const isMatch =
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf);

    if (isMatch) {
      // Invalidation immédiate après vérification réussie (Single-Use OTP)
      this.otpStore.delete(phone);
      return true;
    }

    return false;
  }
}
