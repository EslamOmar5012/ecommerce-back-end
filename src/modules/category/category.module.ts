import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from '../../models/category.schema';
import { CategoryRepository } from '../../repo/category.repo';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryRepository, CategoryService],
  exports: [CategoryRepository, CategoryService],
})
export class CategoryModule {}
