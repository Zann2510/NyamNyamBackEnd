import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decator';
import { Role } from '@prisma/client';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
        // ← tambah sementara untuk test
  @Roles(Role.ADMIN)
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

    if (!allowedMimes.includes(file.mimetype) && !allowedExts.includes(ext as string)) {
      throw new BadRequestException('Format file tidak didukung.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Ukuran file maksimal 5MB');
    }

    const url = await this.uploadService.uploadToCloudinary(file);
    return { url };
  }
}