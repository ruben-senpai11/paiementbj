# Inventaire Fonctionnel & État d’Avancement — Paiement BJ

Ce document recense de manière strictement honnête chaque module, écran et connecteur de **Paiement BJ** en distinguant ce qui est **entièrement implémenté et vérifié**, ce qui fonctionne sur **configuration Bac à sable / stockage session**, et ce qui reste **en attente d’une convention ou homologation partenaire externe**.

---

## 1. Domaines Backend (`apps/api`)

| Domaine / Module | Ce qui est Implémenté & Vérifié | Dépendances Externes / Mode Dégradé Honnête |
| :--- | :--- | :--- |
| **Authentication & Sessions** | OTP 6 chiffres CSPRNG (`crypto.randomInt`), comparaison `timingSafeEqual`, limitation de débit (`HTTP 429` par téléphone & IP), expiration 180s, max 5 tentatives, tokens JWT signés, `DeviceSession` avec révocation d'appareil, détection fail-closed des secrets JWT en `NODE_ENV=production`. | `SMS_PROVIDER=sandbox` en dev/test ; en `production`, nécessite `SMS_PROVIDER=http_webhook` + `SMS_GATEWAY_URL` + clé API agrégateur SMS. |
| **Users, Profile & APDP** | Profil citoyen minimal (numéro E.164 `+229`), mise à jour coordonnées facultatives et préférences accessibilité/langue (`PATCH /v1/auth/profile`), registre horodaté `ConsentRecord`, demande d'effacement formelle (`POST /v1/auth/account/delete-request` avec confirmation `"SUPPRIMER"`). | Conservation des écritures transactionnelles soumise aux délais comptables légaux BCEAO. |
| **Identity (ANIP / NPI)** | Modèle évolutif à 4 niveaux (`LEVEL_0_ANONYMOUS` à `LEVEL_3_ENHANCED`) transparent pour l'usager. | Vérification NPI / ANIP (`LEVEL_2`) bloquée honnêtement en attente de convention ANIP et d'autorisation APDP. |
| **ServiceCatalog** | Catalogue officiel béninois (SBEE ISAGO, SONEB, Trésor Public Timbres, ANIP CIP, CANAL+, Celtiis Fibre), champs dynamiques par service, recherche & filtrage, surcharge de statut gouvernance via back-office. | Nécessite PostgreSQL pour la persistance inter-redémarrage ; catalogue officiel chargé en mémoire si base non démarrée. |
| **Providers (`PaymentProviderAdapter`)** | Interface commune (`getCapabilities`, `getAvailability`, `validatePayment`, `getPaymentQuote`, `createPaymentSession`, `verifyPaymentStatus`, `handleVerifiedWebhook`, `initiateRefund`), barème transparent XOF, vérification dynamique des variables `.env`, HMAC-SHA256 temps constant + anti-rejeu 5 min. | `MTN_MOMO` s'active si `MTN_MOMO_SUBSCRIPTION_KEY` + `MTN_MOMO_API_USER` + `MTN_MOMO_API_KEY` sont fournis ; `MOOV_MONEY`, `CELTIIS_CASH`, `BANK_CARD`, `TRESOR_PAY` retournent `UNAVAILABLE` si non configurés. |
| **PaymentOrchestration** | Calcul de devis (`POST /v1/payments/quote`), pré-validation (`POST /v1/payments/validate`), création d'intention idempotente (`POST /v1/payments/intents`, clé UUID v4), blocage HTTP `503` sur services non conventionnés (`PENDING_AGREEMENT` / `UNAVAILABLE`), tentative de débit (`POST /v1/payments/attempts`), webhook signé idempotent (`POST /v1/payments/webhooks/:provider`), contrôle IDOR strict. | Sans serveur PostgreSQL actif localement, un stockage mémoire de session réel (jamais pré-rempli de fausses opérations) prend le relais. |
| **Transactions & Receipts** | Historique strictement isolé par utilisateur (`GET /v1/transactions`), émission de reçu officiel `REC-BJ-YYYY-...` avec signature cryptographique **SHA-256** uniquement sur confirmation `SUCCEEDED`. | Reçus générés dès confirmation partenaire ; sinon statut honnête « En attente d'émission ». |
| **Notifications** | Alertes in-app générées à l'exécution lors des confirmations/échecs de paiement et réponses du support (`GET /v1/notifications`, `PATCH /v1/notifications/:id/read`). | Envoi Push FCM/APNs et SMS transactionnels dépendants des passerelles mobiles de production. |
| **Support & Litiges** | Création de dossiers rattachables à une transaction, fil de messages usager <-> agent (`POST /v1/support/tickets/:id/messages`), résolution par le back-office avec notification et trace d'audit. | File d'escalade opérateur temps réel à connecter au centre d'appel. |
| **Audit & Compliance** | Journalisation `AuditLog` systématique (connexions citoyen/admin, intentions, tentatives, webhooks, changements catalogue, support, demandes APDP). | Export SIEM / archivage WORM à brancher lors du déploiement souverain. |
| **Admin RBAC Back-Office API** | Authentification dédiée (`POST /v1/admin/login`, hachage `scrypt` + sel aléatoire + `timingSafeEqual`), garde `AdminJwtAuthGuard` distinct des jetons citoyens, statistiques consolidées, supervision transactions, mise à jour catalogue, résolution support, lecture audit. | Nécessite soit des enregistrements `AdminUser` en PostgreSQL, soit `ADMIN_BOOTSTRAP_EMAIL` + `ADMIN_BOOTSTRAP_PASSWORD_HASH` en `.env`. |

---

## 2. Applications Client (`apps/mobile` & `apps/admin`)

| Surface | Écrans / Modules Livrés | État Réel |
| :--- | :--- | :--- |
| **App Mobile & Web (`apps/mobile`)** | Accueil, Catalogue & Recherche, Détail & Formulaire dynamique par service, Choix prestataire + Devis temps réel + Validation, Écran confirmation USSD/Redirection hébergée, Activité & Reçu SHA-256 + Partage natif, Profil, Sessions/Appareils révocables, Identité ANIP & Consentements APDP, Préférences FR/EN + Accessibilité WCAG AAA (`reducedMotion`, `largeFont`) + Effacement APDP, Support & FAQ, Transferts PI-SPI (état honnête), Tourisme/Diaspora (état honnête). | Export statique Web Expo vérifié localement ; typecheck `0` erreur ; `expo-doctor` configuré SDK 58 ; exécution native Android APK / iOS IPA non compilée sur ce poste Windows sans Android SDK / macOS Xcode (profils `eas.json` fournis). |
| **Console Admin (`apps/admin`)** | Écran de connexion RBAC sans mot de passe en dur, Vue d'ensemble KPI + santé réelle des passerelles (zéro fallback fictif), Supervision transactions avec filtres de statut, Gouvernance catalogue (changement de statut persisté), Traitement des réclamations, Piste d'audit LBC-FT / APDP. | Compilation `tsc --noEmit && vite build` vérifiée avec succès. |

---

## 3. Ce Qui Reste Explicitement Hors Scope Simulé (Conformité)

- **Portefeuille interne / Solde Paiement BJ** : volontairement **absent** de toute base de données, API ou interface (Instruction BCEAO n°001-01-2024).
- **Transferts interopérables PI-SPI & Paiement par carte internationale** : documentés et balisés en interface avec statut honnête `En homologation` tant que les certificats BCEAO PI-SPI / acquéreur PCI DSS ne sont pas attribués.
- **Vérification automatique NPI / Biométrie serveur ANIP** : non simulée ; en attente d'interconnexion homologuée ANIP.
