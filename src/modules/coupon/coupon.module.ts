import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from '../../models/coupon.schema';
import { CouponRepository } from '../../repo/coupon.repo';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }]),
  ],
  controllers: [CouponController],
  providers: [CouponRepository, CouponService],
  exports: [CouponRepository, CouponService],
})
export class CouponModule {}
