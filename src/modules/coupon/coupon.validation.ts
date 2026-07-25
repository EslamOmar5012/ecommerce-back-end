import { z } from 'zod';
import { CouponType } from '../../models/coupon.schema';

export const createCouponSchema = {
  body: z.object({
    code: z
      .string()
      .min(2, 'Code must be at least 2 characters')
      .max(30, 'Code must be at most 30 characters')
      .trim()
      .toUpperCase(),
    discount: z.number().min(0, 'Discount cannot be negative'),
    type: z.nativeEnum(CouponType).optional(),
    expireAt: z.string().min(1, 'Expiration date is required'),
    usageLimit: z
      .number()
      .int()
      .min(1, 'Usage limit must be at least 1')
      .optional(),
  }),
};

export const updateCouponSchema = {
  body: z.object({
    code: z
      .string()
      .min(2, 'Code must be at least 2 characters')
      .max(30, 'Code must be at most 30 characters')
      .trim()
      .toUpperCase()
      .optional(),
    discount: z.number().min(0, 'Discount cannot be negative').optional(),
    type: z.nativeEnum(CouponType).optional(),
    expireAt: z.string().optional(),
    usageLimit: z
      .number()
      .int()
      .min(1, 'Usage limit must be at least 1')
      .optional(),
    isActive: z.boolean().optional(),
  }),
};

export type CreateCouponDto = z.infer<typeof createCouponSchema.body>;
export type UpdateCouponDto = z.infer<typeof updateCouponSchema.body>;
