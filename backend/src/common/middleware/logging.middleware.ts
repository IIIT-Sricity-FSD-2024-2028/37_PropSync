import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const role = req.headers['role'] || 'unknown';
    const ip = req.ip || 'unknown';

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      const logMessage =
        `${timestamp} | ${method} | ${url} | ` +
        `role=${role} | status=${statusCode} | ` +
        `${responseTime}ms | ip=${ip}\n`;

      const logsDirectory = path.join(process.cwd(), 'logs');
      const logFile = path.join(logsDirectory, 'app.log');

      if (!fs.existsSync(logsDirectory)) {
        fs.mkdirSync(logsDirectory, { recursive: true });
      }

      fs.appendFileSync(logFile, logMessage);
    });

    next();
  }
}