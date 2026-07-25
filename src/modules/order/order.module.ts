import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../../models/order.schema';
import { OrderRepository } from '../../repo/order.repo';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CartModule } from '../cart/cart.module';
import { ProductModule } from '../product/product.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    CartModule,
    ProductModule,
    CouponModule,
  ],
  controllers: [OrderController],
  providers: [OrderRepository, OrderService],
  exports: [OrderRepository, OrderService],
})
export class OrderModule {}
