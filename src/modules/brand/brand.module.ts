import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Brand, BrandSchema } from '../../models/brand.schema';
import { BrandRepository } from '../../repo/brand.repo';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
  ],
  controllers: [BrandController],
  providers: [BrandRepository, BrandService],
  exports: [BrandRepository, BrandService],
})
export class BrandModule {}
