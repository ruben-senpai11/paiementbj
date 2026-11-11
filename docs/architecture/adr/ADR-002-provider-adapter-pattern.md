# ADR-002 : Isolation des Prestataires par le Modèle PaymentProviderAdapter

**Statut :** Accepté  
**Date :** 10 novembre 2026  

---

## 1. Contexte
Paiement BJ doit interopérer avec des systèmes hétérogènes : API MTN MoMo (REST JSON), Moov Money, Celtiis Cash, passerelles cartes bancaires 3D-Secure, et API Trésor Public. Chacun possède ses protocoles d'authentification, formats d'erreur et capacités.

## 2. Décision
Les connecteurs sont strictement isolés derrière une interface TypeScript unique `PaymentProviderAdapter` définie dans `apps/api/src/modules/providers/adapters/`.
Chaque prestataire expose de manière déclarative :
- `getCapabilities()` : Capacités réelles (débit direct, redirection, QR, remboursement).
- `getAvailability()` : État opérationnel réel vérifié à partir de la configuration active.
- `getPaymentQuote()` : Calcul transparent des frais.
- `createPaymentSession()` : Création de la session de débit chez le prestataire.
- `verifyPaymentStatus()` : Vérification asynchrone ou synchrone du dénouement.

## 3. Conséquences
- L'ajout d'un nouvel opérateur (ex: PI-SPI) n'exige aucune modification du cœur de l'orchestration ou de l'interface mobile.
- Garantit une honnêteté technique absolue : un adaptateur dépourvu d'identifiants renvoie `UNAVAILABLE` sans jamais simuler de faux succès.
