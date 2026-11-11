import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(process.cwd());
const EXPORTS_DIR = path.join(ROOT_DIR, 'exports');

function run(cmd, cwd = ROOT_DIR) {
  console.log(`\n> [${path.relative(ROOT_DIR, cwd) || '.'}] ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
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

function main() {
  console.log('=== PAIEMENT BJ — GÉNÉRATION ET EXPORT DES APPLICATIONS ===');

  if (fs.existsSync(EXPORTS_DIR)) {
    fs.rmSync(EXPORTS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });

  // 1. Build packages, API NestJS et Admin Vite
  run('npm run build', ROOT_DIR);
  run('npm run openapi:emit --workspace=apps/api', ROOT_DIR);

  // 2. Export Web Citoyen statique (Expo Router + React Native Web)
  const webExportDir = path.join(EXPORTS_DIR, 'paiementbj-web');
  run(
    `npx expo export --platform web --output-dir "${webExportDir}" --clear`,
    path.join(ROOT_DIR, 'apps', 'mobile')
  );

  // 3. Export Bundles Natifs Android & iOS Metro/Expo (JS/assets précompilés, non signés .apk/.ipa)
  const mobileBundlesDir = path.join(EXPORTS_DIR, 'paiementbj-mobile-ota-bundles');
  run(
    `npx expo export --platform android --platform ios --output-dir "${mobileBundlesDir}" --clear`,
    path.join(ROOT_DIR, 'apps', 'mobile')
  );

  // 4. Copie du Back-Office Admin compilé (Vite + TypeScript)
  const adminExportDir = path.join(EXPORTS_DIR, 'paiementbj-admin');
  fs.cpSync(path.join(ROOT_DIR, 'apps', 'admin', 'dist'), adminExportDir, { recursive: true });

  // 4b. Copie du Portail de Distribution Stores (Play Store + App Store landing)
  const distPortalExportDir = path.join(EXPORTS_DIR, 'paiementbj-distribution');
  fs.cpSync(path.join(ROOT_DIR, 'apps', 'web', 'dist'), distPortalExportDir, { recursive: true });

  // 5. Assemblage du package Serveur API NestJS compilé
  const apiExportDir = path.join(EXPORTS_DIR, 'paiementbj-api');
  fs.mkdirSync(apiExportDir, { recursive: true });
  fs.cpSync(path.join(ROOT_DIR, 'apps', 'api', 'dist'), path.join(apiExportDir, 'dist'), {
    recursive: true,
  });
  fs.cpSync(path.join(ROOT_DIR, 'apps', 'api', 'prisma'), path.join(apiExportDir, 'prisma'), {
    recursive: true,
  });
  fs.copyFileSync(
    path.join(ROOT_DIR, 'apps', 'api', 'package.json'),
    path.join(apiExportDir, 'package.json')
  );
  fs.copyFileSync(
    path.join(ROOT_DIR, '.env.example'),
    path.join(apiExportDir, '.env.example')
  );
  fs.copyFileSync(
    path.join(ROOT_DIR, 'docs', 'api', 'openapi.json'),
    path.join(apiExportDir, 'openapi.json')
  );
  fs.writeFileSync(
    path.join(apiExportDir, 'start-api.cmd'),
    '@echo off\r\ncd /d "%~dp0"\r\nnode dist\\src\\main.js\r\n',
    'utf8'
  );

  // 6. Vérification des prérequis natifs locaux (.apk / .ipa) pour transparence du manifeste
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
      webDistribution: {
        directory: 'paiementbj-distribution',
        type: 'static-web-bundle',
        entrypoint: 'paiementbj-distribution/index.html',
        indexSha256: sha256File(path.join(distPortalExportDir, 'index.html')),
        ...folderStats(distPortalExportDir),
      },
      webCitizen: {
        directory: 'paiementbj-web',
        type: 'static-web-bundle',
        entrypoint: 'paiementbj-web/index.html',
        indexSha256: sha256File(path.join(webExportDir, 'index.html')),
        ...folderStats(webExportDir),
      },
      webAdmin: {
        directory: 'paiementbj-admin',
        type: 'static-web-bundle',
        entrypoint: 'paiementbj-admin/index.html',
        indexSha256: sha256File(path.join(adminExportDir, 'index.html')),
        ...folderStats(adminExportDir),
      },
      apiServer: {
        directory: 'paiementbj-api',
        type: 'nodejs-nestjs-compiled',
        entrypoint: 'paiementbj-api/dist/src/main.js',
        mainSha256: sha256File(path.join(apiExportDir, 'dist', 'src', 'main.js')),
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

  fs.writeFileSync(path.join(EXPORTS_DIR, 'MANIFEST.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const readme = `# Dossier d'Export des Livrables — Paiement BJ

Généré automatiquement le \`${manifest.generatedAt}\` depuis Node \`${manifest.nodeVersion}\` (\`${manifest.hostPlatform}\`).

## Contenu du dossier \`exports/\`

| Dossier | Contenu | Statut | Fichiers | Taille |
| :--- | :--- | :--- | :--- | :--- |
| \`paiementbj-distribution/\` | Portail web minimaliste Play Store / App Store de présentation et téléchargement (\`@paiementbj/web\`) | Compilé & exporté | ${manifest.exports.webDistribution.fileCount} | ${(manifest.exports.webDistribution.totalBytes / 1024).toFixed(1)} Ko |
| \`paiementbj-web/\` | Application citoyenne Web (Expo Router + React Native Web, 23 routes statiques, actifs locaux) | Compilé & exporté | ${manifest.exports.webCitizen.fileCount} | ${(manifest.exports.webCitizen.totalBytes / (1024 * 1024)).toFixed(2)} Mo |
| \`paiementbj-admin/\` | Back-Office d'administration RBAC (Vite + React + TypeScript) | Compilé & exporté | ${manifest.exports.webAdmin.fileCount} | ${(manifest.exports.webAdmin.totalBytes / 1024).toFixed(1)} Ko |
| \`paiementbj-api/\` | API Backend NestJS compilée (\`dist/src/main.js\`), schéma Prisma et \`openapi.json\` | Compilé & exporté | ${manifest.exports.apiServer.fileCount} | ${(manifest.exports.apiServer.totalBytes / 1024).toFixed(1)} Ko |
| \`paiementbj-mobile-ota-bundles/\` | Bundles Metro/Expo JS & actifs précompilés Android/iOS (format EAS Update / OTA, **pas** \`.apk\` ni \`.ipa\`) | Exporté | ${manifest.exports.mobileNativeOtaBundles.fileCount} | ${(manifest.exports.mobileNativeOtaBundles.totalBytes / (1024 * 1024)).toFixed(2)} Mo |

## Binaires natifs installables (\`.apk\`, \`.aab\`, \`.ipa\`) non générés sur ce poste

- **Android (\`.apk\` / \`.aab\`)** : ${manifest.unavailableNativeBinaries.androidApkAab.reason}
  - Commande : \`${manifest.unavailableNativeBinaries.androidApkAab.howToGenerate}\`
- **iOS (\`.ipa\`)** : ${manifest.unavailableNativeBinaries.iosIpa.reason}
  - Commande : \`${manifest.unavailableNativeBinaries.iosIpa.howToGenerate}\`

## Règle de routage statique pour \`paiementbj-web/\`

Les routes dynamiques Expo Router (ex. \`/service/srv_sbee_prepaye\`, \`/transaction/<id>\`) s'appuient côté serveur statique sur \`/service/[id].html\` et \`/transaction/[id].html\`. En production (Nginx / Caddy), configurer la réécriture vers les fichiers HTML correspondants ou vers \`index.html\`.
`;

  fs.writeFileSync(path.join(EXPORTS_DIR, 'README.md'), readme, 'utf8');
  console.log(`\nExport terminé dans : ${EXPORTS_DIR}`);
}

main();
