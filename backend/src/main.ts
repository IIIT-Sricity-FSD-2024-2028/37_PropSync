import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { validationPipe } from './common/pipes/validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { appConfig, corsConfig } from './config/app.config';
import { swaggerConfig } from './config/swagger.config';
import * as express from 'express';
import { join } from 'path';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The frontend is served from a different local origin, so uploaded images
  // must be allowed as cross-origin resources. Helmet otherwise defaults this
  // header to same-origin and browsers block manager/provider image rendering.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.enableCors(corsConfig);
  app.useGlobalPipes(validationPipe);
  app.useGlobalFilters(new HttpExceptionFilter());

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(appConfig.port);

  console.log(`PropSync API running at http://localhost:${appConfig.port}`);
  console.log(`Swagger docs at http://localhost:${appConfig.port}/api/docs`);
}

bootstrap();
