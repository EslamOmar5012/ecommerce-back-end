import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodError, ZodType, ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodSchema<unknown> | Record<string, ZodSchema<unknown>>,
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    try {
      if (
        this.schema &&
        typeof this.schema === 'object' &&
        !(this.schema instanceof ZodType) &&
        metadata.type in this.schema
      ) {
        const schemaForType = this.schema[metadata.type];
        return schemaForType.parse(value);
      }

      if (this.schema && this.schema instanceof ZodType) {
        return this.schema.parse(value);
      }

      return value;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: message,
      });
    }
  }
}
