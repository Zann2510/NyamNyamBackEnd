// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { json, urlencoded } from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Body parser untuk menangani file upload (diperlukan untuk Multer)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // CORS
  const allowedOrigins = process.env.FRONTEND_URL || '*';
  app.enableCors({
    origin: allowedOrigins === '*' ? true : allowedOrigins.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix (opsional, jika ingin semua route diawali /api)
  // app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('NyamNyam Food Delivery API')
    .setDescription(`
      ## API Documentation for NyamNyam

      ### Features:
      - User authentication (JWT)
      - Role-based access control (Admin & Customer)
      - Product & Category management
      - Order processing with atomic transactions
      - File upload to Cloudinary
      - Health check

      ### Authentication:
      Use \`/auth/login\` to obtain a JWT token, then add it to the Authorize button.
    `)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User profile')
    .addTag('categories', 'Product categories')
    .addTag('products', 'Product management')
    .addTag('orders', 'Order processing')
    .addTag('upload', 'File upload')
    .addTag('health', 'Health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NyamNyam API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 Server running on: ${await app.getUrl()}`);
  logger.log(`📚 Swagger UI: ${await app.getUrl()}/api-docs`);
  logger.log(`💚 Health check: ${await app.getUrl()}/health`);
}

bootstrap();