import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UsePipes,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/user.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/validation.pipe';
import { memoryStorageOptions } from '../../common/multer/multer.config';
import { createProductSchema, updateProductSchema } from './product.validation';
import type { CreateProductDto, UpdateProductDto } from './product.validation';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ─── Admin-only routes ────────────────────────────────────────────────────

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FilesInterceptor('gallery', 10, memoryStorageOptions()))
  @UsePipes(new ZodValidationPipe(createProductSchema))
  createProduct(
    @CurrentUser() user: any,
    @Body() dto: CreateProductDto,
    @UploadedFiles() gallery: Express.Multer.File[],
  ) {
    return this.productService.createProduct(dto, user._id.toString(), gallery);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FilesInterceptor('gallery', 10, memoryStorageOptions()))
  @UsePipes(new ZodValidationPipe(updateProductSchema))
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() gallery: Express.Multer.File[],
  ) {
    return this.productService.updateProduct(id, dto, gallery);
  }

  @Delete(':id/gallery')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  removeGalleryImage(@Param('id') id: string, @Query('url') imageUrl: string) {
    return this.productService.removeGalleryImage(id, imageUrl);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteProduct(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }

  // ─── Public routes ────────────────────────────────────────────────────────

  @Get()
  getAllProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('categoryId') categoryId?: string,
    @Query('subCategoryId') subCategoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStock') inStock?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.productService.getAllProducts({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      order,
      categoryId,
      subCategoryId,
      brandId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock === 'true',
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':id')
  getProductById(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }
}
