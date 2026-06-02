/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  async generateReceipt(orderId: string, res: Response) {
    try {
      // Ambil data order lengkap
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Order tidak ditemukan');
      }

      // Generate nomor struk unik
      const receiptNumber = `NYM/${order.id.slice(-6)}/${new Date().getFullYear()}${new Date().getMonth() + 1}`;

      // Buat PDF
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: `Struk ${receiptNumber}`,
          Author: 'Nyam Nyam Restaurant',
        },
      });

      // Set response headers untuk download PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=struk_${receiptNumber}.pdf`,
      );

      // Pipe PDF ke response
      doc.pipe(res);

      // ========== DESIGN STRUK ==========
      
      // Header dengan logo text
      doc.fontSize(22)
         .font('Helvetica-Bold')
         .text('NYAM NYAM', { align: 'center' });
      
      doc.fontSize(11)
         .font('Helvetica')
         .text('Restaurant & Cafe', { align: 'center' })
         .text('Jl. Kulineran No. 123, Surabaya', { align: 'center' })
         .text('Tel: (031) 123-4567 | IG: @nyamnyam', { align: 'center' });
      
      doc.moveDown();
      
      // Garis pemisah
      doc.lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      doc.moveDown();

      // Title STRUK
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('STRUK PEMBAYARAN', { align: 'center' });
      
      doc.moveDown();

      // Informasi Transaksi
      doc.fontSize(10)
         .font('Helvetica');
      
      doc.text(`No. Transaksi  : ${receiptNumber}`);
      doc.text(`No. Order      : ${order.id}`);
      doc.text(`Tanggal        : ${new Date(order.createdAt).toLocaleString('id-ID', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`);
      doc.text(`Kasir/Pelayan  : ${order.user?.name || 'System'}`);
      doc.text(`Status Order   : ${order.status.toUpperCase()}`);
      
      doc.moveDown();

      // Tabel Item
      doc.font('Helvetica-Bold')
         .text('DETAIL PESANAN', { underline: true });
      
      doc.moveDown(0.5);
      
      // Header tabel
      const startX = 50;
      let currentY = doc.y;
      
      doc.fontSize(9);
      doc.font('Helvetica-Bold');
      doc.text('Item', startX, currentY);
      doc.text('Qty', startX + 250, currentY);
      doc.text('Harga', startX + 320, currentY);
      doc.text('Subtotal', startX + 420, currentY);
      
      doc.lineWidth(0.5)
         .moveTo(50, currentY + 15)
         .lineTo(550, currentY + 15)
         .stroke();
      
      // Isi tabel
      doc.font('Helvetica');
      let yPosition = currentY + 25;
      let total = 0;
      
      for (const item of order.items) {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        // Nama produk (maks 30 karakter)
        const productName = item.product.name.length > 30 
          ? item.product.name.substring(0, 27) + '...' 
          : item.product.name;
        
        doc.text(productName, startX, yPosition);
        doc.text(item.quantity.toString(), startX + 250, yPosition);
        doc.text(`Rp ${item.price.toLocaleString('id-ID')}`, startX + 320, yPosition);
        doc.text(`Rp ${subtotal.toLocaleString('id-ID')}`, startX + 420, yPosition);
        
        yPosition += 20;
        
        // Cek jika halaman penuh
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      }
      
      // Garis penutup tabel
      doc.lineWidth(0.5)
         .moveTo(50, yPosition + 5)
         .lineTo(550, yPosition + 5)
         .stroke();
      
      // Total
      yPosition += 20;
      doc.font('Helvetica-Bold');
      doc.text('TOTAL PEMBAYARAN:', startX + 300, yPosition);
      doc.font('Helvetica-Bold');
      doc.text(`Rp ${total.toLocaleString('id-ID')}`, startX + 420, yPosition);
      
      // Informasi Pembayaran
      yPosition += 30;
      doc.font('Helvetica');
      doc.fontSize(9);
      doc.text(`Metode Pembayaran : ${order.paymentMethod || 'Belum dipilih'}`);
      doc.text(`Status Pembayaran : ${order.paymentStatus || 'Pending'}`);
      
      // Footer
      doc.moveDown();
      doc.lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      doc.moveDown();
      doc.fontSize(9); // ✅ Set font size untuk teks footer
      doc.text('Terima kasih telah berbelanja di Nyam Nyam!', { align: 'center' })
         .text('Struk ini sebagai bukti pembayaran yang sah.', { align: 'center' })
         .text('Simpan struk ini sebagai bukti transaksi Anda.', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(8); // ✅ Set font size lebih kecil untuk cetakan
      doc.text(`Dicetak pada : ${new Date().toLocaleString('id-ID')}`, { align: 'center' });
      
      // Selesai
      doc.end();

      return {
        success: true,
        message: 'Struk berhasil digenerate',
        receiptNumber,
      };
      
    } catch (error) {
      console.error('Error:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        message || 'Gagal generate struk',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getReceiptInfo(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { 
            name: true, 
            email: true 
          },
        },
        items: {
          include: {
            product: {
              select: { 
                name: true, 
                price: true 
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    const receiptNumber = `NYM/${order.id.slice(-6)}/${new Date().getFullYear()}${new Date().getMonth() + 1}`;
    const total = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    return {
      success: true,
      data: {
        orderId: order.id,
        receiptNumber,
        date: order.createdAt,
        customerName: order.user?.name,
        customerEmail: order.user?.email,
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      },
    };
  }
}