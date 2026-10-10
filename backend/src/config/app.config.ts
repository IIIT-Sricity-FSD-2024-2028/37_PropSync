import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const appConfig = {
  port: Number(process.env.PORT) || 3000,
};

export const corsConfig: CorsOptions = {
  // Frontend is commonly served with Live Server or another local port during
  // development. Reflect the local origin so signup approval requests do not
  // fail because a developer chose a different local server port.
  origin: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'role', 'provider-id', 'x-user-id'],
};
