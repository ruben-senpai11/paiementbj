# Rapport de Sécurité et Conformité Réglementaire — Paiement BJ

**Date :** 11 novembre 2026  
**Audience :** Direction Technique, Régulateur Bancaire (BCEAO), Autorité de Protection des Données (APDP)  
**Classification :** Document Technique Public  

---

## 1. Cadre Réglementaire et Choix Structurants

### 1.1. Instruction BCEAO n°001-01-2024 (Services de Paiement et Interopérabilité)
Paiement BJ repose sur une décision architecturale non négociable : **aucun compte de monnaie électronique, aucun solde interne (`wallet_balance` / `wallet_ledger` absents), aucun dépôt et aucun compte de cantonnement propre**.

1. Les fonds restent conservés chez les émetteurs de monnaie électronique (EME) agréés ou banques commerciales.
2. Les paiements ne deviennent `SUCCEEDED` qu'après confirmation vérifiée par l'adaptateur prestataire ou par webhook signé HMAC-SHA256.
3. Les couloirs PI-SPI et cartes bancaires internationales restent explicitement en statut d'attente d'homologation tant que les conventions partenaires font défaut.

### 1.2. Protection des Données Personnelles (Loi APDP n°2017-20 / Code du Numérique)
1. **Minimisation des données** : Seul le numéro E.164 (`+229`) est requis pour créer un compte Niveau 1. Aucun modèle biométrique brut n'est transmis ou stocké côté serveur (`expo-local-authentication` reste strictement local au terminal).
2. **Preuve de consentement** : La case de consentement CGU / APDP doit être cochée explicitement avant demande d'OTP, puis horodatée côté serveur dans `consent_records` (`GET/POST /v1/auth/consents`).
3. **Gestion des sessions et révocation** : L'usager liste et révoque individuellement ses appareils autorisés (`GET /v1/auth/sessions`, `POST /v1/auth/sessions/revoke`).
4. **Droit à l'effacement** : Parcours explicite `POST /v1/auth/account/delete-request` exigeant la saisie de `"SUPPRIMER"`, clôturant l'accès tout en archivant les traces comptables obligatoires.

---

## 2. Mesures de Durcissement Applicatif & Backend (OWASP ASVS / MASVS)

| Domaine | Exigence de Sécurité | Implémentation Effectuée dans Paiement BJ |
| :--- | :--- | :--- |
| **Génération OTP & Brute-Force** | Code imprévisible et protection anti-abus | Génération OTP par `crypto.randomInt(100000, 1000000)`, expiration 180s, max 5 essais, comparaison `crypto.timingSafeEqual`, limitation de débit HTTP `429` par numéro et IP (`apps/api/src/modules/auth/`). |
| **Isolation des Secrets JWT** | Séparation usagers vs opérateurs admin & fail-closed prod | Deux gardes distinctes (`JwtAuthGuard` avec `actorType === 'USER'` vs `AdminJwtAuthGuard` avec `actorType === 'ADMIN'`) et utilitaire `getJwtAccessSecret()` interdisant tout démarrage en `NODE_ENV=production` sans secret `JWT_ACCESS_SECRET` >= 32 octets. |
| **Hachage Mots de Passe Admin** | Résistance aux attaques par dictionnaire / matériel | Hachage `scrypt` avec sel aléatoire 16 octets et comparaison temps constant (`verifyPasswordScrypt`), zéro mot de passe en dur dans le code client `apps/admin`. |
| **Validation Systématique** | Rejet des charges utiles malformées | Validation Zod sur les contrôleurs API interceptée par `ZodExceptionFilter` (HTTP `400` structuré sans fuite de stacktrace). |
| **Contrôle d'Accès (IDOR)** | Cloisonnement des données utilisateur | Vérification stricte `intent.userId === req.user.id` et propriété des transactions, reçus, notifications et tickets support côté service. |
| **Webhooks Prestataires** | Authentification et anti-rejeu | Signature HMAC-SHA256 en temps constant sur `req.rawBody` (`x-signature`) + vérification stricte de la fenêtre temporelle `x-timestamp` <= 300s (`verifyHmacWebhook`). |
| **Intégrité Anti-Double Débit** | Résilience réseau et idempotence | Clé d'idempotence UUID v4 figée par tentative d'écran côté mobile (`useRef`) et indexée en unique sur `PaymentIntent.idempotencyKey`. |
| **Intégrité des Justificatifs** | Traçabilité cryptographique des reçus | Empreinte **SHA-256** calculée à l'émission du reçu officiel (`REC-BJ-YYYY-XXXXX`) après confirmation `SUCCEEDED`. |
| **En-têtes HTTP & Stockage** | Hygiène navigateur et stockage clé terminal | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` ; `Expo SecureStore` sur iOS/Android et `sessionStorage` éphémère sur Web. |
