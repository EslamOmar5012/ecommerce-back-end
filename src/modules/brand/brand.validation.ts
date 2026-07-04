import { z } from 'zod';

export const createBrandSchema = {
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .trim(),
    isActive: z.boolean().optional(),
  }),
};

export const updateBrandSchema = {
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .trim()
      .optional(),
    isActive: z.boolean().optional(),
  }),
};

export type CreateBrandDto = z.infer<typeof createBrandSchema.body>;
export type UpdateBrandDto = z.infer<typeof updateBrandSchema.body>;
