import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subcategory,
  SubcategorySchema,
} from '../../models/subcategory.schema';
import { SubcategoryRepository } from '../../repo/subcategory.repo';
import { SubcategoryService } from './subcategory.service';
import { SubcategoryController } from './subcategory.controller';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subcategory.name, schema: SubcategorySchema },
    ]),
    CategoryModule,
  ],
  controllers: [SubcategoryController],
  providers: [SubcategoryRepository, SubcategoryService],
  exports: [SubcategoryRepository, SubcategoryService],
})
export class SubcategoryModule {}
