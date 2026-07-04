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
  UploadedFile,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoryService } from './category.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/user.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/validation.pipe';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { memoryStorageOptions } from '../../common/multer/multer.config';
import {
  createCategorySchema,
  updateCategorySchema,
} from './category.validation';
import type { CreateCategoryDto, UpdateCategoryDto } from './category.validation';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // ─── Admin-only routes ────────────────────────────────────────────────────

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', memoryStorageOptions()))
  @UsePipes(new ZodValidationPipe(createCategorySchema))
  createCategory(
    @CurrentUser() user: any,
    @Body() dto: CreateCategoryDto,
    @UploadedFile(new FileValidationPipe({ required: false }))
    imageFile: Express.Multer.File,
  ) {
    return this.categoryService.createCategory(dto, user._id.toString(), imageFile);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', memoryStorageOptions()))
  @UsePipes(new ZodValidationPipe(updateCategorySchema))
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile(new FileValidationPipe({ required: false }))
    imageFile: Express.Multer.File,
  ) {
    return this.categoryService.updateCategory(id, dto, imageFile);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }

  // ─── Public routes ────────────────────────────────────────────────────────

  @Get()
  getAllCategories(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.categoryService.getAllCategories({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      order,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':id')
  getCategoryById(@Param('id') id: string) {
    return this.categoryService.getCategoryById(id);
  }
}
