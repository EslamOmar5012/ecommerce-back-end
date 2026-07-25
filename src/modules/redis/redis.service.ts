import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    const username = this.configService.get<string>('REDIS_USERNAME');
    const password = this.configService.get<string>('REDIS_PASSWORD');

    const options: any = {
      socket: {
        host,
        port: Number(port),
        connectTimeout: 5000,
        reconnectStrategy: false, // Prevent infinite retry loops if Redis is offline
      },
    };
    if (username) options.username = username;
    if (password) options.password = password;

    this.client = createClient(options);

    this.client.on('error', (err) => {
      this.logger.warn(`Redis Client Warning: ${err.message}`);
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to Redis...');
    try {
      await this.client.connect();
      this.logger.log('Redis connected successfully.');

      await this.client.set('foo', 'bar');
      const result = await this.client.get('foo');
      this.logger.log(
        `Redis Connection Test: set 'foo' = 'bar' -> get 'foo' = '${result}'`,
      );
    } catch (err) {
      this.logger.warn(
        `Redis is unavailable (${err instanceof Error ? err.message : String(err)}). App will continue operating without Redis.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client.isOpen) {
      this.logger.log('Disconnecting from Redis...');
      await this.client.disconnect();
      this.logger.log('Redis disconnected successfully.');
    }
  }

  /**
   * Set a key-value pair in Redis.
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client.isOpen) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, {
          EX: ttlSeconds,
        });
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      this.logger.warn(`Redis set failed for key ${key}: ${err}`);
    }
  }

  /**
   * Get value by key from Redis.
   */
  async get(key: string): Promise<string | null> {
    if (!this.client.isOpen) return null;
    try {
      return await this.client.get(key);
    } catch (err) {
      this.logger.warn(`Redis get failed for key ${key}: ${err}`);
      return null;
    }
  }

  /**
   * Delete a key from Redis.
   */
  async del(key: string): Promise<void> {
    if (!this.client.isOpen) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(`Redis del failed for key ${key}: ${err}`);
    }
  }

  /**
   * Expose raw Redis client if needed for other advance commands.
   */
  getClient(): RedisClientType {
    return this.client;
  }
}
