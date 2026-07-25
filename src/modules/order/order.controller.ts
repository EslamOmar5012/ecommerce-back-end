import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UsePipes,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/user.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/validation.pipe';
import {
  createOrderSchema,
  updateStatusSchema,
  refundOrderSchema,
} from './order.validation';
import type {
  CreateOrderDto,
  UpdateStatusDto,
  RefundOrderDto,
} from './order.validation';
import { UserDocument } from '../../models/user.schema';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('cash')
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(createOrderSchema))
  createCashOrder(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    const u = user as UserDocument;
    return this.orderService.createCashOrder(u._id.toString(), u, dto);
  }

  @Post('paymob')
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(createOrderSchema))
  createPaymobOrder(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    const u = user as UserDocument;
    return this.orderService.createPaymobOrder(u._id.toString(), u, dto);
  }

  // Paymob calls this callback publicly. We verify authenticity inside via HMAC.
  @Post('paymob-webhook')
  handlePaymobWebhook(
    @Body() body: Record<string, unknown>,
    @Query('hmac') hmacSignature?: string,
  ) {
    return this.orderService.handlePaymobWebhook(body, hmacSignature);
  }

  @Get('my-orders')
  @UseGuards(AuthGuard)
  getMyOrders(@CurrentUser() user: any) {
    const u = user as UserDocument;
    return this.orderService.getMyOrders(u._id.toString());
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  getOrderById(@CurrentUser() user: any, @Param('id') id: string) {
    const u = user as UserDocument;
    return this.orderService.getOrderById(u._id.toString(), u.role, id);
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard)
  cancelOrder(@CurrentUser() user: any, @Param('id') id: string) {
    const u = user as UserDocument;
    return this.orderService.cancelOrder(u._id.toString(), u.role, id);
  }

  @Post(':id/refund')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(refundOrderSchema))
  refundOrder(@Param('id') id: string, @Body() dto: RefundOrderDto) {
    return this.orderService.refundOrder(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(updateStatusSchema))
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.orderService.updateOrderStatus(id, dto.status);
  }
}
