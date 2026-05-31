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

  @Post()
  @ApiOperation({ summary: 'Create a new order (customer)' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - insufficient stock or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.userId, createOrderDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user orders (customer)' })
  @ApiResponse({ status: 200, description: 'List of user orders' })
  getUserOrders(@Request() req) {
    return this.orderService.getUserOrders(req.user.userId);
  }

  @Roles(Role.ADMIN)
  @Get('all')
  @ApiOperation({ summary: 'Get all orders (admin only)' })
  @ApiResponse({ status: 200, description: 'List of all orders with user details' })
  getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (admin or owner)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your order' })
  getOrderById(@Param('id') id: string, @Request() req) {
    return this.orderService.getOrderById(id, req.user.userId, req.user.role);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateOrderStatusDto) {
    return this.orderService.updateOrderStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel order (admin or owner, only if pending)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled and stock restored' })
  @ApiResponse({ status: 400, description: 'Cannot cancel non-pending order' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  cancelOrder(@Param('id') id: string, @Request() req) {
    return this.orderService.cancelOrder(id, req.user.userId, req.user.role);
  }

  @Roles(Role.ADMIN)
  @Get('summary')
  async getOrderSummary() {
    return this.orderService.getOrderSummary();
  }
}