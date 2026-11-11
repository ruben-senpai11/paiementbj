import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

dotenv.config();

// Hint pour le bundler/tracer Vercel afin d'embarquer les assets statiques Swagger UI.
try {
  require.resolve('swagger-ui-dist/swagger-ui-bundle.js');
} catch {
  // Dépendance optionnelle ignorée si absente.
}

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
