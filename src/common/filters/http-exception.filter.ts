import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // ← Tambah ini untuk lihat error asli di console
    if (!(exception instanceof HttpException)) {
      this.logger.error('Unhandled exception:', exception);
    }

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Terjadi kesalahan pada server.' };

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof errorResponse === 'object' && errorResponse['message']
          ? errorResponse['message']
          : errorResponse,
    });
  }
}