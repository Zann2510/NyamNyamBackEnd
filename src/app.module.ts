import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // 1. Mengaktifkan ConfigModule secara global
    ConfigModule.forRoot({ 
      envFilePath: '.env',
      isGlobal: true 
    }),
    // 2. Keamanan Rate Limiting: Batasi maksimal 20 request per 1 menit per IP komputer
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 20,
    }]),
    
    AuthModule, UserModule, PrismaModule, CategoryModule, ProductModule, OrderModule],
  controllers: [ AppController ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
