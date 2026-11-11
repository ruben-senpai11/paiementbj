import { z } from 'zod';

export const CreatePaymentIntentSchema = z.object({
  serviceId: z.string({ required_error: 'Le service sélectionné est requis.' }),
  amount: z
    .number({ required_error: 'Le montant est obligatoire.' })
    .positive('Le montant doit être supérieur à zéro.')
    .max(5000000, 'Le montant dépasse le plafond journalier autorisé.'),
  serviceReference: z
    .string({ required_error: 'La référence du service ou de facture est requise.' })
    .min(2, 'La référence doit comporter au moins 2 caractères.')
    .max(64, 'La référence ne doit pas dépasser 64 caractères.'),
  customerData: z.record(z.string()).default({}),
  idempotencyKey: z
    .string({ required_error: 'Une clé d’idempotence est requise pour sécuriser l’opération.' })
    .uuid('La clé d’idempotence doit être un UUID valide.'),
});

export type CreatePaymentIntentDto = z.infer<typeof CreatePaymentIntentSchema>;

export const CreatePaymentAttemptSchema = z.object({
  paymentIntentId: z.string().min(1, 'Identifiant d’intention de paiement requis.'),
  providerCode: z.enum(['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH', 'BANK_CARD', 'TRESOR_PAY'], {
    required_error: 'Veuillez sélectionner un moyen de paiement.',
  }),
  payerPhone: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

export type CreatePaymentAttemptDto = z.infer<typeof CreatePaymentAttemptSchema>;

export const PaymentQuoteSchema = z.object({
  serviceId: z.string().min(1, 'Identifiant de service requis.'),
  providerCode: z.enum(['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH', 'BANK_CARD', 'TRESOR_PAY']),
  amount: z.coerce.number().positive('Le montant doit être positif.'),
  currency: z.enum(['XOF', 'EUR', 'USD']).default('XOF'),
});

export type PaymentQuoteDto = z.infer<typeof PaymentQuoteSchema>;

export const ValidatePaymentSchema = z.object({
  serviceId: z.string().min(1, 'Identifiant de service requis.'),
  providerCode: z.enum(['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH', 'BANK_CARD', 'TRESOR_PAY']),
  serviceReference: z.string().min(2, 'Référence du service requise.').max(64),
  amount: z.coerce.number().positive().optional(),
});

export type ValidatePaymentDto = z.infer<typeof ValidatePaymentSchema>;
