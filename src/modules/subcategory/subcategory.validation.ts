import { z } from 'zod';

export const createSubcategorySchema = {
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .trim(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID'),
    isActive: z.boolean().optional(),
  }),
};

export const updateSubcategorySchema = {
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .trim()
      .optional(),
    categoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID')
      .optional(),
    isActive: z.boolean().optional(),
  }),
};

export type CreateSubcategoryDto = z.infer<typeof createSubcategorySchema.body>;
export type UpdateSubcategoryDto = z.infer<typeof updateSubcategorySchema.body>;
