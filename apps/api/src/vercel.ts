import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

dotenv.config();

// Référence explicite pour garantir l'inclusion des actifs Swagger UI dans le traceur Vercel NFT.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require.resolve('swagger-ui-dist/swagger-ui-bundle.js');
} catch {
  // Ignoré si absent dans un environnement allégé sans Swagger UI
}

type ServerlessRequestHandler = (req: any, res: any) => unknown;

let cachedHandlerPromise: Promise<ServerlessRequestHandler> | null = null;

export async function getServerlessHandler(): Promise<ServerlessRequestHandler> {
  if (!cachedHandlerPromise) {
    cachedHandlerPromise = (async () => {
      const app = await NestFactory.create(AppModule, {
        rawBody: true,
        logger: ['error', 'warn', 'log'],
      });
      configureApp(app);
      await app.init();
      return app.getHttpAdapter().getInstance() as ServerlessRequestHandler;
    })().catch((err) => {
      cachedHandlerPromise = null;
      throw err;
    });
  }
  return cachedHandlerPromise;
}

export default async function handler(req: any, res: any) {
  const expressHandler = await getServerlessHandler();
  return expressHandler(req, res);
}
