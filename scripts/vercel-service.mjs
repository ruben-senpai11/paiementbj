/**
 * Lanceur multiplateforme (Windows / Linux / macOS) pour construire ou démarrer
 * les services frontends en mode Vercel Services (`web`, `admin`, `mobile`).
 */
import { createRequire } from 'module';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function resolvePackageBin(appDir, packageName) {
  const req = createRequire(path.join(appDir, 'package.json'));
  const pkgJsonPath = req.resolve(`${packageName}/package.json`);
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const binRel = typeof pkgJson.bin === 'string' ? pkgJson.bin : pkgJson.bin?.[packageName];
  if (!binRel) {
    throw new Error(`Impossible de résoudre le binaire ${packageName} depuis ${appDir}`);
  }
  return path.resolve(path.dirname(pkgJsonPath), binRel);
}

const SERVICE_RUNNERS = {
  web: {
    dir: path.join(ROOT_DIR, 'apps/web'),
    bin: 'vite',
    defaultEnv: () => ({
      VITE_WEB_APP_URL: process.env.VITE_WEB_APP_URL || '/app',
    }),
    buildArgs: () => ['build'],
    devArgs: () => ['--port', process.env.PORT || '3000'],
  },
  admin: {
    dir: path.join(ROOT_DIR, 'apps/admin'),
    bin: 'vite',
    defaultEnv: () => ({
      VITE_BASE_PATH: process.env.VITE_BASE_PATH || '/admin/',
    }),
    buildArgs: () => ['build', '--base', process.env.VITE_BASE_PATH || '/admin/', '--outDir', 'dist/admin', '--emptyOutDir'],
    devArgs: () => ['--port', process.env.PORT || '3001'],
  },
  mobile: {
    dir: path.join(ROOT_DIR, 'apps/mobile'),
    bin: 'expo',
    defaultEnv: () => ({
      EXPO_PUBLIC_WEB_BASE_URL: process.env.EXPO_PUBLIC_WEB_BASE_URL || '/app',
    }),
    buildArgs: () => ['export', '--platform', 'web', '--output-dir', 'dist/app', '--clear'],
    devArgs: () => ['start', '--web', '--port', process.env.PORT || '8081'],
  },
};

const [serviceName, mode] = process.argv.slice(2);
const runner = SERVICE_RUNNERS[serviceName];

if (!runner || (mode !== 'build' && mode !== 'dev')) {
  console.error('Usage: node scripts/vercel-service.mjs <web|admin|mobile> <build|dev>');
  process.exit(1);
}

const binPath = resolvePackageBin(runner.dir, runner.bin);
const args = mode === 'build' ? runner.buildArgs() : runner.devArgs();
const env = { ...process.env, ...runner.defaultEnv() };

const result = spawnSync(process.execPath, [binPath, ...args], {
  cwd: runner.dir,
  env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
