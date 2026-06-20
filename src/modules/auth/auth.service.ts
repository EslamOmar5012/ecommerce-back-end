import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { SignupDto, LoginDto } from './auth.validation';
import { UserRepository } from '../../repo/user.repo';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async signup(dto: SignupDto) {
    const emailExists = await this.userRepository.emailExists(dto.email);
    if (emailExists) {
      throw new ConflictException('Email already registered');
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(dto.password, salt);

    const savedUser = await this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    const userObject = savedUser.toObject();
    delete userObject.password;

    return {
      message: 'User registered successfully',
      user: userObject,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = bcrypt.compareSync(dto.password, user.password || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      message: 'User logged in successfully',
      token: 'mock-jwt-token-for-' + dto.email,
      fcmToken: dto.fcmToken,
    };
  }
}
