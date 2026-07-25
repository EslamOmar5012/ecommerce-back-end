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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { BrandService } from './brand.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/user.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/validation.pipe';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { memoryStorageOptions } from '../../common/multer/multer.config';
import { createBrandSchema, updateBrandSchema } from './brand.validation';
import type { CreateBrandDto, UpdateBrandDto } from './brand.validation';

@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  // ─── Admin-only routes ────────────────────────────────────────────────────

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
      ],
      memoryStorageOptions(),
    ),
  )
  @UsePipes(new ZodValidationPipe(createBrandSchema))
  createBrand(
    @CurrentUser() user: any,
    @Body() dto: CreateBrandDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; logo?: Express.Multer.File[] },
  ) {
    const fv = new FileValidationPipe({ required: false });
    return this.brandService.createBrand(
      dto,
      user._id.toString(),
      files?.image?.[0] ? fv.transform(files.image[0]) : undefined,
      files?.logo?.[0] ? fv.transform(files.logo[0]) : undefined,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
      ],
      memoryStorageOptions(),
    ),
  )
  @UsePipes(new ZodValidationPipe(updateBrandSchema))
  updateBrand(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; logo?: Express.Multer.File[] },
  ) {
    const fv = new FileValidationPipe({ required: false });
    return this.brandService.updateBrand(
      id,
      dto,
      files?.image?.[0] ? fv.transform(files.image[0]) : undefined,
      files?.logo?.[0] ? fv.transform(files.logo[0]) : undefined,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteBrand(@Param('id') id: string) {
    return this.brandService.deleteBrand(id);
  }

  // ─── Public routes ────────────────────────────────────────────────────────

  @Get()
  getAllBrands(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.brandService.getAllBrands({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      order,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':id')
  getBrandById(@Param('id') id: string) {
    return this.brandService.getBrandById(id);
  }
}
