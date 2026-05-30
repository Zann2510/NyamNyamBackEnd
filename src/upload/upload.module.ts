  import { Module } from '@nestjs/common';
  import { MulterModule } from '@nestjs/platform-express';
  import { memoryStorage } from 'multer';
  import { UploadController } from './upload.controller';
  import { UploadService } from './upload.service';

  @Module({
    imports: [
      MulterModule.register({
        storage: memoryStorage(), // ← WAJIB agar file.buffer tersedia
      }),
    ],
    controllers: [UploadController],
    providers: [UploadService],
  })
  export class UploadModule {}