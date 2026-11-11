# Paiement BJ — Plateforme d'Interopérabilité et de Centralisation des Paiements au Bénin

> **Signature :** *Tous vos paiements, simplement.*

Paiement BJ est une application mobile multiplateforme (**1. Android**, **2. iOS**, **3. Web**) accompagnée de son backend modulaire NestJS, de sa spécification OpenAPI et de sa console d'administration RBAC. Elle permet aux citoyens, résidents, entreprises et membres de la diaspora de rechercher, préparer, exécuter et suivre leurs paiements courants et démarches administratives depuis une interface unifiée, sécurisée et conforme **WCAG 2.2 AAA**.

---

## 1. Décision Structurante : Zéro Portefeuille Interne & Zéro Donnée Fictive

1. **Aucun portefeuille électronique Paiement BJ** : L'application ne crée pas de monnaie électronique, ne gère aucun solde utilisateur et ne conserve aucun dépôt. Les fonds demeurent chez les opérateurs Mobile Money, banques ou établissements émetteurs habilités (conformité stricte avec l'**Instruction BCEAO n°001-01-2024**).
2. **Zéro donnée fictive** : Le produit ne contient ni fausses transactions, ni soldes imaginaires, ni comptes simulés. Lorsqu'un service ou prestataire ne dispose pas encore de convention ou de clés API valides, un état d'indisponibilité honnête est retourné (`HTTP 503` / statut explicite).

---

## 2. Architecture du Monorepo

```text
paiementbj/
├── apps/
│   ├── mobile/          # Application mobile & web (Expo SDK 58, Expo Router, React Native 0.88)
│   ├── api/             # Backend REST & Orchestration (NestJS, Prisma ORM, PostgreSQL 18, OpenAPI)
│   └── admin/           # Console d'administration RBAC (React + Vite, 100% typée)
├── packages/
│   ├── types/           # Interfaces TypeScript partagées (User, ServiceItem, PaymentIntent, Receipt...)
│   ├── shared/          # Logique métier pure (+229 Bénin 8/10 chiffres, FCFA, contraste WCAG AAA)
│   ├── schemas/         # Schémas de validation Zod stricts (entrées/sorties)
│   ├── ui/              # Design System institutionnel WCAG 2.2 AAA (Outfit + DM Sans, largeFont)
│   ├── api-client/      # Client HTTP fortement typé réutilisé par mobile et admin
│   └── config/          # Configurations partagées
├── assets/
│   └── brands/          # Logos officiels téléchargés et embarqués localement (zéro CDN à l'exécution)
├── tests/               # Tests domaine, intégration HTTP API, contrastes AAA et règles métier
└── docs/
    ├── DESIGN_SYSTEM.md             # Charte, jetons WCAG AAA, typographie et catalogue de composants
    ├── FEATURE_INVENTORY.md         # État honnête de chaque module et dépendance externe
    ├── BRAND_ASSETS.md              # Inventaire légal et sources des logos
    ├── TESTING_REPORT.md            # Compte-rendu factuel des vérifications exécutées
    ├── DEPLOYMENT.md                # Procédures de déploiement API, Admin, EAS Android/iOS et Web
    ├── api/openapi.json             # Spécification OpenAPI 3.0 générée automatiquement
    ├── architecture/                # Architecture technique et ADR
    ├── accessibility/               # Matrice d'audit WCAG 2.2 AAA
    ├── security/                    # Rapport de sécurité OWASP MASVS / BCEAO / APDP
    └── integrations/                # État des connecteurs partenaires
```

---

## 3. Prérequis Techniques

- **Node.js** : v22 LTS ou supérieure (vérifié sur Node v24.12.0)
- **npm** : v10 ou supérieure
- **PostgreSQL** : v16+ / v18 (optionnel pour démarrage API en session mémoire, obligatoire en production)
- **Android Studio / Xcode / EAS CLI** (pour compiler les binaires mobiles natifs)

---

## 4. Installation et Démarrage Rapide

### Étape 1 : Installation et compilation des paquets partagés

```bash
npm install --legacy-peer-deps
npm run build:packages
```

### Étape 2 : Configuration des variables d'environnement

Copiez le modèle sans secrets et adaptez vos secrets locaux (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD_HASH`, clés Sandbox partenaires) :

```bash
cp .env.example .env
```

Pour générer un hash `scrypt` administrateur compatible avec `ADMIN_BOOTSTRAP_PASSWORD_HASH` :

```bash
node -e "const c=require('crypto'); const s=c.randomBytes(16).toString('hex'); const h=c.scryptSync('VotreMotDePasseFort', s, 64).toString('hex'); console.log('scrypt:' + s + ':' + h);"
```

### Étape 3 : Base de données (PostgreSQL + Prisma)

```bash
npx prisma generate --schema=apps/api/prisma/schema.prisma
npx prisma migrate dev --schema=apps/api/prisma/schema.prisma
npm run prisma:seed --workspace=apps/api
```

### Étape 4 : Lancement des applications

1. **Démarrer le Backend API (Port 4000 & Swagger OpenAPI)** :
   ```bash
   npm run dev:api
   ```
   - API REST : `http://localhost:4000/v1`
   - Documentation Swagger : `http://localhost:4000/api/docs`
   - Régénérer le contrat statique `docs/api/openapi.json` : `npm run openapi:emit --workspace=apps/api`

2. **Démarrer le Back-Office Administrateur (Port 3001)** :
   ```bash
   npm run dev:admin
   ```

3. **Démarrer l'Application Mobile & Web (Expo)** :
   ```bash
   npm run dev:mobile
   ```
   - Appuyez sur `a` pour Android, `i` pour iOS ou `w` pour la version Web.

---

## 5. Tests, Typecheck et Builds

```bash
npm run build:packages
npm run typecheck
npm run build
npm test
```

---

## 6. Livrables et Documentation Complémentaire

- [Système de Design & Tokens WCAG AAA](./docs/DESIGN_SYSTEM.md)
- [Inventaire Honnête des Fonctionnalités](./docs/FEATURE_INVENTORY.md)
- [Registre des Logos et Marques](./docs/BRAND_ASSETS.md)
- [Matrice de Conformité Accessibilité WCAG 2.2 AAA](./docs/accessibility/WCAG_AAA_AUDIT.md)
- [Rapport de Sécurité OWASP / BCEAO / APDP](./docs/security/SECURITY_REPORT.md)
- [Registre des Connecteurs Partenaires](./docs/integrations/CONNECTORS.md)
- [Architecture Technique & ADR](./docs/architecture/ARCHITECTURE.md)
- [Rapport de Tests Exécutés](./docs/TESTING_REPORT.md)
- [Guide de Déploiement](./docs/DEPLOYMENT.md)
- [Spécification OpenAPI JSON](./docs/api/openapi.json)
