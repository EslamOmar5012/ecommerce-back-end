import {
  PipeTransform,
  Injectable,
  BadRequestException,
  Optional,
} from '@nestjs/common';

export interface FileValidationOptions {
  /** Whether the file is required. Defaults to true. */
  required?: boolean;
  /** Allowed MIME types. Defaults to common image types. */
  allowedMimeTypes?: string[];
  /** Maximum file size in bytes. Defaults to 5 MB. */
  maxSizeBytes?: number;
}

const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates a file uploaded via Multer.
 *
 * Usage (single file):
 *   @UploadedFile(new FileValidationPipe({ maxSizeBytes: 2 * 1024 * 1024 }))
 *
 * Usage (optional file):
 *   @UploadedFile(new FileValidationPipe({ required: false }))
 */
@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly required: boolean;
  private readonly allowedMimeTypes: string[];
  private readonly maxSizeBytes: number;

  constructor(@Optional() options: FileValidationOptions = {}) {
    this.required = options.required ?? true;
    this.allowedMimeTypes =
      options.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;
    this.maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  }

  transform(file: Express.Multer.File | undefined) {
    // 1. Presence check
    if (!file) {
      if (this.required) {
        throw new BadRequestException('File is required');
      }
      return file;
    }

    // 2. MIME type check
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // 3. File size check
    if (file.size > this.maxSizeBytes) {
      const limitMb = (this.maxSizeBytes / (1024 * 1024)).toFixed(1);
      const fileMb = (file.size / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File size ${fileMb} MB exceeds the maximum allowed size of ${limitMb} MB`,
      );
    }

    return file;
  }
}
