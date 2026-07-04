import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DbRepo } from './db.repo';
import { Product, ProductDocument } from '../models/product.schema';

@Injectable()
export class ProductRepository extends DbRepo<ProductDocument> {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {
    super(productModel);
  }

  async findByName(name: string): Promise<ProductDocument | null> {
    return this.findOne({ name });
  }

  async findBySlug(slug: string): Promise<ProductDocument | null> {
    return this.findOne({ slug, deletedAt: null });
  }

  async nameExists(name: string): Promise<boolean> {
    return this.exists({ name, deletedAt: null });
  }
}
