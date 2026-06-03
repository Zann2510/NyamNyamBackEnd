import {
  Controller, Get, Param, Res, HttpStatus, HttpException,UseGuards, } from '@nestjs/common';
import type { Response } from 'express';
import { ReceiptService } from './receipt.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
 
@ApiTags('receipt')
@ApiBearerAuth('JWT-auth')
@Controller('receipt')
@UseGuards(JwtAuthGuard)
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}
 
  @Get('generate/:orderId')
  @ApiOperation({ summary: 'Generate dan download struk PDF' })
  @ApiParam({ name: 'orderId', description: 'ID pesanan' })
  @ApiResponse({ status: 200, description: 'PDF streamed', content: { 'application/pdf': {} } })
  @ApiResponse({ status: 404, description: 'Order tidak ditemukan' })
  async generateReceipt(
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    try {
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      await this.receiptService.generateReceipt(orderId, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!res.headersSent) {
        throw new HttpException(
          message || 'Gagal generate struk',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Get('info/:orderId')
  @ApiOperation({ summary: 'Ambil informasi struk dalam format JSON' })
  @ApiParam({ name: 'orderId', description: 'ID pesanan' })
  @ApiResponse({ status: 200, description: 'Receipt info' })
  @ApiResponse({ status: 404, description: 'Order tidak ditemukan' })
  async getReceiptInfo(@Param('orderId') orderId: string) {
    return this.receiptService.getReceiptInfo(orderId);
  }
}