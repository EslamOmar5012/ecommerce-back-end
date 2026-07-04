import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getEncryptionKey(): Buffer {
    const rawKey =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET') ||
      'fallback-encryption-key-32-chars-long!';
    // Ensure key is exactly 32 bytes by hashing it with sha256
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Hashes a plain text password asynchronously using bcryptjs.
   * @param password Plain text password
   * @param saltRounds Hashing rounds (defaults to 10)
   */
  async hashPassword(password: string, saltRounds = 10): Promise<string> {
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plain text password against a hash asynchronously using bcryptjs.
   * @param password Plain text password
   * @param hash Hashed password to compare against
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Encrypts a phone number using AES-256-CBC.
   * @param phone Plain text phone number
   */
  encryptPhone(phone: string): string {
    if (!phone) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.getEncryptionKey(),
      iv,
    );
    let encrypted = cipher.update(phone, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypts an encrypted phone number using AES-256-CBC.
   * @param encryptedPhone Encrypted phone number format "iv:ciphertext"
   */
  decryptPhone(encryptedPhone: string): string {
    if (!encryptedPhone) return '';
    try {
      const parts = encryptedPhone.split(':');
      if (parts.length !== 2) {
        return encryptedPhone;
      }
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.getEncryptionKey(),
        iv,
      );
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      // Return original text if decryption fails (e.g. it was not encrypted)
      return encryptedPhone;
    }
  }

  /**
   * Generates a signed JWT token asynchronously.
   * @param payload Token payload
   * @param options Additional JwtSignOptions
   */
  async generateToken(
    payload: Record<string, any>,
    options?: JwtSignOptions,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, options);
  }

  /**
   * Verifies and decodes a JWT token asynchronously.
   * @param token The signed JWT token
   * @param options Additional JwtVerifyOptions
   */
  async verifyToken<T extends object>(
    token: string,
    options?: JwtVerifyOptions,
  ): Promise<T> {
    return this.jwtService.verifyAsync<T>(token, options);
  }

  /**
   * Generates an access token (expires in 2h by default).
   */
  async generateAccessToken(payload: Record<string, any>): Promise<string> {
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '2h');
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: expiresIn as any,
    });
  }

  /**
   * Generates a refresh token (expires in 7d by default).
   */
  async generateRefreshToken(payload: Record<string, any>): Promise<string> {
    const secret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: expiresIn as any,
    });
  }

  /**
   * Verifies and decodes an access token.
   */
  async verifyAccessToken<T extends object>(token: string): Promise<T> {
    const secret = this.configService.get<string>('JWT_SECRET');
    return this.jwtService.verifyAsync<T>(token, { secret });
  }

  /**
   * Verifies and decodes a refresh token.
   */
  async verifyRefreshToken<T extends object>(token: string): Promise<T> {
    const secret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET');
    return this.jwtService.verifyAsync<T>(token, { secret });
  }
}
