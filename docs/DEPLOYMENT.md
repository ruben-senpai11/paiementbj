# Guide de Déploiement en Production — Paiement BJ

Ce document décrit les procédures de build, de durcissement et de déploiement pour l'ensemble du monorepo Paiement BJ : API Backend (`apps/api`), Console d'Administration (`apps/admin`), et Application Mobile Android / iOS & Web (`apps/mobile`).

---

## 1. Architecture de Déploiement Cible

- **API Backend (`apps/api`)** : Service Node.js 22+ LTS derrière un reverse-proxy HTTPS/TLS 1.3 (Nginx ou Traefik). Base PostgreSQL 18 hébergée conformément aux exigences de résidence et de confidentialité.
- **Back-Office Administrateur (`apps/admin`)** : Fichiers statiques générés (`apps/admin/dist/`) servis via HTTPS avec restriction réseau opérateur (VPN / liste blanche IP).
- **Application Mobile Android & iOS (`apps/mobile`)** : Compilée via EAS Build selon `apps/mobile/eas.json` et signée avec les certificats officiels de l'opérateur.
- **Version Web Universelle (`apps/mobile/dist`)** : Export statique Metro (`npx expo export --platform web`) servi en HTTPS avec en-têtes CSP stricts.

---

## 2. Configuration Obligatoire de Production (`apps/api`)

L'API échoue au démarrage (*fail-closed*) si les exigences de sécurité suivantes ne sont pas réunies en `NODE_ENV=production` :

1. **Secrets JWT distincts & robustes** :
   - Définir `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` (minimum 32 octets aléatoires chacun). Aucun secret par défaut n'est toléré en `NODE_ENV=production` (`getJwtAccessSecret()`).
2. **Passerelle SMS réelle** :
   - Ne jamais déployer `SMS_PROVIDER=sandbox` en production. Configurer `SMS_PROVIDER` (ex: `local_telecom`, `infobip`, `twilio`) ainsi que `SMS_API_KEY` (et `SMS_API_SECRET` selon l'opérateur) pour la délivrance des OTP. Aucun `devOtpCode` n'est exposé en `NODE_ENV=production`.
3. **Accès Administrateur RBAC** :
   - Créer des comptes `AdminUser` hashés en base ou configurer `ADMIN_BOOTSTRAP_EMAIL` et `ADMIN_BOOTSTRAP_PASSWORD_HASH` (format `scrypt$<saltHex>$<hashHex>` généré par `hashPasswordScrypt()`).
4. **Secrets de Webhooks et URLs Prestataires (HMAC-SHA256)** :
   - Configurer les secrets dédiés (`MTN_MOMO_WEBHOOK_SECRET`, `MOOV_MONEY_WEBHOOK_SECRET`, `CELTIIS_CASH_WEBHOOK_SECRET`, `CARD_GATEWAY_WEBHOOK_SECRET`, `TRESOR_PUBLIC_WEBHOOK_SECRET`) pour valider `x-signature` et la fenêtre anti-rejeu `x-timestamp` (<= 300s). Définir `CARD_GATEWAY_CHECKOUT_URL` et `TRESOR_PUBLIC_ENDPOINT` pour les redirections hébergées.
5. **Base de données PostgreSQL & Migrations** :
   ```bash
   npx prisma generate --schema=apps/api/prisma/schema.prisma
   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   npm run prisma:seed --workspace=apps/api
   ```

---

## 3. Build & Exécution API + Admin

```bash
npm install --legacy-peer-deps
npm run build:packages
npm run build
npm run start:prod --workspace=apps/api
```

- L'application Admin statique est produite dans `apps/admin/dist/` avec `VITE_API_URL` configuré sur l'URL publique HTTPS de l'API (ex: `https://api.paiement.bj/v1`).

---

## 4. Build Mobile Android & iOS (EAS) et Export Web

Les profils (`development`, `preview`, `production`) sont configurés dans `apps/mobile/eas.json` :

- **APK Android de recette (Preview)** :
  ```bash
  cd apps/mobile
  EXPO_PUBLIC_API_URL=https://api-staging.paiement.bj/v1 npx eas build -p android --profile preview
  ```
- **AAB Android Google Play Store (Production)** :
  ```bash
  cd apps/mobile
  EXPO_PUBLIC_API_URL=https://api.paiement.bj/v1 npx eas build -p android --profile production
  ```
- **IPA iOS App Store (Production)** :
  ```bash
  cd apps/mobile
  EXPO_PUBLIC_API_URL=https://api.paiement.bj/v1 npx eas build -p ios --profile production
  ```
- **Export statique Web Universel** :
  ```bash
  cd apps/mobile
  npx expo export --platform web --output-dir dist
  ```

---

## 5. Déploiement sur Vercel (Serveur Backend + Landing App Distribution + Apps)

Le monorepo est configuré pour fonctionner sur Vercel selon deux architectures complémentaires :

### Option A — Projet Vercel Services unifié (recommandé — `vercel.json` à la racine)

Le fichier `vercel.json` à la racine déclare quatre services indépendants (`services`) orchestrés au sein d'un seul projet Vercel et routés sur un domaine unique via `rewrites` :

| Service (`services.<nom>`) | Répertoire `root` | Chemins publics (`rewrites`) | Rôle & Configuration Vercel |
| :--- | :--- | :--- | :--- |
| `web` | `apps/web` | `/(.*)` (catch-all final) | Landing **App Distribution** Vite (`build:vercel`, `VITE_WEB_APP_URL=/app` par défaut) |
| `mobile` | `apps/mobile` | `/app`, `/app/(.*)` | Application citoyenne **Web** Expo (`build:vercel`, `EXPO_PUBLIC_WEB_BASE_URL=/app`) |
| `admin` | `apps/admin` | `/admin`, `/admin/(.*)` | Console **Admin RBAC** Vite (`build:vercel --base=/admin/`, `noindex`) |
| `api` | `apps/api` | `/v1`, `/v1/(.*)`, `/api`, `/api/(.*)`, `/healthz` | Backend **NestJS** (`framework: "nestjs"`, `entrypoint: "src/main.ts"`) |

- **Bindings inter-services** : Aucun service frontend ne possède de fonction serveur / SSR effectuant des appels backend côté serveur ; `web`, `admin` et `mobile` s'exécutent dans le navigateur et consomment l'API publique sur le même domaine (`/v1`). Par conséquent, aucun bloc `bindings` n'est activé tant que les frontends restent statiques.
- **Test local unifié** : Exécuter `vercel dev` à la racine pour démarrer les 4 services ensemble avec le routage complet (`http://localhost:3000/`, `/app`, `/admin`, `/v1`). En mode passerelle locale `/app` ou `/admin`, `apps/mobile` et `apps/admin` basculent automatiquement sur `/v1`.
- **Bundle autonome précompilé (`exports/paiementbj-vercel/`)** : Pour déployer un bundle déjà buildé sans mode `services` (via `api/index.js` + `public/`), exécuter :
  ```bash
  npm run export:apps
  cd exports/paiementbj-vercel && vercel --prod
  ```


### Option B — Déploiements séparés (4 projets Vercel dédiés)

Chaque application possède son propre `vercel.json` dans `apps/<app>/` ainsi que son export autonome dans `exports/` :

1. **Serveur Backend API (`apps/api` ou `exports/paiementbj-api`)** — Root Directory : `apps/api`
   - Point d'entrée Serverless : `apps/api/api/index.js` -> `dist/src/vercel.js` (`bodyParser: false` pour préserver `rawBody` HMAC-SHA256)
   - Routes publiques : `/`, `/v1/health`, `/v1/*`, `/api/docs`, `/api/docs-json`
2. **Landing Page App Distribution (`apps/web` ou `exports/paiementbj-distribution`)** — Root Directory : `apps/web`
   - Variables optionnelles : `VITE_PLAY_STORE_URL`, `VITE_APP_STORE_URL`, `VITE_WEB_APP_URL`
3. **Application Citoyenne Web (`apps/mobile` ou `exports/paiementbj-web`)** — Root Directory : `apps/mobile`
   - Variable obligatoire en mode séparé : `EXPO_PUBLIC_API_URL=https://<backend>.vercel.app/v1`
4. **Console d'Administration RBAC (`apps/admin` ou `exports/paiementbj-admin`)** — Root Directory : `apps/admin`
   - Variable obligatoire en mode séparé : `VITE_API_URL=https://<backend>.vercel.app/v1`

### Variables d'environnement Vercel obligatoires pour le Backend (`apps/api` / racine)

- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL managé Vercel Postgres / Neon / Supabase — Prisma génère `native` + `rhel-openssl-3.0.x`)
- `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` (>= 32 caractères aléatoires distincts ; fail-closed si absents)
- `SMS_PROVIDER` (`local_telecom` / `infobip` / `twilio`) + `SMS_API_KEY` (ne jamais laisser `sandbox` en production publique)
- `CORS_ORIGINS` (ex. `https://paiementbj.vercel.app,https://app.paiement.bj,https://admin.paiement.bj`)
- `ADMIN_BOOTSTRAP_EMAIL` et `ADMIN_BOOTSTRAP_PASSWORD_HASH` (si aucun compte `AdminUser` n'est encore créé en base)
- Secrets webhooks HMAC (`MTN_MOMO_WEBHOOK_SECRET`, `MOOV_MONEY_WEBHOOK_SECRET`, `CELTIIS_CASH_WEBHOOK_SECRET`, `CARD_GATEWAY_WEBHOOK_SECRET`, `TRESOR_PUBLIC_WEBHOOK_SECRET`)

