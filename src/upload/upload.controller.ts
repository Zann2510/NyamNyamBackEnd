import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // Admin: Upload gambar produk
  @Roles(Role.ADMIN)
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File tidak ditemukan');

    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Format file tidak didukung');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Ukuran file maksimal 2MB');
    }

    const imageUrl = await this.uploadService.uploadToCloudinary(file, 'nyamnyam/products');
    return { url: imageUrl };
  }

  // Customer: Upload bukti pembayaran
  @UseGuards(JwtAuthGuard)
  @Post('payment-proof')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPaymentProof(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File tidak ditemukan');

    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Format file tidak didukung');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Ukuran file maksimal 2MB');
    }

    const imageUrl = await this.uploadService.uploadToCloudinary(file, 'nyamnyam/payment-proofs');
    return { url: imageUrl };
  }
}