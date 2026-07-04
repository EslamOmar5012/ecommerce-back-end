import { z } from 'zod';

export const createCategorySchema = {
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .trim(),
    isActive: z.boolean().optional(),
  }),
};

export const updateCategorySchema = {
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

export type CreateCategoryDto = z.infer<typeof createCategorySchema.body>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema.body>;
