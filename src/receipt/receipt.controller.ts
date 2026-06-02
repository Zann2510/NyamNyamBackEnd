/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Res, HttpStatus, HttpException, UseGuards } from '@nestjs/common';
import type { Response } from 'express'; // ✅ Gunakan 'import type'
import { ReceiptService } from './receipt.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('receipt')
@UseGuards(JwtAuthGuard)
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get('generate/:orderId')
  async generateReceipt(
    @Param('orderId') orderId: string,
    @Res() res: Response, 
  ) {
    try {
      await this.receiptService.generateReceipt(orderId, res);
    } catch (error) {
      console.error('Error:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        message || 'Gagal generate struk',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('info/:orderId')
  async getReceiptInfo(@Param('orderId') orderId: string) {
    return this.receiptService.getReceiptInfo(orderId);
  }
}