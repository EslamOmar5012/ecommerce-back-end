import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DbRepo } from './db.repo';
import { Cart, CartDocument } from '../models/cart.schema';

@Injectable()
export class CartRepository extends DbRepo<CartDocument> {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
  ) {
    super(cartModel);
  }

  async findByUserId(userId: string): Promise<CartDocument | null> {
    return this.findOne({ userId });
  }
}
