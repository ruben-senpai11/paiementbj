import { z } from 'zod';

export const CreateSupportTicketSchema = z.object({
  transactionId: z.string().min(4).max(80).optional(),
  category: z.enum([
    'DEBITED_NOT_CREDITED',
    'INCORRECT_AMOUNT',
    'REFERENCE_ERROR',
    'RECEIPT_NOT_GENERATED',
    'TECHNICAL_DIFFICULTY',
    'OTHER',
  ], {
    required_error: 'Veuillez sélectionner un motif de réclamation.',
  }),
  title: z
    .string({ required_error: 'L’objet de la réclamation est requis.' })
    .min(5, 'L’objet doit comporter au moins 5 caractères.')
    .max(120, 'L’objet ne doit pas dépasser 120 caractères.'),
  description: z
    .string({ required_error: 'La description détaillée est requise.' })
    .min(15, 'Veuillez préciser votre demande en au moins 15 caractères.')
    .max(2000, 'La description ne doit pas dépasser 2000 caractères.'),
});

export type CreateSupportTicketDto = z.infer<typeof CreateSupportTicketSchema>;

export const AddSupportMessageSchema = z.object({
  ticketId: z.string().min(1).optional(),
  content: z
    .string({ required_error: 'Le message ne peut pas être vide.' })
    .min(2, 'Le message est trop court.')
    .max(2000, 'Le message dépasse la limite autorisée.'),
});

export type AddSupportMessageDto = z.infer<typeof AddSupportMessageSchema>;

export const UpdateSupportTicketAdminSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED']),
  resolutionNotes: z.string().max(2000).optional(),
});

export type UpdateSupportTicketAdminDto = z.infer<typeof UpdateSupportTicketAdminSchema>;
