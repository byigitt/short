import { z } from 'zod';

export const urlSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  customAlias: z.string()
    .min(3, 'Custom alias must be at least 3 characters')
    .max(32, 'Custom alias cannot be longer than 32 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Custom alias can only contain letters, numbers, hyphens, and underscores')
    .optional()
    .or(z.literal('')), // Allow empty string
  expiresAt: z.string().datetime().optional(),
});

export type UrlInput = z.infer<typeof urlSchema>;

export const urlParamsSchema = z.object({
  shortCode: z
    .string()
    .min(1, 'Short code is required')
    .max(20, 'Short code is too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid short code format'),
});

export type UrlParams = z.infer<typeof urlParamsSchema>; 