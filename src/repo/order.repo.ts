import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DbRepo } from './db.repo';
import { Order, OrderDocument } from '../models/order.schema';

@Injectable()
export class OrderRepository extends DbRepo<OrderDocument> {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {
    super(orderModel);
  }

  async findByUserId(userId: string): Promise<OrderDocument[]> {
    return this.findAll({ userId });
  }

  async findByPaymobOrderId(
    paymobOrderId: string,
  ): Promise<OrderDocument | null> {
    return this.findOne({ paymobOrderId });
  }
}
