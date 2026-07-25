import { z } from 'zod';
import { DiscountEnum } from '../../common/enums/product.enum';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const zOptionalBoolean = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
  }
  return val;
}, z.boolean().optional());

const zNumber = z.preprocess((val) => {
  if (typeof val === 'string' && val.trim() !== '') {
    const num = Number(val);
    if (!isNaN(num)) return num;
  }
  return val;
}, z.number());

export const createProductSchema = {
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(150, 'Name must be at most 150 characters')
      .trim(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .trim(),
    price: zNumber.pipe(z.number().min(0, 'Price cannot be negative')),
    stock: zNumber.pipe(z.number().int().min(0, 'Stock cannot be negative')),
    discount: z
      .object({
        discount: zNumber.pipe(
          z.number().min(0, 'Discount value cannot be negative'),
        ),
        type: z.enum([DiscountEnum.PERCENTAGE, DiscountEnum.FIXED]),
      })
      .optional(),
    category: z.string().regex(objectIdRegex, 'Invalid Category ID'),
    subCategory: z.string().regex(objectIdRegex, 'Invalid Subcategory ID'),
    brand: z.string().regex(objectIdRegex, 'Invalid Brand ID'),
    isActive: zOptionalBoolean,
  }),
};

export const updateProductSchema = {
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(150, 'Name must be at most 150 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .trim()
      .optional(),
    price: zNumber
      .pipe(z.number().min(0, 'Price cannot be negative'))
      .optional(),
    stock: zNumber
      .pipe(z.number().int().min(0, 'Stock cannot be negative'))
      .optional(),
    discount: z
      .object({
        discount: zNumber.pipe(
          z.number().min(0, 'Discount value cannot be negative'),
        ),
        type: z.enum([DiscountEnum.PERCENTAGE, DiscountEnum.FIXED]),
      })
      .optional(),
    category: z
      .string()
      .regex(objectIdRegex, 'Invalid Category ID')
      .optional(),
    subCategory: z
      .string()
      .regex(objectIdRegex, 'Invalid Subcategory ID')
      .optional(),
    brand: z.string().regex(objectIdRegex, 'Invalid Brand ID').optional(),
    isActive: zOptionalBoolean,
  }),
};

export type CreateProductDto = z.infer<typeof createProductSchema.body>;
export type UpdateProductDto = z.infer<typeof updateProductSchema.body>;
