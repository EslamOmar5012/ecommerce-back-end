import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DbRepo } from './db.repo';
import { Subcategory, SubcategoryDocument } from '../models/subcategory.schema';

@Injectable()
export class SubcategoryRepository extends DbRepo<SubcategoryDocument> {
  constructor(
    @InjectModel(Subcategory.name)
    private readonly subcategoryModel: Model<SubcategoryDocument>,
  ) {
    super(subcategoryModel);
  }

  async findByName(name: string): Promise<SubcategoryDocument | null> {
    return this.findOne({ name });
  }

  async findBySlug(slug: string): Promise<SubcategoryDocument | null> {
    return this.findOne({ slug, deletedAt: null });
  }

  async nameExists(name: string): Promise<boolean> {
    return this.exists({ name, deletedAt: null });
  }
}
