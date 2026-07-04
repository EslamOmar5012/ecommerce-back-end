import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SecurityService } from '../../modules/security/security.service';
import { UserRepository } from '../../repo/user.repo';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly securityService: SecurityService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization header is missing or invalid',
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = await this.securityService.verifyRefreshToken<{
        sub: string;
        email: string;
        role: string;
        iat: number;
        exp: number;
      }>(token);

      const user = await this.userRepository.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.deletedAt) {
        throw new UnauthorizedException('This account has been deactivated');
      }

      if (user.changeCredentialTime) {
        const changeTimeSeconds = Math.floor(
          user.changeCredentialTime.getTime() / 1000,
        );
        if (changeTimeSeconds > decoded.iat) {
          throw new UnauthorizedException(
            'Token is invalid because credentials have changed. Please login again.',
          );
        }
      }

      // Attach the authenticated user to the request
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
