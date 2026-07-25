import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { extname } from 'path';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Builds a deterministic Cloudinary public_id from a user ID and original filename.
   * e.g. "ecommerce/uploads/{userId}/{sanitized-filename}"
   */
  buildPublicId(folder: string, userId: string, originalName: string): string {
    const nameWithoutExt = originalName
      .replace(extname(originalName), '') // strip extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // sanitize special chars
      .toLowerCase();
    return `${folder}/${userId}/${nameWithoutExt}`;
  }

  /**
   * Uploads a file buffer to Cloudinary.
   * @param buffer      File buffer (from multer memoryStorage)
   * @param folder      Cloudinary folder
   * @param publicId    Optional explicit public_id (enables deterministic naming)
   */
  uploadFile(
    buffer: Buffer,
    folder: string = 'ecommerce',
    publicId?: string,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: publicId ? undefined : folder, // folder is embedded in publicId when provided
          public_id: publicId,
          resource_type: 'auto',
          overwrite: true,
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(error ?? new Error('Cloudinary upload failed'));
          }
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
          });
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }

  /**
   * Deletes a file from Cloudinary by its public ID.
   * @param publicId  The public_id returned when the file was uploaded
   */
  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
