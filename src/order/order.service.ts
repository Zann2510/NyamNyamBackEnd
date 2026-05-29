import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';


@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Membuat pesanan baru dengan transaksi atomik
   * - Validasi stok semua produk
   * - Hitung total harga
   * - Buat order & order items
   * - Kurangi stok produk
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      let total = 0;
      const itemsWithPrice: any[] = [];

      // 1. Validasi stok dan hitung total
      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new NotFoundException(`Produk dengan id ${item.productId} tidak ditemukan`);
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stok produk "${product.name}" tidak mencukupi (tersisa ${product.stock}, diminta ${item.quantity})`,
          );
        }
        const subtotal = product.price * item.quantity;
        total += subtotal;
        itemsWithPrice.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price, // snapshot harga saat transaksi
        });
      }

      // 2. Buat order
      const order = await tx.order.create({
        data: {
          userId,
          total,
          deliveryAddress: dto.deliveryAddress,
          paymentMethod: dto.paymentMethod,
          status: 'PENDING',
          items: {
            create: itemsWithPrice,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // 3. Kurangi stok produk
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return order;
    });
  }

  /**
   * Mendapatkan semua pesanan milik user tertentu (CUSTOMER)
   */
  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mendapatkan semua pesanan (untuk ADMIN)
   */
  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mendapatkan detail satu pesanan (dengan pengecekan kepemilikan)
   */
  async getOrderById(orderId: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    // Cek akses: admin boleh, atau user pemilik pesanan
    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pesanan ini');
    }
    return order;
  }

  /**
   * Update status pesanan (hanya ADMIN)
   */
  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
    });
  }

  /**
   * Membatalkan pesanan (oleh user pemilik atau ADMIN)
   * - Kembalikan stok produk yang dipesan
   * - Ubah status menjadi CANCELLED
   */
  async cancelOrder(orderId: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    // Cek otorisasi
    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('Anda tidak dapat membatalkan pesanan orang lain');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Hanya pesanan dengan status PENDING yang dapat dibatalkan');
    }

    return this.prisma.$transaction(async (tx) => {
      // Kembalikan stok
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      // Update status
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    });
  }
}