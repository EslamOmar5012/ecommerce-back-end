import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderRepository } from '../../repo/order.repo';
import { CartRepository } from '../../repo/cart.repo';
import { ProductRepository } from '../../repo/product.repo';
import { CouponRepository } from '../../repo/coupon.repo';
import {
  OrderStatus,
  PaymentStatus,
  PaymentType,
  RefundStatus,
} from '../../models/order.schema';
import { CouponType, CouponDocument } from '../../models/coupon.schema';
import { UserDocument } from '../../models/user.schema';
import { CreateOrderDto, RefundOrderDto } from './order.validation';
import { Types } from 'mongoose';
import { Role } from '../../common/enums/user.enum';
import * as crypto from 'crypto';

// ─── Paymob API Response Interfaces ──────────────────────────────────────────
interface PaymobAuthResponse {
  token: string;
}

interface PaymobOrderResponse {
  id: number | string;
}

interface PaymobPaymentKeyResponse {
  token: string;
}

interface PaymobTransactionObj {
  amount_cents: number;
  created_at: string;
  currency: string;
  error_occured: boolean;
  has_parent_transaction: boolean;
  id: number;
  integration_id: number;
  is_3d_secure: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_voided: boolean;
  is_refunded: boolean;
  owner: string;
  pending: boolean;
  success: boolean;
  source_data?: {
    pan?: string;
    sub_type?: string;
    type?: string;
  };
  order?: {
    id?: number | string;
    merchant_order_id?: string;
  };
}

interface OrderProductItem {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
  name: string;
}

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly couponRepository: CouponRepository,
    private readonly configService: ConfigService,
  ) {}

  async createCashOrder(
    userId: string,
    _user: UserDocument,
    dto: CreateOrderDto,
  ) {
    const { products, coupon, discount, totalPrice, finalPrice } =
      await this.validateAndCalculateOrderDetails(userId, dto.couponCode);

    // 1. Deduct product stocks
    for (const item of products) {
      await this.productRepository.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } },
      );
    }

    // 2. Increment coupon used count if coupon was applied
    if (coupon) {
      await this.couponRepository.updateOne(
        { _id: coupon._id },
        { $inc: { usedCount: 1 } },
      );
    }

    // 3. Create the order
    const order = await this.orderRepository.create({
      userId,
      products,
      totalPrice,
      discount,
      finalPrice,
      couponId: coupon ? coupon._id : null,
      shippingAddress: dto.shippingAddress,
      phone: dto.phone,
      paymentType: PaymentType.CASH,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.PENDING,
    });

    // 4. Clear the cart
    await this.cartRepository.updateOne({ userId }, { products: [] });

    return {
      message: 'Order placed successfully using cash',
      order,
    };
  }

  async createPaymobOrder(
    userId: string,
    user: UserDocument,
    dto: CreateOrderDto,
  ) {
    const { products, coupon, discount, totalPrice, finalPrice } =
      await this.validateAndCalculateOrderDetails(userId, dto.couponCode);

    // Create a pending order first
    const order = await this.orderRepository.create({
      userId,
      products,
      totalPrice,
      discount,
      finalPrice,
      couponId: coupon ? coupon._id : null,
      shippingAddress: dto.shippingAddress,
      phone: dto.phone,
      paymentType: PaymentType.CARD,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.PENDING,
    });

    const apiKey = this.configService.get<string>('PAYMOB_API_KEY');
    const integrationId = this.configService.get<string>(
      'PAYMOB_INTEGRATION_ID',
    );
    const iframeId = this.configService.get<string>('PAYMOB_IFRAME_ID');

    if (!apiKey || !integrationId || !iframeId) {
      // Mock Paymob response when credentials are not supplied
      const mockIframeUrl = `https://accept.paymob.com/api/acceptance/iframes/mock_iframe?payment_token=mock_payment_token_for_order_${order._id.toString()}`;
      await this.orderRepository.updateOne(
        { _id: order._id },
        { paymobOrderId: `mock_paymob_order_${order._id.toString()}` },
      );
      return {
        message: 'Order created (Paymob Mock Integration)',
        iframeUrl: mockIframeUrl,
        order,
      };
    }

    try {
      // 1. Authenticate with Paymob
      const authResponse = await fetch(
        'https://accept.paymob.com/api/auth/tokens',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: apiKey }),
        },
      );
      const authData = (await authResponse.json()) as PaymobAuthResponse;
      const authToken = authData.token;

      // 2. Register Order
      const amountCents = Math.round(finalPrice * 100);
      const orderResponse = await fetch(
        'https://accept.paymob.com/api/ecommerce/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_token: authToken,
            delivery_needed: false,
            amount_cents: amountCents,
            currency: 'EGP',
            merchant_order_id: order._id.toString(),
          }),
        },
      );
      const orderData = (await orderResponse.json()) as PaymobOrderResponse;
      const paymobOrderId = orderData.id;

      // Update local order with paymob order id
      await this.orderRepository.updateOne(
        { _id: order._id },
        { paymobOrderId: String(paymobOrderId) },
      );

      // 3. Request Payment Key
      const nameParts = user.username.split(' ');
      const firstName = nameParts[0] ?? 'Customer';
      const lastName = nameParts[1] ?? 'User';

      const keyResponse = await fetch(
        'https://accept.paymob.com/api/acceptance/payment_keys',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_token: authToken,
            amount_cents: amountCents,
            expiration: 3600,
            order_id: paymobOrderId,
            billing_data: {
              apartment: 'NA',
              email: user.email,
              floor: 'NA',
              first_name: firstName,
              street: dto.shippingAddress.street,
              building: 'NA',
              phone_number: dto.phone,
              shipping_method: 'PKG',
              postal_code: 'NA',
              city: dto.shippingAddress.city,
              country: 'EG',
              last_name: lastName,
              state: 'NA',
            },
            currency: 'EGP',
            integration_id: parseInt(integrationId),
            lock_order_when_paid: true,
          }),
        },
      );
      const keyData = (await keyResponse.json()) as PaymobPaymentKeyResponse;
      const paymentToken = keyData.token;

      const iframeBaseUrl =
        this.configService.get<string>('PAYMOB_IFRAME_BASE_URL') ??
        'https://accept.paymob.com';
      const iframeUrl = `${iframeBaseUrl}/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;

      return {
        message: 'Order created, proceed to payment',
        iframeUrl,
        order,
      };
    } catch (err) {
      // Rollback order if Paymob creation fails
      await this.orderRepository.deleteById(order._id.toString());
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(`Paymob registration failed: ${errMsg}`);
    }
  }

  async handlePaymobWebhook(
    body: { obj?: PaymobTransactionObj },
    hmacSignature?: string,
  ) {
    const hmacSecret = this.configService.get<string>('PAYMOB_HMAC_SECRET');

    // 1. Verify signature if secret exists
    if (hmacSecret && hmacSignature) {
      const obj = body.obj as PaymobTransactionObj;
      const amount_cents = String(obj.amount_cents);
      const created_at = String(obj.created_at);
      const currency = String(obj.currency);
      const error_occured = String(obj.error_occured);
      const has_parent_transaction = String(obj.has_parent_transaction);
      const id = String(obj.id);
      const integration_id = String(obj.integration_id);
      const is_3d_secure = String(obj.is_3d_secure);
      const is_auth = String(obj.is_auth);
      const is_capture = String(obj.is_capture);
      const is_voided = String(obj.is_voided);
      const is_refunded = String(obj.is_refunded);
      const owner = String(obj.owner);
      const pending = String(obj.pending);
      const pan = obj.source_data?.pan ?? '';
      const sub_type = obj.source_data?.sub_type ?? '';
      const type = obj.source_data?.type ?? '';
      const success = String(obj.success);

      const concatString =
        `${amount_cents}${created_at}${currency}${error_occured}${has_parent_transaction}` +
        `${id}${integration_id}${is_3d_secure}${is_auth}${is_capture}${is_voided}${is_refunded}` +
        `${owner}${pending}${pan}${sub_type}${type}${success}`;

      const computedHmac = crypto
        .createHmac('sha512', hmacSecret)
        .update(concatString)
        .digest('hex');

      if (computedHmac !== hmacSignature) {
        throw new BadRequestException('HMAC signature verification failed');
      }
    }

    const transactionObj = body.obj;
    if (!transactionObj) {
      return { status: 'ignored', message: 'No transaction object found' };
    }

    const paymobOrderId = String(transactionObj.order?.id ?? '');
    const isSuccess = transactionObj.success === true;

    // Find order using paymobOrderId
    const order = await this.orderRepository.findOne({
      $or: [
        { paymobOrderId },
        { _id: transactionObj.order?.merchant_order_id },
      ],
    });

    if (!order) {
      throw new NotFoundException('Corresponding order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return { status: 'ignored', message: 'Order is already paid' };
    }

    if (isSuccess) {
      // 1. Validate stocks one more time before processing
      for (const item of order.products) {
        const prod = await this.productRepository.findById(
          item.productId.toString(),
        );
        if (!prod || prod.stock < item.quantity) {
          // If stock is insufficient, mark payment as paid but cancel order
          await this.orderRepository.updateOne(
            { _id: order._id },
            {
              paymentStatus: PaymentStatus.PAID,
              status: OrderStatus.CANCELLED,
              refundStatus: RefundStatus.REQUESTED,
              refundReason:
                'System auto-cancellation: out of stock during payment',
            },
          );
          throw new BadRequestException(
            'Item out of stock during checkout transaction',
          );
        }
      }

      // 2. Deduct product stocks
      for (const item of order.products) {
        await this.productRepository.updateOne(
          { _id: item.productId },
          { $inc: { stock: -item.quantity } },
        );
      }

      // 3. Increment coupon count
      if (order.couponId) {
        await this.couponRepository.updateOne(
          { _id: order.couponId },
          { $inc: { usedCount: 1 } },
        );
      }

      // 4. Update order payment status
      await this.orderRepository.updateOne(
        { _id: order._id },
        {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.PROCESSING,
        },
      );

      // 5. Clear cart
      await this.cartRepository.updateOne(
        { userId: order.userId },
        { products: [] },
      );

      return {
        status: 'success',
        message: 'Order payment processed successfully',
      };
    } else {
      await this.orderRepository.updateOne(
        { _id: order._id },
        {
          paymentStatus: PaymentStatus.FAILED,
          status: OrderStatus.CANCELLED,
        },
      );
      return { status: 'failed', message: 'Order payment failed' };
    }
  }

  async getMyOrders(userId: string) {
    const orders = await this.orderRepository.findAll({ userId });
    return {
      message: 'Orders retrieved successfully',
      orders,
    };
  }

  async getOrderById(userId: string, userRole: Role, orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check ownership
    if (userRole !== Role.ADMIN && order.userId.toString() !== userId) {
      throw new NotFoundException('Order not found');
    }

    return {
      message: 'Order retrieved successfully',
      order,
    };
  }

  async cancelOrder(userId: string, userRole: Role, orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole !== Role.ADMIN && order.userId.toString() !== userId) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PROCESSING
    ) {
      throw new BadRequestException('Cannot cancel order in current state');
    }

    // If order was already paid, it requires an admin refund instead
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Paid orders must be refunded, not cancelled.',
      );
    }

    // Restore stock if cash order was deducted
    if (order.paymentType === PaymentType.CASH) {
      for (const item of order.products) {
        await this.productRepository.updateOne(
          { _id: item.productId },
          { $inc: { stock: item.quantity } },
        );
      }

      if (order.couponId) {
        await this.couponRepository.updateOne(
          { _id: order.couponId },
          { $inc: { usedCount: -1 } },
        );
      }
    }

    const updated = await this.orderRepository.updateOne(
      { _id: orderId },
      { status: OrderStatus.CANCELLED },
    );

    return {
      message: 'Order cancelled successfully',
      order: updated,
    };
  }

  async refundOrder(orderId: string, dto: RefundOrderDto) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    if (order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException('Order is already refunded');
    }

    // Restore product stocks
    for (const item of order.products) {
      await this.productRepository.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
      );
    }

    // Decrement coupon usedCount if coupon was applied
    if (order.couponId) {
      await this.couponRepository.updateOne(
        { _id: order.couponId },
        { $inc: { usedCount: -1 } },
      );
    }

    const updated = await this.orderRepository.updateOne(
      { _id: orderId },
      {
        status: OrderStatus.REFUNDED,
        paymentStatus: PaymentStatus.REFUNDED,
        refundStatus: RefundStatus.REFUNDED,
        refundReason: dto.refundReason ?? 'Admin Refund Request',
      },
    );

    return {
      message: 'Order refunded successfully',
      order: updated,
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updated = await this.orderRepository.updateOne(
      { _id: orderId },
      { status },
    );

    return {
      message: 'Order status updated successfully',
      order: updated,
    };
  }

  // ─── Private Helper Methods ────────────────────────────────────────────────
  private async validateAndCalculateOrderDetails(
    userId: string,
    couponCode?: string,
  ) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart || cart.products.length === 0) {
      throw new BadRequestException('Your shopping cart is empty');
    }

    // Validate product status & stock levels
    const orderProducts: OrderProductItem[] = [];
    let totalPrice = 0;

    for (const item of cart.products) {
      const product = await this.productRepository.findOne({
        _id: item.productId,
        deletedAt: null,
        isActive: true,
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId.toString()} is no longer available.`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Only ${product.stock} items available. Please adjust your cart.`,
        );
      }

      const unitPrice = product.priceAfterDiscount ?? product.price;

      orderProducts.push({
        productId: product._id,
        quantity: item.quantity,
        price: unitPrice,
        name: product.name,
      });

      totalPrice += unitPrice * item.quantity;
    }

    // Apply Coupon if provided
    let coupon: CouponDocument | null = null;
    let discount = 0;

    if (couponCode) {
      coupon = await this.couponRepository.findByCode(couponCode);
      if (!coupon) {
        throw new NotFoundException('Discount coupon not found');
      }

      if (!coupon.isActive) {
        throw new BadRequestException('Coupon is inactive');
      }

      if (coupon.expireAt <= new Date()) {
        throw new BadRequestException('Coupon code has expired');
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usageLimit !== undefined &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        throw new BadRequestException('Coupon usage limit reached');
      }

      if (coupon.type === CouponType.PERCENTAGE) {
        discount = totalPrice * (coupon.discount / 100);
      } else {
        discount = coupon.discount;
      }

      // Ensure discount is not greater than the cart price total
      discount = Math.min(discount, totalPrice);
    }

    const finalPrice = Math.max(0, totalPrice - discount);

    return {
      products: orderProducts,
      coupon,
      discount,
      totalPrice,
      finalPrice,
    };
  }
}
