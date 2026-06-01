import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ─── POST ──────────────────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Create a new order (customer)' })
  @ApiBody({ type: CreateOrderDto })
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.userId, createOrderDto);
  }

  // ─── GET — static routes FIRST, dynamic (:id) LAST ────────
  // PENTING: Di NestJS/Express, route statis harus didefinisikan
  // SEBELUM route dinamis (:id). Kalau terbalik, "summary", "me",
  // dan "all" akan ditangkap sebagai nilai :id dan menghasilkan 404.

  @Get('me')
  @ApiOperation({ summary: 'Get current user orders (customer)' })
  getUserOrders(@Request() req) {
    return this.orderService.getUserOrders(req.user.userId);
  }

  @Roles(Role.ADMIN)
  @Get('all')
  @ApiOperation({ summary: 'Get all orders (admin only)' })
  getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @Roles(Role.ADMIN)
  @Get('summary')
  @ApiOperation({ summary: 'Get order summary/stats (admin only)' })
  getOrderSummary() {
    return this.orderService.getOrderSummary();
  }

  // ─── Dynamic route — harus PALING BAWAH ───────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (admin or owner)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  getOrderById(@Param('id') id: string, @Request() req) {
    return this.orderService.getOrderById(id, req.user.userId, req.user.role);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: UpdateOrderStatusDto })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateOrderStatusDto) {
    return this.orderService.updateOrderStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel order (admin or owner, only if pending)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  cancelOrder(@Param('id') id: string, @Request() req) {
    return this.orderService.cancelOrder(id, req.user.userId, req.user.role);
  }
}