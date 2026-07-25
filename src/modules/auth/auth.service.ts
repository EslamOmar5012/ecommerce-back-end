import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import {
  SignupDto,
  LoginDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './auth.validation';
import { UserRepository } from '../../repo/user.repo';
import { SecurityService } from '../security/security.service';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly securityService: SecurityService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  async signup(dto: SignupDto) {
    const emailExists = await this.userRepository.emailExists(dto.email);
    if (emailExists) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await this.securityService.hashPassword(
      dto.password,
    );
    const encryptedPhone = this.securityService.encryptPhone(dto.phone);

    const savedUser = await this.userRepository.create({
      ...dto,
      password: hashedPassword,
      phone: encryptedPhone,
      isEmailConfirmed: false,
    });

    const userObject = savedUser.toObject();
    delete userObject.password;

    if (userObject.phone) {
      userObject.phone = this.securityService.decryptPhone(userObject.phone);
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    // Store in Redis with 10 minutes TTL
    await this.redisService.set(`otp:verify:${dto.email}`, otp, 600);

    // Send verification email
    try {
      await this.mailService.sendVerificationOtp(dto.email, otp);
    } catch (err) {
      // Log error but do not disrupt user creation
    }

    return {
      message:
        'User registered successfully. Please verify your email with the OTP sent.',
      user: userObject,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.securityService.comparePassword(
      dto.password,
      user.password || '',
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException({
        message: 'Email not verified. Please enter the OTP sent to your email first.',
        error: 'EmailNotVerified',
        requiresVerification: true,
      });
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.securityService.generateAccessToken(payload);
    const refreshToken =
      await this.securityService.generateRefreshToken(payload);

    return {
      message: 'User logged in successfully',
      accessToken,
      refreshToken,
      fcmToken: dto.fcmToken,
    };
  }

  async refreshToken(user: any) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.securityService.generateAccessToken(payload);
    const refreshToken =
      await this.securityService.generateRefreshToken(payload);

    return {
      message: 'Tokens refreshed successfully',
      accessToken,
      refreshToken,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const storedOtp = await this.redisService.get(`otp:verify:${dto.email}`);
    if (!storedOtp || storedOtp !== dto.otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.isEmailConfirmed = true;
    await user.save();

    await this.redisService.del(`otp:verify:${dto.email}`);

    return {
      message: 'Email verified successfully',
    };
  }

  async forgotPassword(user: any) {
    const otp = crypto.randomInt(100000, 999999).toString();
    await this.redisService.set(`otp:reset:${user.email}`, otp, 600);

    await this.mailService.sendResetPasswordOtp(user.email, otp);

    return {
      message: 'Password reset OTP sent successfully to your email',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const storedOtp = await this.redisService.get(`otp:reset:${dto.email}`);
    if (!storedOtp || storedOtp !== dto.otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const hashedPassword = await this.securityService.hashPassword(
      dto.password,
    );

    user.password = hashedPassword;
    await user.save();

    await this.redisService.del(`otp:reset:${dto.email}`);

    return {
      message: 'Password reset successfully',
    };
  }
}
