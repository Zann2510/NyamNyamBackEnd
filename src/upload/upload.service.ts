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

  async uploadToCloudinary(file: Express.Multer.File, folder: string = 'nyamnyam/products'): Promise<string> {
    this.logger.log(`Uploading to folder ${folder}: ${file.originalname} (${file.size} bytes)`);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary error: ${JSON.stringify(error)}`);
            reject(new InternalServerErrorException(`Cloudinary error: ${error.message}`));
          } else if (result && result.secure_url) {
            this.logger.log(`Upload success: ${result.secure_url}`);
            resolve(result.secure_url);
          } else {
            this.logger.error('Cloudinary returned no result');
            reject(new InternalServerErrorException('Upload gagal: respons tidak valid'));
          }
        },
      );
      uploadStream.end(file.buffer);
    });
  }
}