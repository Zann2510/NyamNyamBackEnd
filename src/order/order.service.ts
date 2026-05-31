import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { UpdateOrderStatusDto } from './dto/update-order.dto';

// Definisikan tipe untuk item yang akan dibuat
type OrderItemCreateInput = {
  productId: string;
  quantity: number;
  price: number;
};

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (dto.paymentMethod !== 'CASH' && !dto.paymentProofUrl) {
      throw new BadRequestException('Bukti pembayaran wajib diupload untuk metode pembayaran ini');
    }

    return this.prisma.$transaction(async (tx) => {
      let total = 0;
      const itemsWithPrice: OrderItemCreateInput[] = []; // <-- tambahkan tipe

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
          price: product.price,
        });
      }

      const order = await tx.order.create({
        data: {
          userId,
          total,
          deliveryAddress: dto.deliveryAddress,
          paymentMethod: dto.paymentMethod,
          paymentProofUrl: dto.paymentProofUrl || null,
          status: dto.paymentMethod === 'CASH' ? OrderStatus.PENDING : OrderStatus.WAITING_PAYMENT, // gunakan enum
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

      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return order;
    });
  }

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

  async getOrderById(orderId: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pesanan ini');
    }
    return order;
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
    });
  }

  async cancelOrder(orderId: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('Anda tidak dapat membatalkan pesanan orang lain');
    }

    // Perbaiki perbandingan dengan enum
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.WAITING_PAYMENT) {
      throw new BadRequestException('Hanya pesanan dengan status PENDING atau WAITING_PAYMENT yang dapat dibatalkan');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
    });
  }
}