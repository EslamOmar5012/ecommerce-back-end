import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProductRepository } from '../../repo/product.repo';
import { CategoryRepository } from '../../repo/category.repo';
import { SubcategoryRepository } from '../../repo/subcategory.repo';
import { BrandRepository } from '../../repo/brand.repo';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import type { CreateProductDto, UpdateProductDto } from './product.validation';
import slugify from 'slugify';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly subcategoryRepository: SubcategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async uploadGallery(files: Express.Multer.File[]): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const result = await this.cloudinaryService.uploadFile(
        file.buffer,
        'ecommerce/products',
      );
      urls.push(result.secureUrl);
    }
    return urls;
  }

  async createProduct(
    dto: CreateProductDto,
    createdBy: string,
    galleryFiles?: Express.Multer.File[],
  ) {
    // 1. Verify parent category
    const categoryExists = await this.categoryRepository.exists({
      _id: dto.category,
      deletedAt: null,
    });
    if (!categoryExists) throw new NotFoundException('Category not found');

    // 2. Verify subcategory belongs to category
    const subcategory = await this.subcategoryRepository.findOne({
      _id: dto.subCategory,
      deletedAt: null,
    });
    if (!subcategory) throw new NotFoundException('Subcategory not found');
    if (subcategory.categoryId.toString() !== dto.category) {
      throw new BadRequestException(
        'Subcategory does not belong to the specified category',
      );
    }

    // 3. Verify brand
    const brandExists = await this.brandRepository.exists({
      _id: dto.brand,
      deletedAt: null,
    });
    if (!brandExists) throw new NotFoundException('Brand not found');

    // 4. Check name
    const nameExists = await this.productRepository.nameExists(dto.name);
    if (nameExists) throw new ConflictException('Product name already exists');

    // 5. Upload gallery
    const gallery =
      galleryFiles && galleryFiles.length > 0
        ? await this.uploadGallery(galleryFiles)
        : [];

    const product = await this.productRepository.create({
      ...dto,
      gallery,
      createdBy,
    });

    return {
      message: 'Product created successfully',
      product,
    };
  }

  async getAllProducts(opts: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    categoryId?: string;
    subCategoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    includeInactive?: boolean;
  }) {
    const filter: Record<string, any> = { deletedAt: null };
    if (!opts.includeInactive) filter.isActive = true;
    if (opts.categoryId) filter.category = opts.categoryId;
    if (opts.subCategoryId) filter.subCategory = opts.subCategoryId;
    if (opts.brandId) filter.brand = opts.brandId;
    if (opts.inStock) filter.stock = { $gt: 0 };
    if (opts.minPrice !== undefined || opts.maxPrice !== undefined) {
      filter.price = {};
      if (opts.minPrice !== undefined) filter.price.$gte = opts.minPrice;
      if (opts.maxPrice !== undefined) filter.price.$lte = opts.maxPrice;
    }

    const result = await this.productRepository.findPaginated(filter, {
      page: opts.page,
      limit: opts.limit,
      search: opts.search,
      searchFields: ['name', 'description', 'slug'],
      sort: { [opts.sortBy ?? 'createdAt']: opts.order === 'asc' ? 1 : -1 },
      populate: ['category', 'subCategory', 'brand'],
    });

    return {
      message: 'Products retrieved successfully',
      ...result,
    };
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findOne(
      { _id: id, deletedAt: null },
      undefined,
      { populate: ['category', 'subCategory', 'brand'] } as any,
    );
    if (!product) throw new NotFoundException('Product not found');

    return {
      message: 'Product retrieved successfully',
      product,
    };
  }

  async updateProduct(
    id: string,
    dto: UpdateProductDto,
    galleryFiles?: Express.Multer.File[],
  ) {
    const product = await this.productRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!product) throw new NotFoundException('Product not found');

    const targetCategory = dto.category ?? product.category.toString();
    const targetSubCategory = dto.subCategory ?? product.subCategory.toString();

    if (dto.category) {
      const exists = await this.categoryRepository.exists({ _id: dto.category, deletedAt: null });
      if (!exists) throw new NotFoundException('Category not found');
    }

    if (dto.subCategory) {
      const subcategory = await this.subcategoryRepository.findOne({ _id: dto.subCategory, deletedAt: null });
      if (!subcategory) throw new NotFoundException('Subcategory not found');
      if (subcategory.categoryId.toString() !== targetCategory) {
        throw new BadRequestException('Subcategory does not belong to the specified category');
      }
    } else if (dto.category && targetSubCategory) {
      const subcategory = await this.subcategoryRepository.findOne({ _id: targetSubCategory, deletedAt: null });
      if (subcategory && subcategory.categoryId.toString() !== dto.category) {
        throw new BadRequestException('Existing subcategory does not belong to the new category');
      }
    }

    if (dto.brand) {
      const exists = await this.brandRepository.exists({ _id: dto.brand, deletedAt: null });
      if (!exists) throw new NotFoundException('Brand not found');
    }

    if (dto.name && dto.name !== product.name) {
      const nameExists = await this.productRepository.nameExists(dto.name);
      if (nameExists) throw new ConflictException('Product name already exists');
    }

    // Append new gallery images
    let gallery = [...product.gallery];
    if (galleryFiles && galleryFiles.length > 0) {
      const uploaded = await this.uploadGallery(galleryFiles);
      gallery = [...gallery, ...uploaded];
    }

    const updateData: Record<string, any> = { ...dto, gallery };

    // Recalculate priceAfterDiscount if price or discount changes
    const price = dto.price ?? product.price;
    const discount = dto.discount ?? product.discount;
    const discountVal = discount?.discount ?? 0;
    const discountType = discount?.type;

    if (discountVal > 0) {
      updateData.priceAfterDiscount =
        discountType === 'percentage'
          ? Math.max(0, price - (price * discountVal) / 100)
          : Math.max(0, price - discountVal);
    } else {
      updateData.priceAfterDiscount = price;
    }

    if (dto.name) {
      updateData.slug = slugify(dto.name, { lower: true });
    }

    const updated = await this.productRepository.updateById(id, updateData, {
      new: true,
      populate: ['category', 'subCategory', 'brand'],
    } as any);

    return {
      message: 'Product updated successfully',
      product: updated,
    };
  }

  async deleteProduct(id: string) {
    const product = await this.productRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.productRepository.updateById(id, { deletedAt: new Date() });

    return { message: 'Product deleted successfully' };
  }

  async removeGalleryImage(productId: string, imageUrl: string) {
    const product = await this.productRepository.findOne({
      _id: productId,
      deletedAt: null,
    });
    if (!product) throw new NotFoundException('Product not found');

    if (!product.gallery.includes(imageUrl)) {
      throw new BadRequestException('Image URL not found in product gallery');
    }

    const updated = await this.productRepository.updateById(productId, {
      $pull: { gallery: imageUrl },
    });

    return {
      message: 'Gallery image removed successfully',
      product: updated,
    };
  }
}
