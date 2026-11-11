import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../app.module';
import { configureApp } from '../app.setup';

function findRepoRoot(startDir: string): string {
  let current = path.resolve(startDir);
  while (true) {
    if (
      fs.existsSync(path.join(current, 'packages')) &&
      fs.existsSync(path.join(current, 'docs'))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return startDir;
    }
    current = parent;
  }
}

async function generateOpenApiSpec() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = configureApp(app);

  const repoRoot = findRepoRoot(__dirname);
  const targetPath = path.join(repoRoot, 'docs', 'api', 'openapi.json');

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(document, null, 2), 'utf8');
  console.log(`[OpenAPI] Spécification écrite avec succès dans : ${targetPath}`);
  await app.close();
}

generateOpenApiSpec().catch((err) => {
  console.error('[OpenAPI] Échec de génération :', err);
  process.exit(1);
});
