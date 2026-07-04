import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../../models/product.schema';
import { ProductRepository } from '../../repo/product.repo';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { CategoryModule } from '../category/category.module';
import { SubcategoryModule } from '../subcategory/subcategory.module';
import { BrandModule } from '../brand/brand.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    CategoryModule,
    SubcategoryModule,
    BrandModule,
  ],
  controllers: [ProductController],
  providers: [ProductRepository, ProductService],
  exports: [ProductRepository, ProductService],
})
export class ProductModule {}
