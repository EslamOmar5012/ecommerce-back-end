import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import * as crypto from 'crypto';

/**
 * Multer disk-storage config.
 * Saves files to the given destination folder with UUID-based names.
 *
 * Usage:
 *   @UseInterceptors(FileInterceptor('file', diskStorageOptions({ destination: 'uploads/profiles' })))
 */
export const diskStorageOptions = (opts: { destination?: string } = {}) => ({
  storage: diskStorage({
    destination: opts.destination ?? 'uploads',
    filename: (
      _req: any,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const uniqueName = `${crypto.randomUUID()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
});

/**
 * Multer memory-storage config.
 * Keeps the file in memory (buffer) — use this for Cloudinary uploads.
 *
 * Usage:
 *   @UseInterceptors(FileInterceptor('file', memoryStorageOptions()))
 */
export const memoryStorageOptions = () => ({
  storage: memoryStorage(),
});

/** @deprecated Use diskStorageOptions() or memoryStorageOptions() instead */
export const multerOptions = diskStorageOptions;
