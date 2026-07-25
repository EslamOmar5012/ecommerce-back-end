import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SubcategoryRepository } from '../../repo/subcategory.repo';
import { CategoryRepository } from '../../repo/category.repo';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import type {
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
} from './subcategory.validation';
import slugify from 'slugify';

@Injectable()
export class SubcategoryService {
  constructor(
    private readonly subcategoryRepository: SubcategoryRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createSubcategory(
    dto: CreateSubcategoryDto,
    createdBy: string,
    imageFile?: Express.Multer.File,
  ) {
    const categoryExists = await this.categoryRepository.exists({
      _id: dto.categoryId,
      deletedAt: null,
    });
    if (!categoryExists) {
      throw new NotFoundException('Parent category not found');
    }

    const nameExists = await this.subcategoryRepository.nameExists(dto.name);
    if (nameExists) {
      throw new ConflictException('Subcategory name already exists');
    }

    let imageUrl = '';
    if (imageFile) {
      const result = await this.cloudinaryService.uploadFile(
        imageFile.buffer,
        'ecommerce/subcategories',
      );
      imageUrl = result.secureUrl;
    }

    const subcategory = await this.subcategoryRepository.create({
      ...dto,
      image: imageUrl,
      createdBy,
    });

    return {
      message: 'Subcategory created successfully',
      subcategory,
    };
  }

  async getAllSubcategories(opts: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    categoryId?: string;
    includeInactive?: boolean;
  }) {
    const filter: Record<string, any> = { deletedAt: null };
    if (!opts.includeInactive) {
      filter.isActive = true;
    }
    if (opts.categoryId) {
      filter.categoryId = opts.categoryId;
    }

    const result = await this.subcategoryRepository.findPaginated(filter, {
      page: opts.page,
      limit: opts.limit,
      search: opts.search,
      searchFields: ['name', 'slug'],
      sort: { [opts.sortBy ?? 'createdAt']: opts.order === 'asc' ? 1 : -1 },
      populate: 'categoryId',
    });

    return {
      message: 'Subcategories retrieved successfully',
      ...result,
    };
  }

  async getSubcategoryById(id: string) {
    const subcategory = await this.subcategoryRepository.findOne(
      { _id: id, deletedAt: null },
      undefined,
      { populate: 'categoryId' },
    );
    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    return {
      message: 'Subcategory retrieved successfully',
      subcategory,
    };
  }

  async updateSubcategory(
    id: string,
    dto: UpdateSubcategoryDto,
    imageFile?: Express.Multer.File,
  ) {
    const subcategory = await this.subcategoryRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    if (
      dto.categoryId &&
      dto.categoryId !== subcategory.categoryId.toString()
    ) {
      const categoryExists = await this.categoryRepository.exists({
        _id: dto.categoryId,
        deletedAt: null,
      });
      if (!categoryExists) {
        throw new NotFoundException('New parent category not found');
      }
    }

    if (dto.name && dto.name !== subcategory.name) {
      const nameExists = await this.subcategoryRepository.nameExists(dto.name);
      if (nameExists) {
        throw new ConflictException('Subcategory name already exists');
      }
    }

    let imageUrl = subcategory.image;
    if (imageFile) {
      const result = await this.cloudinaryService.uploadFile(
        imageFile.buffer,
        'ecommerce/subcategories',
      );
      imageUrl = result.secureUrl;
    }

    const updateData: Record<string, any> = { ...dto, image: imageUrl };
    if (dto.name) {
      updateData.slug = slugify(dto.name, { lower: true });
    }

    const updated = await this.subcategoryRepository.updateById(
      id,
      updateData,
      { new: true, populate: 'categoryId' },
    );

    return {
      message: 'Subcategory updated successfully',
      subcategory: updated,
    };
  }

  async deleteSubcategory(id: string) {
    const subcategory = await this.subcategoryRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    await this.subcategoryRepository.updateById(id, { deletedAt: new Date() });

    return { message: 'Subcategory deleted successfully' };
  }
}
