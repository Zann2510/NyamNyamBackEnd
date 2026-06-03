import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
  ApiParam, ApiQuery, ApiBody,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Public } from '../common/decorators/public.decator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products (public) with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productService.findAllPaginated(paginationDto);
  }

  // ── TAMBAH: endpoint check nama — harus SEBELUM :id ──────────────
  // Jika diletakkan setelah ':id', NestJS akan menangkap "check-name"
  // sebagai nilai id dan melempar NotFoundException.
  @Roles(Role.ADMIN)
  @Get('check-name')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cek ketersediaan nama produk (admin only)' })
  @ApiQuery({ name: 'name', required: true, type: String, description: 'Nama produk yang ingin dicek' })
  @ApiQuery({ name: 'excludeId', required: false, type: String, description: 'ID produk yang dikecualikan (untuk mode edit)' })
  @ApiResponse({ status: 200, description: '{ available: boolean, message: string }' })
  checkName(
    @Query('name') name: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.productService.checkNameAvailability(name, excludeId);
  }
  // ─────────────────────────────────────────────────────────────────

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID (public)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product (admin only)' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 409, description: 'Nama produk sudah ada' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a product (admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 409, description: 'Nama produk sudah ada' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a product (admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}