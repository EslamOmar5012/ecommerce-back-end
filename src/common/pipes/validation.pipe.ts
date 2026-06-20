import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: any) {}

  transform(value: any, metadata: ArgumentMetadata) {
    try {
      if (this.schema && typeof this.schema === 'object' && metadata.type in this.schema) {
        return this.schema[metadata.type].parse(value);
      }

      if (this.schema && typeof this.schema.parse === 'function') {
        return this.schema.parse(value);
      }

      return value;
    } catch (error: any) {
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

      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: error.message || error,
      });
    }
  }
}
