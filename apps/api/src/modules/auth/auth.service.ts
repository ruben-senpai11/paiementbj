import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { validateAndNormalizeBeninPhone } from '@paiementbj/shared';
import {
  RequestOtpDto,
  VerifyOtpDto,
  ConsentDto,
  UpdateProfileDto,
  RevokeSessionDto,
  RequestAccountDeletionDto,
} from '@paiementbj/schemas';
import {
  User,
  UserProfile,
  DeviceSession,
  ConsentRecord,
  IdentityLevel,
} from '@paiementbj/types';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from './sms.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly inMemoryUsers = new Map<string, User>();
  private readonly inMemorySessions = new Map<string, DeviceSession[]>();
  private readonly inMemoryConsents = new Map<string, ConsentRecord[]>();
  private readonly inMemoryDeletionRequests = new Map<string, { requestedAt: string; reason?: string }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    const phoneRes = validateAndNormalizeBeninPhone(dto.phone);
    if (!phoneRes.isValid || !phoneRes.normalized) {
      throw new BadRequestException('Format de numéro de téléphone béninois invalide.');
    }

    const { code, expiresInSeconds } = await this.smsService.sendOtp(phoneRes.normalized);

    await this.audit.log({
      actorType: 'USER',
      action: 'AUTH_OTP_REQUESTED',
      resourceType: 'auth',
      details: { phone: phoneRes.normalized, operator: phoneRes.operator },
    });

    const exposeDevOtp =
      process.env.NODE_ENV !== 'production' && process.env.SMS_PROVIDER !== 'production';

    return {
      message: 'Code de vérification envoyé par SMS avec succès.',
      expiresInSeconds,
      ...(exposeDevOtp ? { devOtpCode: code } : {}),
    };
  }

  async verifyOtp(dto: VerifyOtpDto, clientIp?: string) {
    const phoneRes = validateAndNormalizeBeninPhone(dto.phone);
    if (!phoneRes.isValid || !phoneRes.normalized) {
      throw new BadRequestException('Format de numéro béninois invalide.');
    }

    const isValid = await this.smsService.verifyOtp(phoneRes.normalized, dto.code);
    if (!isValid) {
      throw new UnauthorizedException('Code de vérification incorrect ou expiré.');
    }

    const normalizedPhone = phoneRes.normalized;
    const deviceId = dto.deviceId || `dev_${crypto.randomUUID().slice(0, 12)}`;
    const deviceName =
      dto.deviceName ||
      (dto.platform === 'ios'
        ? 'Appareil iOS'
        : dto.platform === 'web'
        ? 'Navigateur Web'
        : 'Appareil Android');
    const platform = dto.platform || 'android';

    let user: User;

    try {
      const dbUser = await this.prisma.user.upsert({
        where: { phone: normalizedPhone },
        update: { isActive: true },
        create: {
          phone: normalizedPhone,
          identityLevel: 'LEVEL_1_PHONE_VERIFIED',
          profile: {
            create: {
              language: 'fr',
            },
          },
        },
        include: { profile: true },
      });

      user = this.mapDbUser(dbUser);

      await this.prisma.deviceSession.create({
        data: {
          userId: user.id,
          deviceId,
          deviceName,
          platform,
          ipAddress: clientIp,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Fallback mémoire pour utilisateur : ${err.message}`);
      let memUser = this.inMemoryUsers.get(normalizedPhone);
      if (!memUser) {
        const userId = `usr_${crypto.randomUUID()}`;
        memUser = {
          id: userId,
          phone: normalizedPhone,
          identityLevel: IdentityLevel.LEVEL_1_PHONE_VERIFIED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          profile: this.defaultProfile(userId),
        };
        this.inMemoryUsers.set(normalizedPhone, memUser);
      }
      user = memUser;

      const sessions = this.inMemorySessions.get(user.id) || [];
      const nowIso = new Date().toISOString();
      const updated = sessions
        .filter((s) => s.deviceId !== deviceId)
        .map((s) => ({ ...s, isCurrent: false }));
      updated.unshift({
        id: `ses_${crypto.randomUUID()}`,
        userId: user.id,
        deviceId,
        deviceName,
        platform,
        ipAddress: clientIp,
        lastActiveAt: nowIso,
        createdAt: nowIso,
        isCurrent: true,
      });
      this.inMemorySessions.set(user.id, updated);
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
      level: user.identityLevel,
      actorType: 'USER' as const,
      deviceId,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.audit.log({
      actorId: user.id,
      actorType: 'USER',
      action: 'AUTH_LOGIN_SUCCESS',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: clientIp,
      details: { deviceId, platform },
    });

    await this.notifications.notifyUser(user.id, {
      title: 'Nouvelle connexion sécurisée',
      body: `Connexion confirmée depuis ${deviceName} (${platform}).`,
      type: 'SECURITY_ALERT',
      resourceId: deviceId,
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async getMe(userId: string): Promise<User> {
    try {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (!dbUser) {
        throw new UnauthorizedException('Utilisateur introuvable.');
      }

      return this.mapDbUser(dbUser);
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      for (const u of this.inMemoryUsers.values()) {
        if (u.id === userId) return u;
      }
      throw new UnauthorizedException('Session utilisateur expirée.');
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    try {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      if (dbUser) {
        const updatedProfile = await this.prisma.userProfile.upsert({
          where: { userId },
          update: {
            ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
            ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
            ...(dto.email !== undefined ? { email: dto.email || null } : {}),
            ...(dto.language !== undefined ? { language: dto.language } : {}),
            ...(dto.accessibilitySettings?.reducedMotion !== undefined
              ? { reducedMotion: dto.accessibilitySettings.reducedMotion }
              : {}),
            ...(dto.accessibilitySettings?.highContrast !== undefined
              ? { highContrast: dto.accessibilitySettings.highContrast }
              : {}),
            ...(dto.accessibilitySettings?.largeFont !== undefined
              ? { largeFont: dto.accessibilitySettings.largeFont }
              : {}),
            ...(dto.notificationPreferences?.pushEnabled !== undefined
              ? { pushNotifications: dto.notificationPreferences.pushEnabled }
              : {}),
            ...(dto.notificationPreferences?.smsEnabled !== undefined
              ? { smsNotifications: dto.notificationPreferences.smsEnabled }
              : {}),
            ...(dto.notificationPreferences?.emailEnabled !== undefined
              ? { emailNotifications: dto.notificationPreferences.emailEnabled }
              : {}),
          },
          create: {
            userId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email || null,
            language: dto.language || 'fr',
            reducedMotion: dto.accessibilitySettings?.reducedMotion ?? false,
            highContrast: dto.accessibilitySettings?.highContrast ?? false,
            largeFont: dto.accessibilitySettings?.largeFont ?? false,
            pushNotifications: dto.notificationPreferences?.pushEnabled ?? true,
            smsNotifications: dto.notificationPreferences?.smsEnabled ?? true,
            emailNotifications: dto.notificationPreferences?.emailEnabled ?? false,
          },
        });

        await this.audit.log({
          actorId: userId,
          actorType: 'USER',
          action: 'PROFILE_UPDATED',
          resourceType: 'user_profile',
          resourceId: updatedProfile.id,
        });

        return await this.getMe(userId);
      }
    } catch {
      // Fallback mémoire
    }

    for (const u of this.inMemoryUsers.values()) {
      if (u.id === userId) {
        const currentProfile = u.profile || this.defaultProfile(userId);
        u.profile = {
          ...currentProfile,
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
          ...(dto.email !== undefined ? { email: dto.email || undefined } : {}),
          ...(dto.language !== undefined ? { language: dto.language } : {}),
          accessibilitySettings: {
            ...currentProfile.accessibilitySettings,
            ...dto.accessibilitySettings,
          },
          notificationPreferences: {
            ...currentProfile.notificationPreferences,
            ...dto.notificationPreferences,
          },
        };
        u.updatedAt = new Date().toISOString();

        await this.audit.log({
          actorId: userId,
          actorType: 'USER',
          action: 'PROFILE_UPDATED',
          resourceType: 'user_profile',
          resourceId: u.profile.id,
        });

        return u;
      }
    }

    throw new NotFoundException('Profil utilisateur introuvable.');
  }

  async listSessions(userId: string): Promise<DeviceSession[]> {
    try {
      const dbSessions = await this.prisma.deviceSession.findMany({
        where: { userId, isRevoked: false },
        orderBy: { lastActiveAt: 'desc' },
      });
      if (dbSessions.length > 0) {
        return dbSessions.map((s, idx) => ({
          id: s.id,
          userId: s.userId,
          deviceId: s.deviceId,
          deviceName: s.deviceName,
          platform: s.platform as any,
          ipAddress: s.ipAddress || undefined,
          lastActiveAt: s.lastActiveAt.toISOString(),
          createdAt: s.createdAt.toISOString(),
          isCurrent: idx === 0,
        }));
      }
    } catch {
      // Fallback mémoire
    }
    return this.inMemorySessions.get(userId) || [];
  }

  async revokeSession(userId: string, dto: RevokeSessionDto): Promise<{ success: boolean }> {
    let revoked = false;
    try {
      const res = await this.prisma.deviceSession.updateMany({
        where: { userId, deviceId: dto.deviceId, isRevoked: false },
        data: { isRevoked: true },
      });
      revoked = res.count > 0;
    } catch {
      // Fallback mémoire
    }

    const mem = this.inMemorySessions.get(userId) || [];
    const remaining = mem.filter((s) => s.deviceId !== dto.deviceId);
    if (remaining.length !== mem.length) {
      revoked = true;
      this.inMemorySessions.set(userId, remaining);
    }

    if (!revoked) {
      throw new NotFoundException('Session ou appareil introuvable.');
    }

    await this.audit.log({
      actorId: userId,
      actorType: 'USER',
      action: 'DEVICE_SESSION_REVOKED',
      resourceType: 'device_session',
      resourceId: dto.deviceId,
    });

    return { success: true };
  }

  async listConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const dbConsents = await this.prisma.consentRecord.findMany({
        where: { userId },
        orderBy: { acceptedAt: 'desc' },
      });
      if (dbConsents.length > 0) {
        return dbConsents.map((c) => ({
          id: c.id,
          userId: c.userId,
          purpose: c.purpose as ConsentRecord['purpose'],
          version: c.version,
          acceptedAt: c.acceptedAt.toISOString(),
          revokedAt: c.revokedAt ? c.revokedAt.toISOString() : undefined,
        }));
      }
    } catch {
      // Fallback mémoire
    }
    return this.inMemoryConsents.get(userId) || [];
  }

  async recordConsent(userId: string, dto: ConsentDto): Promise<ConsentRecord> {
    let record: ConsentRecord;
    try {
      const dbRecord = await this.prisma.consentRecord.create({
        data: {
          userId,
          purpose: dto.purpose,
          version: dto.version,
        },
      });
      record = {
        id: dbRecord.id,
        userId: dbRecord.userId,
        purpose: dbRecord.purpose as ConsentRecord['purpose'],
        version: dbRecord.version,
        acceptedAt: dbRecord.acceptedAt.toISOString(),
      };
    } catch {
      record = {
        id: `cns_${crypto.randomUUID()}`,
        userId,
        purpose: dto.purpose,
        version: dto.version,
        acceptedAt: new Date().toISOString(),
      };
      const existing = this.inMemoryConsents.get(userId) || [];
      this.inMemoryConsents.set(userId, [record, ...existing]);
    }

    await this.audit.log({
      actorId: userId,
      actorType: 'USER',
      action: 'USER_CONSENT_RECORDED',
      resourceType: 'consent_record',
      resourceId: record.id,
      details: { purpose: dto.purpose, version: dto.version },
    });

    return record;
  }

  async requestAccountDeletion(
    userId: string,
    dto: RequestAccountDeletionDto
  ): Promise<{ accepted: boolean; scheduledAt: string; message: string }> {
    const scheduledAt = new Date().toISOString();
    this.inMemoryDeletionRequests.set(userId, {
      requestedAt: scheduledAt,
      reason: dto.reason,
    });

    await this.audit.log({
      actorId: userId,
      actorType: 'USER',
      action: 'APDP_ACCOUNT_DELETION_REQUESTED',
      resourceType: 'user',
      resourceId: userId,
      details: {
        legalBasis: 'Loi APDP n°2017-20 / Conservation légale comptable maintenue',
        reason: dto.reason,
      },
    });

    await this.notifications.notifyUser(userId, {
      title: 'Demande de suppression enregistrée',
      body: 'Votre demande de désactivation et suppression APDP a été enregistrée. Les pièces comptables réglementaires demeurent archivées selon la loi.',
      type: 'SECURITY_ALERT',
    });

    return {
      accepted: true,
      scheduledAt,
      message:
        'Demande de suppression de compte enregistrée conformément à la loi béninoise sur la protection des données personnelles.',
    };
  }

  private defaultProfile(userId: string): UserProfile {
    return {
      id: `prof_${userId}`,
      userId,
      language: 'fr',
      accessibilitySettings: {
        reducedMotion: false,
        highContrast: false,
        largeFont: false,
      },
      notificationPreferences: {
        pushEnabled: true,
        smsEnabled: true,
        emailEnabled: false,
      },
    };
  }

  private mapDbUser(dbUser: any): User {
    return {
      id: dbUser.id,
      phone: dbUser.phone,
      identityLevel: dbUser.identityLevel as IdentityLevel,
      createdAt: dbUser.createdAt instanceof Date ? dbUser.createdAt.toISOString() : dbUser.createdAt,
      updatedAt: dbUser.updatedAt instanceof Date ? dbUser.updatedAt.toISOString() : dbUser.updatedAt,
      isActive: dbUser.isActive,
      profile: dbUser.profile
        ? {
            id: dbUser.profile.id,
            userId: dbUser.profile.userId,
            firstName: dbUser.profile.firstName || undefined,
            lastName: dbUser.profile.lastName || undefined,
            email: dbUser.profile.email || undefined,
            language: (dbUser.profile.language as 'fr' | 'en') || 'fr',
            accessibilitySettings: {
              reducedMotion: Boolean(dbUser.profile.reducedMotion),
              highContrast: Boolean(dbUser.profile.highContrast),
              largeFont: Boolean(dbUser.profile.largeFont),
            },
            notificationPreferences: {
              pushEnabled: Boolean(dbUser.profile.pushNotifications),
              smsEnabled: Boolean(dbUser.profile.smsNotifications),
              emailEnabled: Boolean(dbUser.profile.emailNotifications),
            },
          }
        : this.defaultProfile(dbUser.id),
    };
  }
}
