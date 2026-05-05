import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const appConfig = {
  port: Number(process.env.PORT) || 3000,
};

export const corsConfig: CorsOptions = {
  origin: [
    'http://127.0.0.1:5500',
    'http://127.0.0.1:5501',
    'http://127.0.0.1:5502',
    'http://localhost:5500',
    'http://localhost:5501',
    'http://localhost:5502',
  ],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'role', 'provider-id'],
};
