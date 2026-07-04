import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/user.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { memoryStorageOptions } from '../../common/multer/multer.config';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { ZodValidationPipe } from '../../common/pipes/validation.pipe';
import { z } from 'zod';

const updateRoleSchema = {
  body: z.object({
    role: z.nativeEnum(Role),
  }),
};

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.userService.getProfile(user);
  }

  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file', memoryStorageOptions()))
  uploadFile(
    @CurrentUser() user: any,
    @UploadedFile(new FileValidationPipe({ maxSizeBytes: 5 * 1024 * 1024 }))
    file: Express.Multer.File,
  ) {
    return this.userService.uploadFile(user, file);
  }

  @Get()
  @Roles(Role.ADMIN)
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(updateRoleSchema))
  updateUserRole(@Param('id') id: string, @Body() body: { role: Role }) {
    return this.userService.updateUserRole(id, body.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
