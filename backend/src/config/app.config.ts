import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { existsSync } from 'fs';
import { join } from 'path';

const backendRoot = existsSync(join(process.cwd(), 'backend'))
  ? join(process.cwd(), 'backend')
  : process.cwd();

export const appConfig = {
  port: Number(process.env.PORT) || 3000,
  backendRoot,
  uploadsPath: join(backendRoot, 'uploads'),
  logsPath: join(backendRoot, 'logs'),
};

export const corsConfig: CorsOptions = {
  // Frontend is commonly served with Live Server or another local port during
  // development. Reflect the local origin so signup approval requests do not
  // fail because a developer chose a different local server port.
  origin: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'role', 'provider-id', 'x-user-id'],
};
