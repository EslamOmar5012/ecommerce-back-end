import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DbRepo } from './db.repo';
import { Brand, BrandDocument } from '../models/brand.schema';

@Injectable()
export class BrandRepository extends DbRepo<BrandDocument> {
  constructor(
    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
  ) {
    super(brandModel);
  }

  async findByName(name: string): Promise<BrandDocument | null> {
    return this.findOne({ name });
  }

  async findBySlug(slug: string): Promise<BrandDocument | null> {
    return this.findOne({ slug, deletedAt: null });
  }

  async nameExists(name: string): Promise<boolean> {
    return this.exists({ name, deletedAt: null });
  }
}
