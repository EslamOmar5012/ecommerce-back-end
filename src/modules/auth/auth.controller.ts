import { Controller, Post, Body, UsePipes, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/validation.pipe';
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from './auth.validation';
import type {
  SignupDto,
  LoginDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './auth.validation';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(new ZodValidationPipe(signupSchema))
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh-token')
  @UseGuards(RefreshTokenGuard)
  refreshToken(@CurrentUser() user: any) {
    return this.authService.refreshToken(user);
  }

  @Post('verify-otp')
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('forgot-password')
  @UseGuards(AuthGuard)
  forgotPassword(@CurrentUser() user: any) {
    return this.authService.forgotPassword(user);
  }

  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
