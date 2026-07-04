import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BrandRepository } from '../../repo/brand.repo';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import type { CreateBrandDto, UpdateBrandDto } from './brand.validation';
import slugify from 'slugify';

@Injectable()
export class BrandService {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createBrand(
    dto: CreateBrandDto,
    createdBy: string,
    imageFile?: Express.Multer.File,
    logoFile?: Express.Multer.File,
  ) {
    const nameExists = await this.brandRepository.nameExists(dto.name);
    if (nameExists) {
      throw new ConflictException('Brand name already exists');
    }

    let imageUrl = '';
    if (imageFile) {
      const result = await this.cloudinaryService.uploadFile(
        imageFile.buffer,
        'ecommerce/brands/images',
      );
      imageUrl = result.secureUrl;
    }

    let logoUrl = '';
    if (logoFile) {
      const result = await this.cloudinaryService.uploadFile(
        logoFile.buffer,
        'ecommerce/brands/logos',
      );
      logoUrl = result.secureUrl;
    }

    const brand = await this.brandRepository.create({
      ...dto,
      image: imageUrl,
      logo: logoUrl,
      createdBy,
    });

    return {
      message: 'Brand created successfully',
      brand,
    };
  }

  async getAllBrands(opts: {
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

    const result = await this.brandRepository.findPaginated(filter, {
      page: opts.page,
      limit: opts.limit,
      search: opts.search,
      searchFields: ['name', 'slug'],
      sort: { [opts.sortBy ?? 'createdAt']: opts.order === 'asc' ? 1 : -1 },
    });

    return {
      message: 'Brands retrieved successfully',
      ...result,
    };
  }

  async getBrandById(id: string) {
    const brand = await this.brandRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      message: 'Brand retrieved successfully',
      brand,
    };
  }

  async updateBrand(
    id: string,
    dto: UpdateBrandDto,
    imageFile?: Express.Multer.File,
    logoFile?: Express.Multer.File,
  ) {
    const brand = await this.brandRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (dto.name && dto.name !== brand.name) {
      const nameExists = await this.brandRepository.nameExists(dto.name);
      if (nameExists) {
        throw new ConflictException('Brand name already exists');
      }
    }

    let imageUrl = brand.image;
    if (imageFile) {
      const result = await this.cloudinaryService.uploadFile(
        imageFile.buffer,
        'ecommerce/brands/images',
      );
      imageUrl = result.secureUrl;
    }

    let logoUrl = brand.logo;
    if (logoFile) {
      const result = await this.cloudinaryService.uploadFile(
        logoFile.buffer,
        'ecommerce/brands/logos',
      );
      logoUrl = result.secureUrl;
    }

    const updateData: Record<string, any> = {
      ...dto,
      image: imageUrl,
      logo: logoUrl,
    };
    if (dto.name) {
      updateData.slug = slugify(dto.name, { lower: true });
    }

    const updated = await this.brandRepository.updateById(id, updateData);

    return {
      message: 'Brand updated successfully',
      brand: updated,
    };
  }

  async deleteBrand(id: string) {
    const brand = await this.brandRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    await this.brandRepository.updateById(id, { deletedAt: new Date() });

    return { message: 'Brand deleted successfully' };
  }
}
