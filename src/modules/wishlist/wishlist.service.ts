import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRepository } from '../../repo/user.repo';
import { ProductRepository } from '../../repo/product.repo';

@Injectable()
export class WishlistService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async getWishlist(userId: string) {
    const user = await this.userRepository.findOne(
      { _id: userId, deletedAt: null },
      undefined,
      { populate: 'wishlist' },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Filter out deleted/inactive products from the wishlist view
    const wishlist = user.wishlist as unknown as Array<{
      deletedAt?: Date | null;
      isActive?: boolean;
    }>;
    const validWishlist = wishlist.filter(
      (item) => item && !item.deletedAt && item.isActive,
    );

    return {
      message: 'Wishlist retrieved successfully',
      wishlist: validWishlist,
    };
  }

  async addToWishlist(userId: string, productId: string) {
    const productExists = await this.productRepository.exists({
      _id: productId,
      deletedAt: null,
      isActive: true,
    });

    if (!productExists) {
      throw new NotFoundException('Product not found or inactive');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAlreadyInWishlist = user.wishlist.some(
      (id) => id.toString() === productId,
    );

    if (isAlreadyInWishlist) {
      throw new BadRequestException('Product is already in wishlist');
    }

    await this.userRepository.updateOne(
      { _id: userId },
      { $addToSet: { wishlist: productId } },
    );

    return this.getWishlist(userId);
  }

  async removeFromWishlist(userId: string, productId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isExist = user.wishlist.some((id) => id.toString() === productId);
    if (!isExist) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.userRepository.updateOne(
      { _id: userId },
      { $pull: { wishlist: productId } },
    );

    return this.getWishlist(userId);
  }

  async clearWishlist(userId: string) {
    await this.userRepository.updateOne(
      { _id: userId },
      { $set: { wishlist: [] } },
    );
    return { message: 'Wishlist cleared successfully' };
  }
}
