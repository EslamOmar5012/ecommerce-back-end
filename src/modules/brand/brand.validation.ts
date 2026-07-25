import { z } from 'zod';

const zOptionalBoolean = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
  }
  return val;
}, z.boolean().optional());

export const createBrandSchema = {
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .trim(),
    isActive: zOptionalBoolean,
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
    isActive: zOptionalBoolean,
  }),
};

export type CreateBrandDto = z.infer<typeof createBrandSchema.body>;
export type UpdateBrandDto = z.infer<typeof updateBrandSchema.body>;
