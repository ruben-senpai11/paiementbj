import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const ROOT_DIR = path.resolve(process.cwd());
export const VERCEL_DIST_DIR = path.join(ROOT_DIR, 'vercel-dist');

export function runCommand(cmd, cwd = ROOT_DIR, extraEnv = {}) {
  console.log(`\n> [${path.relative(ROOT_DIR, cwd) || '.'}] ${cmd}`);
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
}

export function buildUnifiedVercel({ skipApiBuild = false } = {}) {
  console.log('=== PAIEMENT BJ — BUILD UNIFIÉ POUR VERCEL ===');

  if (fs.existsSync(VERCEL_DIST_DIR)) {
    fs.rmSync(VERCEL_DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(VERCEL_DIST_DIR, { recursive: true });

  // 1. Prisma Client (native + rhel-openssl-3.0.x), packages partagés et API NestJS
  if (!skipApiBuild) {
    runCommand('npx prisma generate --schema=apps/api/prisma/schema.prisma', ROOT_DIR);
    runCommand('npm run build:packages', ROOT_DIR);
    runCommand('npm run build --workspace=apps/api', ROOT_DIR);
    runCommand('npm run openapi:emit --workspace=apps/api', ROOT_DIR);
  }

  // Exposer openapi.json directement en ressource statique sur /openapi.json
  fs.copyFileSync(
    path.join(ROOT_DIR, 'docs', 'api', 'openapi.json'),
    path.join(VERCEL_DIST_DIR, 'openapi.json')
  );

  // 2. Landing Page App Distribution -> racine (/)
  const webTempOut = path.join(ROOT_DIR, 'apps', 'web', 'dist-vercel');
  if (fs.existsSync(webTempOut)) {
    fs.rmSync(webTempOut, { recursive: true, force: true });
  }
  const landingEnv = {
    VITE_WEB_APP_URL: process.env.VITE_WEB_APP_URL || '/app',
  };
  runCommand('npx tsc --noEmit', path.join(ROOT_DIR, 'apps', 'web'), landingEnv);
  runCommand(
    'npx vite build --outDir dist-vercel --emptyOutDir',
    path.join(ROOT_DIR, 'apps', 'web'),
    landingEnv
  );
  fs.cpSync(webTempOut, VERCEL_DIST_DIR, { recursive: true });
  fs.rmSync(webTempOut, { recursive: true, force: true });

  // 3. Application Citoyenne Web (Expo Router) -> /app
  const appSubDir = path.join(VERCEL_DIST_DIR, 'app');
  runCommand(
    `npx expo export --platform web --output-dir "${appSubDir}" --clear`,
    path.join(ROOT_DIR, 'apps', 'mobile'),
    {
      EXPO_PUBLIC_WEB_BASE_URL: '/app',
    }
  );

  // 4. Back-Office Administrateur RBAC -> /admin
  const adminTempOut = path.join(ROOT_DIR, 'apps', 'admin', 'dist-vercel');
  if (fs.existsSync(adminTempOut)) {
    fs.rmSync(adminTempOut, { recursive: true, force: true });
  }
  runCommand('npx tsc --noEmit', path.join(ROOT_DIR, 'apps', 'admin'));
  runCommand(
    'npx vite build --base=/admin/ --outDir dist-vercel --emptyOutDir',
    path.join(ROOT_DIR, 'apps', 'admin')
  );
  fs.cpSync(adminTempOut, path.join(VERCEL_DIST_DIR, 'admin'), { recursive: true });
  fs.rmSync(adminTempOut, { recursive: true, force: true });

  console.log(`\nBuild unifié Vercel assemblé dans : ${VERCEL_DIST_DIR}`);
  return VERCEL_DIST_DIR;
}

const isEntrypoint =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  buildUnifiedVercel();
}
