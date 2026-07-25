import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import slugify from 'slugify';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({ timestamps: true })
export class Brand {
  @Prop({
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    unique: true,
    minlength: [2, 'Name must be at least 2 characters'],
  })
  name: string;

  @Prop({
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
  })
  slug: string;

  @Prop({
    type: String,
    default: '',
  })
  image: string;

  @Prop({
    type: String,
    default: '',
  })
  logo: string;

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

export const BrandSchema = SchemaFactory.createForClass(Brand);

// Auto-generate slug from name before saving
BrandSchema.pre('save', function () {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, { lower: true });
  }
});
