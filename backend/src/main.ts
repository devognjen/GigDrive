import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // The compose stack serves the frontend via nginx proxying /api, so CORS
  // only matters for local dev (ng serve on :4200 against the API on :3000).
  app.enableCors({ origin: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GigDrive API')
    .setDescription('Concert carpool coordination platform API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.BACKEND_PORT ?? 3000);
}
void bootstrap();
