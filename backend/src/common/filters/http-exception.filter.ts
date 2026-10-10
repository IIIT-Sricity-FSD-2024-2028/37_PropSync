import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const errorResponse = exceptionResponse as {
          message?: string | string[];
        };

        if (errorResponse.message) {
          message = Array.isArray(errorResponse.message)
            ? errorResponse.message.join(', ')
            : errorResponse.message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const timestamp = new Date().toISOString();
    const method = request.method;
    const url = request.originalUrl;
    const role = request.headers['role'] || 'unknown';
    const ip = request.ip || 'unknown';

    const errorLog =
      `${timestamp} | ${method} | ${url} | ` +
      `role=${role} | status=${status} | ` +
      `ip=${ip} | error=${message}\n`;

    const logsDirectory = path.join(process.cwd(), 'logs');
    const errorLogFile = path.join(logsDirectory, 'error.log');

    if (!fs.existsSync(logsDirectory)) {
      fs.mkdirSync(logsDirectory, { recursive: true });
    }

    fs.appendFileSync(errorLogFile, errorLog);

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp,
      path: url,
    });
  }
}