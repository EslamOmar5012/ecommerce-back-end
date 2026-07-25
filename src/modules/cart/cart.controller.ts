import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/validation.pipe';
import { addToCartSchema, updateQuantitySchema } from './cart.validation';
import type { AddToCartDto, UpdateQuantityDto } from './cart.validation';
import { UserDocument } from '../../models/user.schema';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: any) {
    const u = user as UserDocument;
    return this.cartService.getCart(u._id.toString());
  }

  @Post()
  @UsePipes(new ZodValidationPipe(addToCartSchema))
  addToCart(@CurrentUser() user: any, @Body() dto: AddToCartDto) {
    const u = user as UserDocument;
    return this.cartService.addToCart(u._id.toString(), dto);
  }

  @Patch(':productId')
  @UsePipes(new ZodValidationPipe(updateQuantitySchema))
  updateQuantity(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body() dto: UpdateQuantityDto,
  ) {
    const u = user as UserDocument;
    return this.cartService.updateQuantity(u._id.toString(), productId, dto);
  }

  @Delete(':productId')
  removeFromCart(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    const u = user as UserDocument;
    return this.cartService.removeFromCart(u._id.toString(), productId);
  }

  @Delete()
  clearCart(@CurrentUser() user: any) {
    const u = user as UserDocument;
    return this.cartService.clearCart(u._id.toString());
  }
}
