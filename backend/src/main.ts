import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { validationPipe } from './common/pipes/validation.pipe';
import { appConfig, corsConfig } from './config/app.config';
import { swaggerConfig } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(corsConfig);
  app.useGlobalPipes(validationPipe);

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
