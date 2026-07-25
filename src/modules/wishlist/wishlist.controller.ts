import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../../models/user.schema';

@Controller('wishlist')
@UseGuards(AuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@CurrentUser() user: any) {
    const u = user as UserDocument;
    return this.wishlistService.getWishlist(u._id.toString());
  }

  @Post()
  addToWishlistViaBody(
    @CurrentUser() user: any,
    @Body('productId') productIdFromBody?: string,
  ) {
    if (!productIdFromBody) {
      throw new BadRequestException('productId is required in request body');
    }
    const u = user as UserDocument;
    return this.wishlistService.addToWishlist(
      u._id.toString(),
      productIdFromBody,
    );
  }

  @Post(':productId')
  addToWishlist(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    const u = user as UserDocument;
    return this.wishlistService.addToWishlist(u._id.toString(), productId);
  }

  @Delete(':productId')
  removeFromWishlist(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    const u = user as UserDocument;
    return this.wishlistService.removeFromWishlist(
      u._id.toString(),
      productId,
    );
  }

  @Delete()
  clearWishlist(@CurrentUser() user: any) {
    const u = user as UserDocument;
    return this.wishlistService.clearWishlist(u._id.toString());
  }
}
