import { z } from 'zod';

export const ServiceQuerySchema = z.object({
  category: z.enum([
    'UTILITIES_BILLS',
    'PUBLIC_ADMINISTRATION',
    'GOODS_SERVICES',
    'TRANSFERS',
    'INTERNATIONAL',
  ]).optional(),
  q: z.string().max(100).optional(),
  status: z.enum([
    'LIVE',
    'SANDBOX_CONNECTED',
    'PENDING_AGREEMENT',
    'TECHNICAL_IN_PROGRESS',
    'UNAVAILABLE',
  ]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ServiceQueryDto = z.infer<typeof ServiceQuerySchema>;
