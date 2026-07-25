import { z } from 'zod';
import { OrderStatus } from '../../models/order.schema';

export const createOrderSchema = {
  body: z.object({
    shippingAddress: z.object({
      street: z.string().min(3, 'Street is required'),
      city: z.string().min(2, 'City is required'),
      phone: z.string().optional(),
      country: z.string().optional(),
    }),
    phone: z.string().min(5, 'Contact phone number is required'),
    couponCode: z.string().trim().toUpperCase().optional(),
  }),
};

export const updateStatusSchema = {
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
};

export const refundOrderSchema = {
  body: z.object({
    refundReason: z.string().optional(),
  }),
};

export type CreateOrderDto = z.infer<typeof createOrderSchema.body>;
export type UpdateStatusDto = z.infer<typeof updateStatusSchema.body>;
export type RefundOrderDto = z.infer<typeof refundOrderSchema.body>;
