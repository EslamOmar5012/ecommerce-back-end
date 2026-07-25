import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CartRepository } from '../../repo/cart.repo';
import { ProductRepository } from '../../repo/product.repo';
import type { AddToCartDto, UpdateQuantityDto } from './cart.validation';
import { Types } from 'mongoose';

// Interface for a cart product item when populated
interface PopulatedCartProduct {
  productId: {
    _id: Types.ObjectId;
    name: string;
    price: number;
    priceAfterDiscount?: number;
    stock: number;
    isActive: boolean;
    deletedAt?: Date | null;
  };
  quantity: number;
}

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartRepository.findOne({ userId }, undefined, {
      populate: 'products.productId',
    });

    if (!cart) {
      cart = await this.cartRepository.create({ userId, products: [] });
    }

    // Filter out products that were deleted or deactivated in the background
    let hasChanges = false;
    const activeProducts: Array<{
      productId: Types.ObjectId;
      quantity: number;
    }> = [];

    const populatedProducts =
      cart.products as unknown as PopulatedCartProduct[];

    for (const item of populatedProducts) {
      const prod = item.productId;
      if (prod && !prod.deletedAt && prod.isActive) {
        // Ensure quantity doesn't exceed current stock
        if (item.quantity > prod.stock) {
          item.quantity = prod.stock;
          hasChanges = true;
        }
        if (item.quantity > 0) {
          activeProducts.push({
            productId: prod._id,
            quantity: item.quantity,
          });
        } else {
          hasChanges = true;
        }
      } else {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await this.cartRepository.updateOne(
        { _id: cart._id },
        { products: activeProducts },
      );
      // Re-populate
      cart = await this.cartRepository.findOne({ userId }, undefined, {
        populate: 'products.productId',
      });
    }

    // Calculate totals
    let totalPrice = 0;
    let totalPriceAfterDiscount = 0;

    if (cart?.products) {
      const items = cart.products as unknown as PopulatedCartProduct[];
      for (const item of items) {
        const prod = item.productId;
        if (prod) {
          const price = prod.price;
          const priceAfterDiscount = prod.priceAfterDiscount ?? price;
          totalPrice += price * item.quantity;
          totalPriceAfterDiscount += priceAfterDiscount * item.quantity;
        }
      }
    }

    return {
      message: 'Cart retrieved successfully',
      cart,
      summary: {
        totalPrice,
        totalPriceAfterDiscount,
      },
    };
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    const product = await this.productRepository.findOne({
      _id: dto.productId,
      deletedAt: null,
      isActive: true,
    });

    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    const quantityToAdd = dto.quantity ?? 1;
    if (product.stock < quantityToAdd) {
      throw new BadRequestException(
        `Insufficient stock. Only ${product.stock} items available.`,
      );
    }

    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create({ userId, products: [] });
    }

    const existingProductIndex = cart.products.findIndex(
      (item) => item.productId.toString() === dto.productId,
    );

    if (existingProductIndex > -1) {
      const newQuantity =
        cart.products[existingProductIndex].quantity + quantityToAdd;
      if (newQuantity > product.stock) {
        throw new BadRequestException(
          `Cannot add more items. Total quantity would exceed available stock (${product.stock}).`,
        );
      }
      cart.products[existingProductIndex].quantity = newQuantity;
    } else {
      cart.products.push({
        productId: product._id,
        quantity: quantityToAdd,
      });
    }

    await this.cartRepository.updateOne(
      { _id: cart._id },
      { products: cart.products },
    );

    return this.getCart(userId);
  }

  async updateQuantity(
    userId: string,
    productId: string,
    dto: UpdateQuantityDto,
  ) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const productIndex = cart.products.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (productIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    const product = await this.productRepository.findOne({
      _id: productId,
      deletedAt: null,
      isActive: true,
    });

    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Only ${product.stock} items available.`,
      );
    }

    cart.products[productIndex].quantity = dto.quantity;
    await this.cartRepository.updateOne(
      { _id: cart._id },
      { products: cart.products },
    );

    return this.getCart(userId);
  }

  async removeFromCart(userId: string, productId: string) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const initialLength = cart.products.length;
    cart.products = cart.products.filter(
      (item) => item.productId.toString() !== productId,
    );

    if (cart.products.length === initialLength) {
      throw new NotFoundException('Product not found in cart');
    }

    await this.cartRepository.updateOne(
      { _id: cart._id },
      { products: cart.products },
    );

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.cartRepository.updateOne({ _id: cart._id }, { products: [] });

    return {
      message: 'Cart cleared successfully',
    };
  }
}
