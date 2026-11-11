import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('PaiementBjServer');
  const app = await NestFactory.create(AppModule, { rawBody: true });

  configureApp(app);

  const apiPrefix = process.env.API_PREFIX || 'v1';
  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`API Paiement BJ opérationnelle sur : http://localhost:${port}/${apiPrefix}`);
  logger.log(`Documentation OpenAPI Swagger sur : http://localhost:${port}/api/docs`);
}

bootstrap();
