import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsUrl()
  icon?: string; // URL icon atau nama icon
}