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
  UsePipes,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/user.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/validation.pipe';
import { createCouponSchema, updateCouponSchema } from './coupon.validation';
import type { CreateCouponDto, UpdateCouponDto } from './coupon.validation';
import { UserDocument } from '../../models/user.schema';

@Controller('coupons')
@UseGuards(AuthGuard)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(createCouponSchema))
  createCoupon(@CurrentUser() user: any, @Body() dto: CreateCouponDto) {
    const u = user as UserDocument;
    return this.couponService.createCoupon(dto, u._id.toString());
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getAllCoupons(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.couponService.getAllCoupons({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      order,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':code')
  getCouponByCode(@Param('code') code: string) {
    return this.couponService.getCouponByCode(code);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(updateCouponSchema))
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.updateCoupon(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  deleteCoupon(@Param('id') id: string) {
    return this.couponService.deleteCoupon(id);
  }
}
