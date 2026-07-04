import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role, Provider, Gender } from '../common/enums/user.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
  })
  username: string;

  @Prop({
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
  })
  email: string;

  @Prop({
    type: String,
    required: function (this: User) {
      return this.provider === Provider.SYSTEM;
    },
  })
  password?: string;

  @Prop({
    type: String,
    required: [true, 'Phone number is required'],
  })
  phone: string;

  @Prop({
    type: Number,
    min: [13, 'Age must be at least 13'],
    max: [100, 'Age must be at most 100'],
  })
  age: number;

  @Prop({
    type: String,
    default: '',
  })
  profilePic: string;

  @Prop({
    type: [String],
    default: [],
  })
  coverPics: string[];

  @Prop({
    type: [String],
    default: [],
  })
  files: string[];

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.USER,
  })
  role: Role;

  @Prop({
    type: String,
    enum: Object.values(Provider),
    default: Provider.SYSTEM,
  })
  provider: Provider;

  @Prop({
    type: String,
    enum: Object.values(Gender),
    default: Gender.MALE,
  })
  gender: Gender;

  @Prop({
    type: Boolean,
    default: false,
  })
  isEmailConfirmed: boolean;

  @Prop({
    type: Date,
    index: { expires: 0 },
  })
  expireAt?: Date;

  @Prop({
    type: Date,
  })
  changeCredentialTime?: Date;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
