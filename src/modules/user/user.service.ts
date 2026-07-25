import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../repo/user.repo';
import { SecurityService } from '../security/security.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Role } from '../../common/enums/user.enum';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly securityService: SecurityService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getProfile(user: any) {
    const userObj = user.toObject();
    delete userObj.password;

    if (userObj.phone) {
      userObj.phone = this.securityService.decryptPhone(userObj.phone);
    }

    return {
      message: 'User profile retrieved successfully',
      user: userObj,
    };
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll({ deletedAt: null });
    const sanitizedUsers = users.map((u) => {
      const obj = u.toObject();
      delete obj.password;
      if (obj.phone) {
        obj.phone = this.securityService.decryptPhone(obj.phone);
      }
      return obj;
    });

    return {
      message: 'All users retrieved successfully',
      users: sanitizedUsers,
    };
  }

  async uploadFile(user: any, file: Express.Multer.File) {
    const userId = user._id.toString();

    // Build deterministic public_id from userId + original filename
    const publicId = this.cloudinaryService.buildPublicId(
      'ecommerce/uploads',
      userId,
      file.originalname,
    );

    // Check if the user already has a file with the same public_id
    const existingUrl: string | undefined = (user.files as string[]).find(
      (url) => url.includes(publicId.split('/').slice(-2).join('/')),
    );

    if (existingUrl) {
      // Delete from Cloudinary
      await this.cloudinaryService.deleteFile(publicId);

      // Remove old URL from the user's files array in DB
      await this.userRepository.updateById(userId, {
        $pull: { files: existingUrl },
      });
    }

    // Upload the new file with the deterministic public_id
    const result = await this.cloudinaryService.uploadFile(
      file.buffer,
      'ecommerce/uploads',
      publicId,
    );

    await this.userRepository.updateById(userId, {
      $push: { files: result.secureUrl },
    });

    return {
      message: existingUrl
        ? 'File replaced successfully'
        : 'File uploaded successfully',
      replaced: !!existingUrl,
      url: result.secureUrl,
      publicId: result.publicId,
      format: result.format,
      bytes: result.bytes,
      ...(result.width && { width: result.width }),
      ...(result.height && { height: result.height }),
    };
  }

  async updateUserRole(id: string, role: Role) {
    const user = await this.userRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    user.changeCredentialTime = new Date(); // Invalidate current JWT tokens
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return {
      message: `User role updated to ${role} successfully`,
      user: userObj,
    };
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.deletedAt = new Date();
    user.changeCredentialTime = new Date(); // Invalidate current JWT tokens
    await user.save();

    return {
      message: 'User deactivated successfully',
    };
  }
}
