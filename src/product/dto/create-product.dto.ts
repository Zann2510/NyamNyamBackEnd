import { IsString, IsNumber, Min, IsOptional, IsBoolean, IsUrl, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsUrl()
  @IsNotEmpty()
  image!: string; // URL gambar produk

  @IsNumber()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean; // default true di schema

  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}