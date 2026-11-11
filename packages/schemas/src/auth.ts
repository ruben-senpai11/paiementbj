import { z } from 'zod';
import { validateAndNormalizeBeninPhone } from '@paiementbj/shared';

export const RequestOtpSchema = z.object({
  phone: z
    .string({ required_error: 'Le numéro de téléphone est obligatoire.' })
    .min(8, 'Le numéro doit comporter au moins 8 chiffres.')
    .refine((val) => validateAndNormalizeBeninPhone(val).isValid, {
      message: 'Format de numéro béninois invalide (ex: 01 97 00 00 00 ou 97 00 00 00).',
    }),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
});

export type RequestOtpDto = z.infer<typeof RequestOtpSchema>;

export const VerifyOtpSchema = z.object({
  phone: z
    .string()
    .refine((val) => validateAndNormalizeBeninPhone(val).isValid, {
      message: 'Format de numéro béninois invalide.',
    }),
  code: z
    .string({ required_error: 'Le code OTP est obligatoire.' })
    .length(6, 'Le code de vérification doit comporter exactement 6 chiffres.')
    .regex(/^\d{6}$/, 'Le code de confirmation ne doit comporter que des chiffres.'),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
});

export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;

export const ConsentSchema = z.object({
  purpose: z.enum(['terms_of_service', 'privacy_policy', 'telemetry', 'anip_verification']),
  version: z.string().min(1),
  accepted: z.boolean().refine((v) => v === true, {
    message: 'Vous devez accepter les conditions pour continuer.',
  }),
});

export type ConsentDto = z.infer<typeof ConsentSchema>;

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  email: z.string().email('Adresse e-mail invalide.').optional().or(z.literal('')),
  language: z.enum(['fr', 'en']).optional(),
  accessibilitySettings: z
    .object({
      reducedMotion: z.boolean().optional(),
      highContrast: z.boolean().optional(),
      largeFont: z.boolean().optional(),
    })
    .optional(),
  notificationPreferences: z
    .object({
      pushEnabled: z.boolean().optional(),
      smsEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
    })
    .optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export const RevokeSessionSchema = z.object({
  deviceId: z.string().min(1, 'Identifiant d’appareil requis.'),
});

export type RevokeSessionDto = z.infer<typeof RevokeSessionSchema>;

export const RequestAccountDeletionSchema = z.object({
  reason: z.string().max(500).optional(),
  confirmText: z.literal('SUPPRIMER', {
    errorMap: () => ({ message: 'Veuillez saisir SUPPRIMER pour confirmer votre demande.' }),
  }),
});

export type RequestAccountDeletionDto = z.infer<typeof RequestAccountDeletionSchema>;

export const AdminLoginSchema = z.object({
  email: z.string().email('Adresse e-mail administrateur invalide.'),
  password: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères.'),
});

export type AdminLoginDto = z.infer<typeof AdminLoginSchema>;
