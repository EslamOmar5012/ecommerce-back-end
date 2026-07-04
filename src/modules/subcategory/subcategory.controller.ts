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
import { SubcategoryService } from './subcategory.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/user.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/validation.pipe';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { memoryStorageOptions } from '../../common/multer/multer.config';
import {
  createSubcategorySchema,
  updateSubcategorySchema,
} from './subcategory.validation';
import type {
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
} from './subcategory.validation';

@Controller('subcategories')
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) {}

  // ─── Admin-only routes ────────────────────────────────────────────────────

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', memoryStorageOptions()))
  @UsePipes(new ZodValidationPipe(createSubcategorySchema))
  createSubcategory(
    @CurrentUser() user: any,
    @Body() dto: CreateSubcategoryDto,
    @UploadedFile(new FileValidationPipe({ required: false }))
    imageFile: Express.Multer.File,
  ) {
    return this.subcategoryService.createSubcategory(
      dto,
      user._id.toString(),
      imageFile,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', memoryStorageOptions()))
  @UsePipes(new ZodValidationPipe(updateSubcategorySchema))
  updateSubcategory(
    @Param('id') id: string,
    @Body() dto: UpdateSubcategoryDto,
    @UploadedFile(new FileValidationPipe({ required: false }))
    imageFile: Express.Multer.File,
  ) {
    return this.subcategoryService.updateSubcategory(id, dto, imageFile);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteSubcategory(@Param('id') id: string) {
    return this.subcategoryService.deleteSubcategory(id);
  }

  // ─── Public routes ────────────────────────────────────────────────────────

  @Get()
  getAllSubcategories(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.subcategoryService.getAllSubcategories({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      order,
      categoryId,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':id')
  getSubcategoryById(@Param('id') id: string) {
    return this.subcategoryService.getSubcategoryById(id);
  }
}
