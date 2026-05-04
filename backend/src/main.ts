import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

// ✅ Swagger imports
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Global validation
  app.useGlobalPipes(new ValidationPipe());

  // ✅ Enable CORS for frontend
  app.enableCors();

  // ✅ Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Property Management API')
    .setDescription('Backend APIs for Review-4')
    .setVersion('1.0')
    .addTag('API')

    // 🔥 IMPORTANT: add role header
    .addApiKey(
      {
        type: 'apiKey',
        name: 'role',
        in: 'header',
      },
      'role-header',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // 👈 THIS creates /api-docs

  await app.listen(3000);
}
bootstrap();
