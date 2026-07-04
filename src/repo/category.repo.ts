import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DbRepo } from './db.repo';
import { Category, CategoryDocument } from '../models/category.schema';

@Injectable()
export class CategoryRepository extends DbRepo<CategoryDocument> {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {
    super(categoryModel);
  }

  async findByName(name: string): Promise<CategoryDocument | null> {
    return this.findOne({ name });
  }

  async findBySlug(slug: string): Promise<CategoryDocument | null> {
    return this.findOne({ slug, deletedAt: null });
  }

  async nameExists(name: string): Promise<boolean> {
    return this.exists({ name, deletedAt: null });
  }
}
