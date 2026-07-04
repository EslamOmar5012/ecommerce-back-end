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
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');
    const username = this.configService.get<string>('REDIS_USERNAME');
    const password = this.configService.get<string>('REDIS_PASSWORD');

    const options: any = {};
    if (username) options.username = username;
    if (password) options.password = password;
    if (host && port) {
      options.socket = {
        host,
        port: Number(port),
      };
    } else {
      options.url = 'redis://localhost:6379';
    }

    this.client = createClient(options);

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to Redis...');
    await this.client.connect();
    this.logger.log('Redis connected successfully.');

    // Connection validation test as in user code snippet:
    try {
      await this.client.set('foo', 'bar');
      const result = await this.client.get('foo');
      this.logger.log(
        `Redis Connection Test: set 'foo' = 'bar' -> get 'foo' = '${result}'`,
      );
    } catch (err) {
      this.logger.error(
        'Failed to run connection test commands on Redis client',
        err,
      );
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from Redis...');
    await this.client.disconnect();
    this.logger.log('Redis disconnected successfully.');
  }

  /**
   * Set a key-value pair in Redis.
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, {
        EX: ttlSeconds,
      });
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Get value by key from Redis.
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * Delete a key from Redis.
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Expose raw Redis client if needed for other advance commands.
   */
  getClient(): RedisClientType {
    return this.client;
  }
}
