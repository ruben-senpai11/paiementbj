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
