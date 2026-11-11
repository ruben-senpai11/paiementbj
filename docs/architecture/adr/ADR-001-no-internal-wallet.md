# ADR-001 : Absence de Portefeuille Électronique Interne (Aucun Solde Paiement BJ)

**Statut :** Accepté et Structurant  
**Date :** 10 novembre 2026  
**Auteurs :** Équipe d'Architecture Paiement BJ  

---

## 1. Contexte
Dans le cadre de la centralisation des paiements au Bénin (factures d'eau, d'électricité, démarches publiques et achats courants), une option classique consiste à créer un portefeuille (wallet) propre à l'application dans lequel l'utilisateur déposerait de l'argent avant de payer.

## 2. Décision
**Paiement BJ ne crée aucun portefeuille interne, ne détient aucun fonds utilisateur et n'émet aucune monnaie électronique.**
- Le modèle de données Prisma (`schema.prisma`) interdit formellement toute table de type `wallet_balances`, `wallet_ledger` ou compte de cantonnement propre.
- Les fonds des citoyens demeurent exclusivement auprès de leurs prestataires d'origine (MTN MoMo, Moov Money, Celtiis Cash, Banques commerciales).
- Paiement BJ agit exclusivement comme une couche d'interopérabilité, d'orchestration technique et de centralisation de l'historique et des justificatifs.

## 3. Conséquences et Avantages
- **Conformité BCEAO** : Évite l'assimilation à un Établissement de Monnaie Électronique (EME) ou à un établissement bancaire, tout en respectant l'Instruction n°001-01-2024 pour l'initiation technique et l'agrégation d'interfaces.
- **Sécurité financière** : Zéro risque de détournement, de faillite de conservation ou d'attaque sur un solde centralisé.
- **Simplicité d'usage** : L'utilisateur paie directement depuis son compte mobile money ou bancaire habituel sans devoir recharger un portefeuille intermédiaire.
