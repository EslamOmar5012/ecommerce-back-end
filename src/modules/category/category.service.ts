import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CategoryRepository } from '../../repo/category.repo';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './category.validation';
import slugify from 'slugify';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createCategory(
    dto: CreateCategoryDto,
    createdBy: string,
    imageFile?: Express.Multer.File,
  ) {
    const nameExists = await this.categoryRepository.nameExists(dto.name);
    if (nameExists) {
      throw new ConflictException('Category name already exists');
    }

    let imageUrl = '';
    if (imageFile) {
      const result = await this.cloudinaryService.uploadFile(
        imageFile.buffer,
        'ecommerce/categories',
      );
      imageUrl = result.secureUrl;
    }

    const category = await this.categoryRepository.create({
      ...dto,
      image: imageUrl,
      createdBy,
    });

    return {
      message: 'Category created successfully',
      category,
    };
  }

  async getAllCategories(opts: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    includeInactive?: boolean;
  }) {
    const filter: Record<string, any> = { deletedAt: null };
    if (!opts.includeInactive) {
      filter.isActive = true;
    }

    const result = await this.categoryRepository.findPaginated(filter, {
      page: opts.page,
      limit: opts.limit,
      search: opts.search,
      searchFields: ['name', 'slug'],
      sort: { [opts.sortBy ?? 'createdAt']: opts.order === 'asc' ? 1 : -1 },
    });

    return {
      message: 'Categories retrieved successfully',
      ...result,
    };
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category retrieved successfully',
      category,
    };
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
    imageFile?: Express.Multer.File,
  ) {
    const category = await this.categoryRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name && dto.name !== category.name) {
      const nameExists = await this.categoryRepository.nameExists(dto.name);
      if (nameExists) {
        throw new ConflictException('Category name already exists');
      }
    }

    let imageUrl = category.image;
    if (imageFile) {
      const result = await this.cloudinaryService.uploadFile(
        imageFile.buffer,
        'ecommerce/categories',
      );
      imageUrl = result.secureUrl;
    }

    const updateData: Record<string, any> = { ...dto, image: imageUrl };
    if (dto.name) {
      updateData.slug = slugify(dto.name, { lower: true });
    }

    const updated = await this.categoryRepository.updateById(id, updateData);

    return {
      message: 'Category updated successfully',
      category: updated,
    };
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.updateById(id, { deletedAt: new Date() });

    return { message: 'Category deleted successfully' };
  }
}
