// src/upload/upload.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    this.logger.log(`Cloud Name: ${cloudName}`);
    this.logger.log(`API Key: ${apiKey ? '****' + apiKey.slice(-4) : 'missing'}`);

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error('Cloudinary credentials missing!');
      throw new Error('Cloudinary credentials not configured');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    this.logger.log('Cloudinary configured successfully');
  }

  async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    this.logger.log(`Uploading: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'nyamnyam/products',
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
          // Tidak memaksakan format webp agar tetap asli
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary error: ${JSON.stringify(error)}`);
            reject(new InternalServerErrorException(`Cloudinary: ${error.message}`));
          } else if (result && result.secure_url) {
            this.logger.log(`Success: ${result.secure_url}`);
            resolve(result.secure_url);
          } else {
            reject(new InternalServerErrorException('Invalid response from Cloudinary'));
          }
        },
      );
      uploadStream.end(file.buffer);
    });
  }
}