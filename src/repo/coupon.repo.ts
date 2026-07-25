import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DbRepo } from './db.repo';
import { Coupon, CouponDocument } from '../models/coupon.schema';

@Injectable()
export class CouponRepository extends DbRepo<CouponDocument> {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
  ) {
    super(couponModel);
  }

  async findByCode(code: string): Promise<CouponDocument | null> {
    return this.findOne({ code: code.toUpperCase(), deletedAt: null });
  }

  async codeExists(code: string): Promise<boolean> {
    return this.exists({ code: code.toUpperCase(), deletedAt: null });
  }
}
