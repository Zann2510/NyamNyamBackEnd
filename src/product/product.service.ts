import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // ── Helper: cek duplikat nama (case-insensitive), exclude id tertentu saat update ──
  private async assertNameUnique(name: string, excludeId?: string) {
    const existing = await this.prisma.product.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, name: true },
    });
    if (existing) {
      throw new ConflictException(
        `Produk dengan nama "${existing.name}" sudah ada. Gunakan nama yang berbeda.`,
      );
    }
  }

  async create(createProductDto: CreateProductDto) {
    await this.assertNameUnique(createProductDto.name);

    try {
      return await this.prisma.product.create({
        data: {
          ...createProductDto,
          isAvailable: createProductDto.isAvailable ?? true,
        },
        include: { category: true },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `Produk dengan nama "${createProductDto.name}" sudah ada.`,
        );
      }
      throw err;
    }
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Produk dengan id ${id} tidak ditemukan`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);
    if (updateProductDto.name) {
      await this.assertNameUnique(updateProductDto.name, id);
    }
    try {
      return await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
        include: { category: true },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `Produk dengan nama "${updateProductDto.name}" sudah ada.`,
        );
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async findAllPaginated(paginationDto: PaginationDto) {
    const { page, limit, search, sortBy, sortOrder } = paginationDto;
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async checkNameAvailability(name: string, excludeId?: string) {
    if (!name?.trim()) {
      return { available: false, message: 'Nama produk tidak boleh kosong' };
    }
    const existing = await this.prisma.product.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { name: true },
    });
    if (existing) {
      return {
        available: false,
        message: `"${existing.name}" sudah digunakan`,
      };
    }
    return { available: true, message: 'Nama tersedia' };
  }
}