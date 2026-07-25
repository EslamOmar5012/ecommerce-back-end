import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CouponRepository } from '../../repo/coupon.repo';
import type { CreateCouponDto, UpdateCouponDto } from './coupon.validation';

@Injectable()
export class CouponService {
  constructor(private readonly couponRepository: CouponRepository) {}

  async createCoupon(dto: CreateCouponDto, createdBy: string) {
    const code = dto.code.toUpperCase();
    const exists = await this.couponRepository.codeExists(code);
    if (exists) {
      throw new ConflictException('Coupon code already exists');
    }

    const expireAt = new Date(dto.expireAt);
    if (expireAt <= new Date()) {
      throw new BadRequestException('Expiration date must be in the future');
    }

    const coupon = await this.couponRepository.create({
      ...dto,
      code,
      expireAt,
      createdBy,
    });

    return {
      message: 'Coupon created successfully',
      coupon,
    };
  }

  async getAllCoupons(opts: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    includeInactive?: boolean;
  }) {
    const filter: Record<string, unknown> = { deletedAt: null };
    if (!opts.includeInactive) {
      filter.isActive = true;
    }

    const result = await this.couponRepository.findPaginated(filter, {
      page: opts.page,
      limit: opts.limit,
      search: opts.search,
      searchFields: ['code'],
      sort: { [opts.sortBy ?? 'createdAt']: opts.order === 'asc' ? 1 : -1 },
    });

    return {
      message: 'Coupons retrieved successfully',
      ...result,
    };
  }

  async getCouponByCode(code: string) {
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Check expiration
    if (coupon.expireAt <= new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is inactive');
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      throw new BadRequestException('Coupon has reached its usage limit');
    }

    return {
      message: 'Coupon is valid',
      coupon,
    };
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await this.couponRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const updateData: Record<string, unknown> = { ...dto };

    if (dto.code) {
      const code = dto.code.toUpperCase();
      if (code !== coupon.code) {
        const exists = await this.couponRepository.codeExists(code);
        if (exists) {
          throw new ConflictException('Coupon code already exists');
        }
        updateData['code'] = code;
      }
    }

    if (dto.expireAt) {
      const expireAt = new Date(dto.expireAt);
      if (expireAt <= new Date()) {
        throw new BadRequestException('Expiration date must be in the future');
      }
      updateData['expireAt'] = expireAt;
    }

    const updated = await this.couponRepository.updateById(id, updateData);

    return {
      message: 'Coupon updated successfully',
      coupon: updated,
    };
  }

  async deleteCoupon(id: string) {
    const coupon = await this.couponRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.couponRepository.updateById(id, {
      deletedAt: new Date(),
      isActive: false,
    });

    return {
      message: 'Coupon deleted successfully',
    };
  }
}
