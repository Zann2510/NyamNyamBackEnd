import { IsArray, ValidateNested, IsString, IsEnum, IsInt, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

class OrderItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsString()
  deliveryAddress!: string; // Untuk dine-in bisa diisi nomor meja, untuk delivery alamat

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}