import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CouponDocument = HydratedDocument<Coupon>;

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Schema({ timestamps: true })
export class Coupon {
  @Prop({
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  })
  code: string;

  @Prop({
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative'],
  })
  discount: number;

  @Prop({
    type: String,
    enum: Object.values(CouponType),
    default: CouponType.PERCENTAGE,
  })
  type: CouponType;

  @Prop({
    type: Date,
    required: [true, 'Expiration date is required'],
  })
  expireAt: Date;

  @Prop({
    type: Number,
    default: null,
  })
  usageLimit?: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  usedCount: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

CouponSchema.index({ code: 1, isActive: 1, deletedAt: 1 });
