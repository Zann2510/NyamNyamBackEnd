import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import compression from 'compression';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  
  // Middleware keamanan (optional tapi direkomendasikan)
  app.use(helmet());
  app.use(compression());
  
  // CORS - sesuaikan dengan environment variable
  const allowedOrigin = process.env.FRONTEND_URL || '*';
  app.enableCors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // Prefix global (opsional, bisa diaktifkan jika ingin semua endpoint diawali /api)
  // app.setGlobalPrefix('api');
  
  // Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,          // menghilangkan properti yang tidak ada di DTO
    transform: true,          // auto transformasi tipe data
    forbidNonWhitelisted: true, // menolak request dengan properti tambahan
    validationError: { target: false, value: false },
  }));
  
  // Global Filter untuk menangani exception
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Global Interceptor untuk standarisasi response
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('NyamNyam')
    .setDescription('Self Ordering Point of Sale System API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('categories', 'Product categories')
    .addTag('products', 'Product management')
    .addTag('orders', 'Order processing')
    .addTag('upload', 'File upload')
    .addTag('health', 'Health check')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
  logger.log(`📚 Swagger documentation available at: ${await app.getUrl()}/api-docs`);
}

bootstrap();