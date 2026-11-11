import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT_DIR, VERCEL_DIST_DIR, buildUnifiedVercel, runCommand } from './build-vercel.mjs';

const EXPORTS_DIR = path.join(ROOT_DIR, 'exports');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function folderStats(dirPath) {
  let fileCount = 0;
  let totalBytes = 0;
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        fileCount += 1;
        totalBytes += fs.statSync(full).size;
      }
    }
  }
  walk(dirPath);
  return { fileCount, totalBytes };
}

/**
 * Copie les packages workspace compilés (@paiementbj/types, shared, schemas)
 * avec des liens file: locaux pour rendre un export backend déployable hors monorepo.
 */
function copyStandalonePackages(targetPackagesDir) {
  const pkgNames = ['types', 'shared', 'schemas'];
  fs.mkdirSync(targetPackagesDir, { recursive: true });

  for (const pkgName of pkgNames) {
    const srcPkgDir = path.join(ROOT_DIR, 'packages', pkgName);
    const destPkgDir = path.join(targetPackagesDir, pkgName);
    fs.mkdirSync(destPkgDir, { recursive: true });
    fs.cpSync(path.join(srcPkgDir, 'dist'), path.join(destPkgDir, 'dist'), { recursive: true });

    const pkgJson = JSON.parse(fs.readFileSync(path.join(srcPkgDir, 'package.json'), 'utf8'));
    if (pkgJson.dependencies) {
      for (const depName of Object.keys(pkgJson.dependencies)) {
        if (depName.startsWith('@paiementbj/')) {
          const shortName = depName.replace('@paiementbj/', '');
          pkgJson.dependencies[depName] = `file:../${shortName}`;
        }
      }
    }
    delete pkgJson.scripts;
    writeJson(path.join(destPkgDir, 'package.json'), pkgJson);
  }
}

/**
 * Génère un package.json autonome pour un serveur API Vercel / Node
 * sans dépendance au registre npm pour les packages privés @paiementbj/*.
 */
function writeStandaloneApiPackageJson(targetPath, { packagesRelPrefix, prismaSchemaFlag = '' }) {
  const apiPkg = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'apps', 'api', 'package.json'), 'utf8')
  );
  const deps = { ...(apiPkg.dependencies || {}) };
  for (const depName of Object.keys(deps)) {
    if (depName.startsWith('@paiementbj/')) {
      const shortName = depName.replace('@paiementbj/', '');
      deps[depName] = `file:./${packagesRelPrefix}/${shortName}`;
    }
  }
  const prismaGenerateCmd = prismaSchemaFlag
    ? `prisma generate ${prismaSchemaFlag}`
    : 'prisma generate';

  writeJson(targetPath, {
    name: 'paiementbj-api-deploy',
    version: apiPkg.version || '1.0.0',
    private: true,
    scripts: {
      build: prismaGenerateCmd,
      postinstall: prismaGenerateCmd,
      start: prismaSchemaFlag ? 'node apps/api/dist/src/main.js' : 'node dist/src/main.js',
    },
    dependencies: deps,
    engines: {
      node: '>=20.0.0',
    },
  });
}

function buildStandaloneStaticVercelConfig(sourceVercelPath, extra = {}) {
  const sourceCfg = JSON.parse(fs.readFileSync(sourceVercelPath, 'utf8'));
  return {
    $schema: sourceCfg.$schema || 'https://openapi.vercel.sh/vercel.json',
    framework: null,
    ...(sourceCfg.cleanUrls ? { cleanUrls: true } : {}),
    headers: sourceCfg.headers || [],
    rewrites: sourceCfg.rewrites || [],
    ...extra,
  };
}

function main() {
  console.log('=== PAIEMENT BJ — GÉNÉRATION ET EXPORT DES APPLICATIONS ===');

  if (fs.existsSync(EXPORTS_DIR)) {
    fs.rmSync(EXPORTS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });

  // 1. Génération Prisma, build packages, API NestJS, Admin Vite & App Distribution Vite
  runCommand('npx prisma generate --schema=apps/api/prisma/schema.prisma', ROOT_DIR);
  runCommand('npm run build', ROOT_DIR);
  runCommand('npm run openapi:emit --workspace=apps/api', ROOT_DIR);

  // 2. Export Web Citoyen statique autonome (/)
  const webExportDir = path.join(EXPORTS_DIR, 'paiementbj-web');
  runCommand(
    `npx expo export --platform web --output-dir "${webExportDir}" --clear`,
    path.join(ROOT_DIR, 'apps', 'mobile')
  );
  writeJson(
    path.join(webExportDir, 'vercel.json'),
    buildStandaloneStaticVercelConfig(path.join(ROOT_DIR, 'apps', 'mobile', 'vercel.json'))
  );

  // 3. Export Bundles Natifs Android & iOS Metro/Expo (JS/assets précompilés, non signés .apk/.ipa)
  const mobileBundlesDir = path.join(EXPORTS_DIR, 'paiementbj-mobile-ota-bundles');
  runCommand(
    `npx expo export --platform android --platform ios --output-dir "${mobileBundlesDir}" --clear`,
    path.join(ROOT_DIR, 'apps', 'mobile')
  );

  // 4. Copie du Back-Office Admin compilé (Vite + TypeScript) + vercel.json autonome
  const adminExportDir = path.join(EXPORTS_DIR, 'paiementbj-admin');
  fs.cpSync(path.join(ROOT_DIR, 'apps', 'admin', 'dist'), adminExportDir, { recursive: true });
  writeJson(
    path.join(adminExportDir, 'vercel.json'),
    buildStandaloneStaticVercelConfig(path.join(ROOT_DIR, 'apps', 'admin', 'vercel.json'))
  );

  // 5. Copie du Portail de Distribution Stores (Play Store + App Store landing) + vercel.json autonome
  const distPortalExportDir = path.join(EXPORTS_DIR, 'paiementbj-distribution');
  fs.cpSync(path.join(ROOT_DIR, 'apps', 'web', 'dist'), distPortalExportDir, { recursive: true });
  writeJson(
    path.join(distPortalExportDir, 'vercel.json'),
    buildStandaloneStaticVercelConfig(path.join(ROOT_DIR, 'apps', 'web', 'vercel.json'))
  );

  // 6. Assemblage du Serveur API Backend autonome (Vercel Serverless + Node classique)
  const apiExportDir = path.join(EXPORTS_DIR, 'paiementbj-api');
  fs.mkdirSync(path.join(apiExportDir, 'api'), { recursive: true });
  fs.cpSync(path.join(ROOT_DIR, 'apps', 'api', 'dist'), path.join(apiExportDir, 'dist'), {
    recursive: true,
  });
  fs.cpSync(path.join(ROOT_DIR, 'apps', 'api', 'prisma'), path.join(apiExportDir, 'prisma'), {
    recursive: true,
  });
  fs.copyFileSync(
    path.join(ROOT_DIR, 'apps', 'api', 'api', 'index.js'),
    path.join(apiExportDir, 'api', 'index.js')
  );
  copyStandalonePackages(path.join(apiExportDir, 'packages'));
  writeStandaloneApiPackageJson(path.join(apiExportDir, 'package.json'), {
    packagesRelPrefix: 'packages',
  });
  fs.copyFileSync(path.join(ROOT_DIR, '.npmrc'), path.join(apiExportDir, '.npmrc'));
  fs.copyFileSync(path.join(ROOT_DIR, '.env.example'), path.join(apiExportDir, '.env.example'));
  fs.copyFileSync(
    path.join(ROOT_DIR, 'docs', 'api', 'openapi.json'),
    path.join(apiExportDir, 'openapi.json')
  );
  fs.writeFileSync(
    path.join(apiExportDir, 'start-api.cmd'),
    '@echo off\r\ncd /d "%~dp0"\r\nnode dist\\src\\main.js\r\n',
    'utf8'
  );
  const apiSourceVercel = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'apps', 'api', 'vercel.json'), 'utf8')
  );
  writeJson(path.join(apiExportDir, 'vercel.json'), {
    $schema: apiSourceVercel.$schema,
    framework: null,
    installCommand: 'npm install --legacy-peer-deps',
    buildCommand: 'npx prisma generate',
    functions: {
      'api/index.js': {
        maxDuration: 30,
        includeFiles: '{dist/**,prisma/**,packages/**,node_modules/swagger-ui-dist/**,node_modules/.prisma/client/**}',
      },
    },
    headers: apiSourceVercel.headers,
    rewrites: apiSourceVercel.rewrites,
  });

  // 7. Export du Bundle Unifié Vercel Tout-En-Un (/, /app, /admin, /v1, /api/docs)
  buildUnifiedVercel({ skipApiBuild: true });
  const unifiedVercelExportDir = path.join(EXPORTS_DIR, 'paiementbj-vercel');
  fs.mkdirSync(path.join(unifiedVercelExportDir, 'api'), { recursive: true });
  fs.mkdirSync(path.join(unifiedVercelExportDir, 'apps', 'api'), { recursive: true });
  fs.cpSync(VERCEL_DIST_DIR, path.join(unifiedVercelExportDir, 'public'), { recursive: true });
  fs.copyFileSync(
    path.join(ROOT_DIR, 'api', 'index.js'),
    path.join(unifiedVercelExportDir, 'api', 'index.js')
  );
  fs.cpSync(
    path.join(ROOT_DIR, 'apps', 'api', 'dist'),
    path.join(unifiedVercelExportDir, 'apps', 'api', 'dist'),
    { recursive: true }
  );
  fs.cpSync(
    path.join(ROOT_DIR, 'apps', 'api', 'prisma'),
    path.join(unifiedVercelExportDir, 'apps', 'api', 'prisma'),
    { recursive: true }
  );
  copyStandalonePackages(path.join(unifiedVercelExportDir, 'packages'));
  writeStandaloneApiPackageJson(path.join(unifiedVercelExportDir, 'package.json'), {
    packagesRelPrefix: 'packages',
    prismaSchemaFlag: '--schema=apps/api/prisma/schema.prisma',
  });
  fs.copyFileSync(path.join(ROOT_DIR, '.npmrc'), path.join(unifiedVercelExportDir, '.npmrc'));
  fs.copyFileSync(
    path.join(ROOT_DIR, '.env.example'),
    path.join(unifiedVercelExportDir, '.env.example')
  );
  const rootVercel = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'vercel.json'), 'utf8'));
  writeJson(path.join(unifiedVercelExportDir, 'vercel.json'), {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    framework: null,
    cleanUrls: true,
    installCommand: 'npm install --legacy-peer-deps',
    buildCommand: 'npx prisma generate --schema=apps/api/prisma/schema.prisma',
    outputDirectory: 'public',
    functions: {
      'api/index.js': {
        maxDuration: 30,
        includeFiles: '{apps/api/dist/**,apps/api/prisma/**,packages/**,node_modules/swagger-ui-dist/**,node_modules/.prisma/client/**}',
      },
    },
    headers: rootVercel.headers,
    rewrites: [
      { source: '/v1/(.*)', destination: '/api/index.js' },
      { source: '/api/docs', destination: '/api/index.js' },
      { source: '/api/docs/(.*)', destination: '/api/index.js' },
      { source: '/api/docs-json', destination: '/api/index.js' },
      { source: '/api/docs-yaml', destination: '/api/index.js' },
      { source: '/api', destination: '/api/index.js' },
      { source: '/healthz', destination: '/api/index.js' },
      { source: '/app', destination: '/app/index.html' },
      { source: '/app/service/:id', destination: '/app/service/[id].html' },
      { source: '/app/transaction/:id', destination: '/app/transaction/[id].html' },
      { source: '/app/auth', destination: '/app/auth/index.html' },
      { source: '/app/auth/otp', destination: '/app/auth/otp.html' },
      { source: '/app/international', destination: '/app/international/index.html' },
      { source: '/app/transfers', destination: '/app/transfers/index.html' },
      { source: '/app/support', destination: '/app/support/index.html' },
      { source: '/app/support/faq', destination: '/app/support/faq.html' },
      { source: '/app/payment/confirm', destination: '/app/payment/confirm.html' },
      { source: '/app/payment/select-provider', destination: '/app/payment/select-provider.html' },
      { source: '/app/profile/devices', destination: '/app/profile/devices.html' },
      { source: '/app/profile/identity', destination: '/app/profile/identity.html' },
      { source: '/app/profile/settings', destination: '/app/profile/settings.html' },
      { source: '/app/services', destination: '/app/services.html' },
      { source: '/app/activity', destination: '/app/activity.html' },
      { source: '/app/profile', destination: '/app/profile.html' },
      { source: '/app/((?!_expo/|assets/).*)', destination: '/app/index.html' },
      { source: '/admin', destination: '/admin/index.html' },
      { source: '/admin/((?!assets/).*)', destination: '/admin/index.html' },
      { source: '/((?!v1/|api/|healthz|app|admin|assets/).*)', destination: '/index.html' },
    ],
  });

  // 8. Vérification des prérequis natifs locaux (.apk / .ipa) pour transparence du manifeste
  const androidSdkAvailable = Boolean(
    process.env.ANDROID_HOME ||
      process.env.ANDROID_SDK_ROOT ||
      (process.env.LOCALAPPDATA &&
        fs.existsSync(path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')))
  );
  const isMacOs = process.platform === 'darwin';

  const manifest = {
    generatedAt: new Date().toISOString(),
    hostPlatform: `${process.platform}-${process.arch}`,
    nodeVersion: process.version,
    exports: {
      vercelUnifiedBundle: {
        directory: 'paiementbj-vercel',
        type: 'vercel-unified-fullstack-bundle',
        entrypoint: 'paiementbj-vercel/vercel.json',
        routes: {
          landingDistribution: '/',
          citizenWebApp: '/app',
          adminBackOffice: '/admin',
          backendApi: '/v1/*',
          swaggerDocs: '/api/docs',
        },
        vercelConfigSha256: sha256File(path.join(unifiedVercelExportDir, 'vercel.json')),
        apiEntrySha256: sha256File(path.join(unifiedVercelExportDir, 'api', 'index.js')),
        ...folderStats(unifiedVercelExportDir),
      },
      webDistribution: {
        directory: 'paiementbj-distribution',
        type: 'static-web-bundle-vercel-ready',
        entrypoint: 'paiementbj-distribution/index.html',
        indexSha256: sha256File(path.join(distPortalExportDir, 'index.html')),
        vercelConfigSha256: sha256File(path.join(distPortalExportDir, 'vercel.json')),
        ...folderStats(distPortalExportDir),
      },
      webCitizen: {
        directory: 'paiementbj-web',
        type: 'static-web-bundle-vercel-ready',
        entrypoint: 'paiementbj-web/index.html',
        indexSha256: sha256File(path.join(webExportDir, 'index.html')),
        vercelConfigSha256: sha256File(path.join(webExportDir, 'vercel.json')),
        ...folderStats(webExportDir),
      },
      webAdmin: {
        directory: 'paiementbj-admin',
        type: 'static-web-bundle-vercel-ready',
        entrypoint: 'paiementbj-admin/index.html',
        indexSha256: sha256File(path.join(adminExportDir, 'index.html')),
        vercelConfigSha256: sha256File(path.join(adminExportDir, 'vercel.json')),
        ...folderStats(adminExportDir),
      },
      apiServer: {
        directory: 'paiementbj-api',
        type: 'nodejs-nestjs-vercel-serverless-ready',
        entrypoint: 'paiementbj-api/api/index.js',
        nodeEntrypoint: 'paiementbj-api/dist/src/main.js',
        mainSha256: sha256File(path.join(apiExportDir, 'dist', 'src', 'main.js')),
        vercelEntrySha256: sha256File(path.join(apiExportDir, 'api', 'index.js')),
        openApiSha256: sha256File(path.join(apiExportDir, 'openapi.json')),
        ...folderStats(apiExportDir),
      },
      mobileNativeOtaBundles: {
        directory: 'paiementbj-mobile-ota-bundles',
        type: 'expo-precompiled-js-and-assets-not-apk-ipa',
        platforms: ['android', 'ios'],
        metadataSha256: sha256File(path.join(mobileBundlesDir, 'metadata.json')),
        ...folderStats(mobileBundlesDir),
      },
    },
    unavailableNativeBinaries: {
      androidApkAab: {
        generated: false,
        reason: androidSdkAvailable
          ? 'EAS Build non authentifié pour signature.'
          : 'JDK + Android SDK (ANDROID_HOME / Gradle) absents sur ce poste Windows et session EAS non connectée.',
        howToGenerate:
          'cd apps/mobile && npx eas build -p android --profile preview (ou --local avec Android SDK + JDK 17 sur Linux/macOS/Windows).',
      },
      iosIpa: {
        generated: false,
        reason: isMacOs
          ? 'Session EAS / Xcode Signing requise.'
          : `Système hôte ${process.platform} incompatible avec la compilation iOS locale (macOS + Xcode requis) et session EAS non connectée.`,
        howToGenerate: 'cd apps/mobile && npx eas build -p ios --profile production',
      },
    },
  };

  writeJson(path.join(EXPORTS_DIR, 'MANIFEST.json'), manifest);

  const readme = `# Dossier d'Export des Livrables — Paiement BJ (Prêt pour Vercel)

Généré automatiquement le \`${manifest.generatedAt}\` depuis Node \`${manifest.nodeVersion}\` (\`${manifest.hostPlatform}\`).

## 1. Contenu du dossier \`exports/\`

| Dossier | Contenu | Statut Vercel | Fichiers | Taille |
| :--- | :--- | :--- | :--- | :--- |
| \`paiementbj-vercel/\` | Bundle unifié complet : Landing \`/\`, App Web \`/app\`, Admin \`/admin\`, API \`/v1\`, Docs \`/api/docs\` | \`vercel.json\` + Serverless prêt | ${manifest.exports.vercelUnifiedBundle.fileCount} | ${(manifest.exports.vercelUnifiedBundle.totalBytes / (1024 * 1024)).toFixed(2)} Mo |
| \`paiementbj-api/\` | Serveur Backend NestJS autonome (Serverless \`api/index.js\` + Node \`dist/src/main.js\`, Prisma + packages locaux + OpenAPI) | \`vercel.json\` + Serverless prêt | ${manifest.exports.apiServer.fileCount} | ${(manifest.exports.apiServer.totalBytes / 1024).toFixed(1)} Ko |
| \`paiementbj-distribution/\` | Landing page minimaliste Play Store / App Store (\`@paiementbj/web\`) | \`vercel.json\` + statique prêt | ${manifest.exports.webDistribution.fileCount} | ${(manifest.exports.webDistribution.totalBytes / 1024).toFixed(1)} Ko |
| \`paiementbj-web/\` | Application citoyenne Web (Expo Router + React Native Web, 23 routes statiques, rewrites dynamiques) | \`vercel.json\` + \`cleanUrls\` prêt | ${manifest.exports.webCitizen.fileCount} | ${(manifest.exports.webCitizen.totalBytes / (1024 * 1024)).toFixed(2)} Mo |
| \`paiementbj-admin/\` | Back-Office d'administration RBAC (Vite + React + TypeScript, \`noindex\`) | \`vercel.json\` + statique prêt | ${manifest.exports.webAdmin.fileCount} | ${(manifest.exports.webAdmin.totalBytes / 1024).toFixed(1)} Ko |
| \`paiementbj-mobile-ota-bundles/\` | Bundles Metro/Expo JS & actifs précompilés Android/iOS (format EAS Update / OTA, **pas** \`.apk\` ni \`.ipa\`) | Export natif JS/Assets | ${manifest.exports.mobileNativeOtaBundles.fileCount} | ${(manifest.exports.mobileNativeOtaBundles.totalBytes / (1024 * 1024)).toFixed(2)} Mo |

## 2. Déploiement rapide sur Vercel depuis \`exports/\`

### Option A — Déploiement unifié tout-en-un (1 seul projet Vercel)

\`\`\`bash
cd exports/paiementbj-vercel
vercel --prod
\`\`\`

### Option B — Déploiements séparés (1 projet Vercel par service)

\`\`\`bash
# 1. Serveur Backend partagé par toutes les apps
cd exports/paiementbj-api && vercel --prod

# 2. Landing Page App Distribution
cd exports/paiementbj-distribution && vercel --prod

# 3. Application Citoyenne Web (avec EXPO_PUBLIC_API_URL=https://<backend>.vercel.app/v1 si build depuis apps/mobile)
cd exports/paiementbj-web && vercel --prod

# 4. Console d'Administration RBAC (avec VITE_API_URL=https://<backend>.vercel.app/v1 si build depuis apps/admin)
cd exports/paiementbj-admin && vercel --prod
\`\`\`

## 3. Binaires natifs installables (\`.apk\`, \`.aab\`, \`.ipa\`) non générés sur ce poste

- **Android (\`.apk\` / \`.aab\`)** : ${manifest.unavailableNativeBinaries.androidApkAab.reason}
  - Commande : \`${manifest.unavailableNativeBinaries.androidApkAab.howToGenerate}\`
- **iOS (\`.ipa\`)** : ${manifest.unavailableNativeBinaries.iosIpa.reason}
  - Commande : \`${manifest.unavailableNativeBinaries.iosIpa.howToGenerate}\`
`;

  fs.writeFileSync(path.join(EXPORTS_DIR, 'README.md'), readme, 'utf8');
  console.log(`\nExport terminé dans : ${EXPORTS_DIR}`);
}

main();
