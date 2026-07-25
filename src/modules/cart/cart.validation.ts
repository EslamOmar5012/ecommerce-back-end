import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const addToCartSchema = {
  body: z.object({
    productId: z.string().regex(objectIdRegex, 'Invalid Product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').optional(),
  }),
};

export const updateQuantitySchema = {
  body: z.object({
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  }),
};

export type AddToCartDto = z.infer<typeof addToCartSchema.body>;
export type UpdateQuantityDto = z.infer<typeof updateQuantitySchema.body>;
