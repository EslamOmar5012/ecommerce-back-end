import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import slugify from 'slugify';
import { DiscountEnum } from '../common/enums/product.enum';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
class Discount {
  @Prop({ type: Number, default: 0, min: 0 })
  discount: number;

  @Prop({
    type: String,
    enum: Object.values(DiscountEnum),
    default: DiscountEnum.PERCENTAGE,
  })
  type: DiscountEnum;
}

@Schema({ _id: false })
class Rating {
  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  avg: number;

  @Prop({ type: Number, default: 0, min: 0 })
  count: number;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
  })
  name: string;

  @Prop({
    type: String,
    trim: true,
    lowercase: true,
  })
  slug: string;

  @Prop({
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
  })
  description: string;

  @Prop({
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  })
  price: number;

  @Prop({
    type: Number,
    default: 0,
  })
  priceAfterDiscount: number;

  @Prop({
    type: Discount,
    default: () => ({}),
  })
  discount: Discount;

  @Prop({
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  })
  stock: number;

  @Prop({
    type: [String],
    default: [],
  })
  gallery: string[];

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required'],
  })
  category: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Subcategory',
    required: [true, 'Product subcategory is required'],
  })
  subCategory: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Product brand is required'],
  })
  brand: Types.ObjectId;

  @Prop({
    type: Rating,
    default: () => ({}),
  })
  rating: Rating;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes for high performance searching and filtering
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, isActive: 1, deletedAt: 1 });
ProductSchema.index({ brand: 1, isActive: 1, deletedAt: 1 });
ProductSchema.index({ price: 1, createdAt: -1 });

// Auto-generate slug and calculate price after discount before saving
ProductSchema.pre('save', function () {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, { lower: true });
  }

  // Calculate priceAfterDiscount
  const price = this.price || 0;
  const discountVal = this.discount?.discount || 0;
  const discountType = this.discount?.type || DiscountEnum.PERCENTAGE;

  if (discountVal > 0) {
    if (discountType === DiscountEnum.PERCENTAGE) {
      this.priceAfterDiscount = Math.max(
        0,
        price - (price * discountVal) / 100,
      );
    } else if (discountType === DiscountEnum.FIXED) {
      this.priceAfterDiscount = Math.max(0, price - discountVal);
    }
  } else {
    this.priceAfterDiscount = price;
  }
});
