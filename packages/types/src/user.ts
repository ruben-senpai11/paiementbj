export enum IdentityLevel {
  LEVEL_0_ANONYMOUS = 'LEVEL_0_ANONYMOUS',
  LEVEL_1_PHONE_VERIFIED = 'LEVEL_1_PHONE_VERIFIED',
  LEVEL_2_IDENTITY_VERIFIED = 'LEVEL_2_IDENTITY_VERIFIED',
  LEVEL_3_ENHANCED = 'LEVEL_3_ENHANCED',
}

export interface User {
  id: string;
  phone: string; // Format international E.164, ex: +22997000000
  identityLevel: IdentityLevel;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  language: 'fr' | 'en';
  accessibilitySettings: {
    reducedMotion: boolean;
    highContrast: boolean;
    largeFont: boolean;
  };
  notificationPreferences: {
    pushEnabled: boolean;
    smsEnabled: boolean;
    emailEnabled: boolean;
  };
}

export interface DeviceSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  platform: 'android' | 'ios' | 'web';
  ipAddress?: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: 'terms_of_service' | 'privacy_policy' | 'telemetry' | 'anip_verification';
  version: string;
  acceptedAt: string;
  revokedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'PAYMENT_STATUS' | 'SECURITY_ALERT' | 'SUPPORT_REPLY' | 'SYSTEM';
  isRead: boolean;
  resourceId?: string;
  createdAt: string;
}

export interface AdminUserInfo {
  id: string;
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'OPERATOR' | 'AUDITOR' | 'SUPPORT';
}

export interface AdminLoginResponse {
  accessToken: string;
  admin: AdminUserInfo;
}
