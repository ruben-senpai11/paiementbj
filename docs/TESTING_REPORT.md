# Rapport de Tests et de Vérification — Paiement BJ

**Date de vérification :** 11 novembre 2026  
**Environnement d’exécution :** Windows, Node.js `v24.12.0`, npm workspaces (`apps/*`, `packages/*`)

Ce document consigne exclusivement les résultats réellement exécutés et observés après les dernières modifications de code du dépôt, sans extrapolation ni résultat simulé.

---

## 1. Synthèse des Commandes Exécutées

| Vérification | Commande Exécutée | Résultat | Détails Observés |
| :--- | :--- | :--- | :--- |
| **Build & Export Multi-Cibles** | `npm run export:apps` (`node scripts/export-apps.mjs`) | **Succès (code `0`)** | Build `@paiementbj/types`, `shared`, `schemas`, `api-client`, `api`, `admin` (`44` modules Vite), génération [openapi.json](api/openapi.json), export Expo Web (`91` fichiers, `6.28 Mo`), bundles Metro/Hermes OTA Android/iOS (`61` fichiers, `13.57 Mo`), API NestJS (`99` fichiers) et [MANIFEST.json](../exports/MANIFEST.json). |
| **Vérification de Typage Globale** | `npm run typecheck` | **Succès (code `0`)** | `tsc --noEmit` réussi sans erreur sur l’ensemble des **8 workspaces** (`packages/types`, `packages/shared`, `packages/schemas`, `packages/api-client`, `packages/ui`, `apps/mobile`, `apps/api`, `apps/admin`). |
| **Génération OpenAPI 3.0** | `npm run openapi:emit --workspace=apps/api` | **Succès (code `0`)** | Spécification écrite dans [openapi.json](api/openapi.json). |
| **Suite Complète Unitaires + HTTP** | `npm test` (`node --test tests/run-tests.mjs tests/unit-domain.test.ts tests/api-integration.test.ts`) | **Succès (`18/18` réussis, `0` échec, `0` ignoré)** | Durée totale observée : `35 658 ms` (voir détail ci-dessous). |
| **Vérification Visuelle Navigateur Réel** | `node scripts/verify-visual.mjs` | **Succès (`12/12` écrans `PASS`)** | Exécution sur Google Chrome headless (`390x844` mobile et `1440x900` desktop) connectée aux artefacts exportés dans `exports/` + API compilée : zéro exception JS, zéro erreur HTTP, zéro image cassée, `overflowX=0` sur les 12 vues (Web Citoyen, Back-Office Admin authentifié & Swagger UI). |
| **Diagnostic Expo SDK 58** | `npx expo-doctor` (dans `apps/mobile`) | **Succès (`20/20` contrôles)** | Aucun avertissement ou erreur de configuration détecté (`20/20 checks passed`). |

---

## 2. Détail des `18` Tests Automatisés (`npm test`)

### 2.1. Audit Statique, Actifs Locaux, Architecture & Contraste ([run-tests.mjs](../tests/run-tests.mjs)) — `5/5`
1. **Actifs de marque locaux (`13` fichiers)** : vérification d’existence et de taille non nulle dans `assets/brands/` (zéro ressource chargée à distance).
2. **Interdiction portefeuille interne (Prisma)** : absence garantie de `wallet_balance`, `wallet_ledger`, `internal_balance` ; présence vérifiée des modèles `PaymentIntent` (`idempotencyKey`), `Receipt` et `AuditLog`.
3. **Contraste mathématique WCAG 2.2 AAA (`>= 7.0:1`)** : vérification de 9 paires de couleurs principales et sémantiques (`#123B2F`, `#064B32`, `#003F2B`, `#384C42`, `#43574E`, `#0A522E`, `#8A1919`, `#6B3B00`).
4. **Hygiène `.env.example`** : absence de clé de production (`sk_live_`) et présence de la configuration Sandbox.
5. **Présence documentaire** : validation des 9 documents d’architecture, sécurité, accessibilité et connecteurs requis.

### 2.2. Tests Unitaires Domaine, Schémas Zod & Sécurité ([unit-domain.test.ts](../tests/unit-domain.test.ts)) — `9/9`
1. Normalisation téléphonique Bénin : format historique 8 chiffres MTN (`+2290197123456`).
2. Normalisation téléphonique Bénin : nouveau plan ARCEP 10 chiffres `01` Moov (`+2290195001122`).
3. Normalisation téléphonique Bénin : format international `+229` Celtiis (`+2290140112233`).
4. Rejet de numéro invalide / incomplet (`12345`).
5. Formatage monétaire UEMOA (`formatFCFA`, `formatCurrency` EUR).
6. Vérification programmatique `calculateContrastRatio()` sur les 8 paires critiques UI (`ratio >= 7.0`, `passesWcagAAANormal === true`).
7. Validation stricte des schémas Zod `@paiementbj/schemas` (`VerifyOtpSchema`, `CreatePaymentIntentSchema`, `PaymentQuoteSchema`, `CreatePaymentAttemptSchema`, `CreateSupportTicketSchema` incluant `pi_<uuid>`, `RequestAccountDeletionSchema` imposant `"SUPPRIMER"`).
8. Vérification `verifyHmacWebhook()` : signature valide HMAC-SHA256 acceptée, rejet de charge utile falsifiée (`INVALID_HMAC_SIGNATURE`), rejet hors fenêtre anti-rejeu `> 300s` (`TIMESTAMP_OUT_OF_WINDOW`), rejet sans secret (`WEBHOOK_SECRET_NOT_CONFIGURED`).
9. Hachage `hashPasswordScrypt()` / `verifyPasswordScrypt()` et mécanisme *fail-closed* `getJwtAccessSecret()` en `NODE_ENV=production`.

### 2.3. Tests d’Intégration HTTP Réels NestJS ([api-integration.test.ts](../tests/api-integration.test.ts)) — `4/4`
Exécutés sur une instance HTTP NestJS réelle (`NestFactory.create(AppModule, { rawBody: true })`) écoutant sur port éphémère loopback `127.0.0.1:0` avec base PostgreSQL intentionnellement non connectée (activation vérifiée des repliements mémoire sans données fictives) :

1. **OpenAPI, En-têtes HTTP & Catalogue** : `/api/docs-json` valide, en-têtes `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, filtrage `/v1/services?q=SBEE`.
2. **État Indisponible Honnête (0 clé API partenaire)** : les 5 prestataires sur `GET /v1/payments/providers` répondent `UNAVAILABLE`, `POST /v1/payments/intents` sur `srv_soneb_facture` (`PENDING_AGREEMENT`) échoue en **HTTP 503**, `POST /v1/payments/attempts` journalise `status: 'FAILED'` sans jamais simuler de confirmation, et `POST /v1/payments/webhooks/MTN_MOMO` sans secret répond **HTTP 503**.
3. **Auth OTP, Anti-Spam 429, Zod 400, Sessions & APDP** : rejet Zod `400`, limitation de débit OTP déclenchée à la 6ᵉ requête (**HTTP 429**), multi-session + révocation d’appareil, mise à jour profil & accessibilité (`PATCH /v1/auth/profile`), consentements horodatés (`POST/GET /v1/auth/consents`).
4. **Parcours End-to-End Paiement + Webhook HMAC + Reçu SHA-256 + Support + Admin RBAC** :
   - Activation dynamique bac à sable `MTN_MOMO` (`OPERATIONAL`) tout en conservant `MOOV_MONEY` en `UNAVAILABLE`.
   - Calcul de devis (`5 000 FCFA` + `50 FCFA` de frais opérateur, `platformFee = 0`), validation préalable et création d’intention idempotente (`idempotencyKey` UUID).
   - Blocage IDOR **HTTP 403** lorsqu’un second utilisateur tente de réutiliser la clé d’idempotence ou de consulter le statut d’un tiers.
   - Reçu bloqué en **HTTP 404** tant que le paiement n’est pas confirmé.
   - Rejet **HTTP 401** des webhooks non signés ou expirés (`-600s`), acceptation du webhook HMAC-SHA256 signé -> transition `SUCCEEDED`, idempotence au rejeu (`idempotent: true`), délivrance du reçu `REC-BJ-...` avec empreinte `SHA-256` (64 hex) et notification citoyenne.
   - Dépôt de réclamation support rattachée à `pi_<uuid>`.
   - Isolation Back-Office RBAC : unauthenticated **HTTP 401**, jeton citoyen rejeté **HTTP 403**, mauvais mot de passe **HTTP 401**, connexion `scrypt` valide, statistiques `volumeTotal === 5050`, résolution de ticket, audit logs, suspension dynamique de service (`UNAVAILABLE` bloquant immédiatement en **HTTP 503** puis rétablissement), et demande de suppression APDP (`SUPPRIMER` -> **HTTP 202**).

---

## 3. Périmètre Non Testé en Environnement Local (À Valider en Pré-Production)

Conformément à la transparence technique requise, les éléments suivants n’ont **pas** été exécutés dans cet environnement de développement :

1. **Migrations Prisma et seed sur PostgreSQL 18 / Redis réels** : aucun serveur PostgreSQL ou Redis actif n’étant provisionné sur ce poste, les migrations (`prisma migrate deploy`) et l’exécution SQL réelle n’ont pas été lancées contre une instance persistante. Les tests d’intégration valident la couche API et le fallback mémoire de session ; une passe complète contre PostgreSQL 18 doit être réalisée avant mise en production.
2. **Binaires natifs Android / iOS (`eas build`)** : aucune compilation EAS cloud ni installation sur émulateur Android / simulateur iOS (nécessitant macOS Xcode pour iOS et le SDK Android local ou EAS Build) n’a été effectuée.
3. **Audit d’accessibilité sur terminaux réels (TalkBack / VoiceOver)** : la conformité WCAG 2.2 AAA a été vérifiée sur les contrastes colorimétriques, le dimensionnement `>= 48dp` et la prise en charge de `largeFont` / `reducedMotion` dans le code et les bundles, mais n’a pas fait l’objet d’une revue manuelle sur lecteur d’écran physique Android/iOS.
4. **Appels réseau réels vers les API sandbox partenaires** : aucun jeu de clés API officielles (MTN MoMo, Moov Money, Celtiis Cash, acquéreur cartes bancaires, Trésor Pay, passerelle SMS ARCEP) n’ayant été fourni, aucune requête HTTP sortante vers des serveurs partenaires externes n’a été exécutée.
