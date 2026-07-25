import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum PaymentType {
  CASH = 'cash',
  CARD = 'card',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum RefundStatus {
  NONE = 'none',
  REQUESTED = 'requested',
  REFUNDED = 'refunded',
  REJECTED = 'rejected',
}

@Schema({ _id: false })
class OrderProduct {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  })
  quantity: number;

  @Prop({
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  })
  price: number;

  @Prop({
    type: String,
    required: true,
  })
  name: string;
}

@Schema({ _id: false })
class ShippingAddress {
  @Prop({ type: String, required: true })
  street: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: false, default: '' })
  phone?: string;

  @Prop({ type: String, required: false, default: 'Egypt' })
  country?: string;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: [OrderProduct],
    required: true,
  })
  products: OrderProduct[];

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  totalPrice: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  discount: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  finalPrice: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null,
  })
  couponId?: Types.ObjectId;

  @Prop({
    type: ShippingAddress,
    required: true,
  })
  shippingAddress: ShippingAddress;

  @Prop({
    type: String,
    required: true,
  })
  phone: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentType),
    default: PaymentType.CASH,
  })
  paymentType: PaymentType;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Prop({
    type: String,
    enum: Object.values(RefundStatus),
    default: RefundStatus.NONE,
  })
  refundStatus: RefundStatus;

  @Prop({
    type: String,
    default: '',
  })
  refundReason?: string;

  @Prop({
    type: String,
    default: null,
  })
  paymobOrderId?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ paymobOrderId: 1 }, { sparse: true });
OrderSchema.index({ status: 1, paymentStatus: 1 });
