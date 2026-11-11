# Registre Officiel des Connecteurs et État d'Intégration — Paiement BJ

Ce document détaille l'état technique et contractuel effectif de chaque intégration partenaire, conformément à la règle stricte : **« Ne simule jamais leur fonctionnement. Présente un état indisponible honnête à l'utilisateur. »**

---

## 1. Mécanisme Dynamique d’Activation des Connecteurs

Contrairement à une activation statique en dur, chaque adaptateur implémentant [`PaymentProviderAdapter`](../../apps/api/src/modules/providers/interfaces/provider-adapter.interface.ts) évalue dynamiquement ses variables d'environnement à chaque appel (`getAvailability()`, `validatePayment()`, `getPaymentQuote()`, `createPaymentSession()`, `verifyPaymentStatus()`, `handleVerifiedWebhook()`) :

- Si les clés techniques requises sont absentes, l'adaptateur retourne `availability: 'UNAVAILABLE'` et refuse tout débit (`createPaymentSession()` retourne `status: 'FAILED'` avec un message explicite).
- Tout webhook entrant sur `POST /v1/payments/webhooks/:provider` vérifie en temps constant (`crypto.timingSafeEqual`) la signature HMAC-SHA256 (`x-signature`) sur le corps brut et la fenêtre temporelle `x-timestamp` (maximum **300 secondes**) avant de conclure une transaction et d'émettre le reçu SHA-256.

---

## 2. Matrice des Connecteurs Financiers (Moyens de Paiement)

| Opérateur / Prestataire | Code Technique | Variables d'Activation Requises | Statut Sans Clés | Capacités Réelles du Contrat | Dépendances & Actions Requises |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MTN Mobile Money Bénin** | `MTN_MOMO` | `MTN_MOMO_SUBSCRIPTION_KEY`, `MTN_MOMO_API_USER`, `MTN_MOMO_WEBHOOK_SECRET` (optionnel : `MTN_MOMO_API_KEY`, `MTN_MOMO_ENVIRONMENT`) | **UNAVAILABLE** (Honnête) | Débit direct USSD (`requestToPay`), Devis, Validation, Webhook HMAC, Vérification de statut | Convention commerciale MTN Bénin + identifiants API Collection (Sandbox / Production). |
| **Moov Money Bénin** | `MOOV_MONEY` | `MOOV_MONEY_API_KEY`, `MOOV_MONEY_MERCHANT_ID`, `MOOV_MONEY_WEBHOOK_SECRET` | **UNAVAILABLE** (Honnête) | Débit direct push USSD (*155#), Devis, Webhook HMAC, Statut | Convention cadre avec Moov Africa Bénin et mise à disposition des clés marchands. |
| **Celtiis Cash Bénin** | `CELTIIS_CASH` | `CELTIIS_CASH_API_KEY`, `CELTIIS_CASH_WEBHOOK_SECRET` (optionnel : `CELTIIS_CASH_MERCHANT_ID`) | **UNAVAILABLE** (Honnête) | Débit compte monnaie électronique Celtiis, Devis, Webhook HMAC, Statut | Convention d'interconnexion technique avec la Société Béninoise d'Infrastructures Numériques (SBIN). |
| **Cartes Bancaires (Visa / Mastercard)** | `BANK_CARD` | `CARD_GATEWAY_SECRET_KEY`, `CARD_GATEWAY_CHECKOUT_URL`, `CARD_GATEWAY_WEBHOOK_SECRET` | **UNAVAILABLE** (Honnête) | Parcours hébergé 3D-Secure (`redirectUrl`), Devis, Remboursement, Webhook HMAC | Convention d'acquisition monétique avec une banque commerciale agréée UEMOA et conformité PCI DSS. |
| **Trésor Pay Bénin** | `TRESOR_PAY` | `TRESOR_PUBLIC_API_KEY`, `TRESOR_PUBLIC_WEBHOOK_SECRET` (optionnel : `TRESOR_PUBLIC_ENDPOINT`) | **UNAVAILABLE** (Honnête) | Redirection portail officiel Trésor (`redirectUrl`), Devis, QR Code, Webhook HMAC | Habilitation formelle de la Direction Générale du Trésor et de la Comptabilité Publique (MEF Bénin). |

---

## 3. Matrice des Connecteurs de Services Publics et Facturiers

| Service / Organisme | Code Service | Nature du Service | Statut Catalogue Initial | Références Client Requises | Action Avant Production |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SBEE • Compteurs ISAGO** | `sbee_prepaye` | Électricité prépayée | `SANDBOX_CONNECTED` | Numéro de compteur (11 ou 12 chiffres), Montant | Validation de l'API de délivrance des codes de recharge de la SBEE. |
| **Trésor Public • Timbres** | `tresor_timbre` | Timbres fiscaux dématérialisés | `SANDBOX_CONNECTED` | Valeur unitaire, Quantité | Homologation du module de génération de QR code officiel Trésor. |
| **SONEB • Eau Potable** | `soneb_facture` | Facture d'eau | `PENDING_AGREEMENT` (Bloqué) | Numéro de police client, Référence facture | Protocole d'accord de télérecouvrement SONEB à finaliser. |
| **ANIP • Certificat CIP** | `anip_certificat` | Certificat d'identification NPI | `PENDING_AGREEMENT` (Bloqué) | Numéro Personnel d'Identification (NPI) | Autorisation préalable APDP et convention d'interconnexion ANIP. |
| **CANAL+ Bénin** | `canal_reabonnement` | Réabonnement télévision | `PENDING_AGREEMENT` (Bloqué) | Numéro de décodeur / carte (14 chiffres) | Agrément distributeur télépaiement CANAL+ Afrique. |
| **Celtiis • Fibre Internet** | `celtiis_fibre` | Renouvellement abonnement fibre | `PENDING_AGREEMENT` (Bloqué) | Code d'abonné Fibre (ex: `CL-987654`) | Finalisation de l'interconnexion de facturation SBIN / Celtiis. |

---

## 4. Règle de Blocage Côté Serveur & Mobile

- Côté mobile/web, tout service dont le statut vaut `PENDING_AGREEMENT` ou `UNAVAILABLE` affiche un avertissement explicite et désactive la progression du paiement.
- Côté API (`POST /v1/payments/intents`), le serveur vérifie indépendamment le statut du service dans le catalogue (y compris les surcharges administrateur) et rejette toute tentative avec **HTTP 503 Service Unavailable** si le service n'est pas habilité.
- Si aucun prestataire n'est opérationnel, l'interface bloque le bouton de validation (`UNAVAILABLE`), et un appel direct à `POST /v1/payments/attempts` journalise un échec honnête (`status: 'FAILED'`) avec le motif exact de non-disponibilité sans jamais simuler un `SUCCEEDED` ; de même, tout webhook appelé sans secret configuré rejette la requête avec **HTTP 503**.
