# Paiement BJ — MVP multiplateforme

Prototype Expo / React Native / TypeScript inspiré du portail officiel du Prix national de la simplification administrative.

## Ce qui fonctionne dans cette maquette

- Accueil et navigation mobile.
- Catalogue avec recherche et filtres.
- Fiches de services et formulaires de référence/montant.
- Sélection des moyens de paiement avec les logos de marque référencés en ligne.
- Parcours OTP simulé (`123456`).
- Résultat de paiement simulé, historique et reçu.
- Profil, vérification d'identité illustrative, aide, confidentialité, transferts et parcours international informatifs.

**Aucun paiement réel n'est exécuté et aucune intégration partenaire n'est configurée.** Les transactions initiales et les succès sont des données fictives. Ne pas publier cette maquette comme un service de paiement disponible.

## Stack

- Expo SDK 58
- React Native 0.88
- React 19.3
- TypeScript 6
- Expo Router 58
- Zustand 5
- Outfit (titres) + DM Sans (interface), chargées localement depuis les packages Google Fonts Expo
- Android prioritaire, iOS et Web depuis le même dépôt

## Démarrage

Avec Node.js 22.13 ou une version supérieure :

```bash
npm install
npx expo install --fix
npx expo-doctor
npx expo start
```

- `a` : ouvrir Android (émulateur ou appareil configuré)
- `i` : ouvrir iOS (macOS + Xcode requis)
- `w` : ouvrir Web

Les profils EAS sont décrits dans `eas.json` : `preview` génère un APK Android installable et un build iOS simulateur ; `production` prépare les builds de distribution après configuration des identifiants. Remplacer les identifiants de bundle par ceux du propriétaire réel avant tout build public. Depuis Windows 11, Android et Web peuvent être testés localement ; le build iOS de distribution passe par EAS Build dans le cloud ou par Xcode sur macOS.

## Authentification de démonstration

- Numéro : un numéro béninois à 8 chiffres.
- OTP : `123456`.
- Le jeton et la session ne sont pas réellement créés par un serveur dans cette démo.

## Structure

```text
app/                    routes Expo Router
  (tabs)/               Accueil, Services, Activité, Profil
  auth/                 Téléphone, OTP, identité
  service/              Détail d'un service
  payment/              Sélection prestataire / démonstration
  transaction/          Confirmation / reçu
src/
  components/           Composants UI réutilisables
  data/                 Catalogue et logos
  store/                Etat de démonstration
  theme/                Tokens visuels
preview/                Maquette web indépendante
  docs/                 Plan et notes d'intégration
```

## Logos

Les références d'images exactes recherchées en ligne sont centralisées dans `src/data/logos.ts` et affichées dans l'application. Elles sont distantes dans cette maquette, pas encore embarquées en local. Le registre des sources, l'état de validation et les autorisations à obtenir se trouvent dans [BRAND_ASSETS.md](./BRAND_ASSETS.md). Certaines copies sont hébergées par des tiers : obtenir les masters officiels, valider le co-branding, puis les versionner dans `assets/logos/` avant toute diffusion publique.

## Avant la première transaction réelle

1. Qualification réglementaire BCEAO du rôle de Paiement BJ et de chaque flux.
2. Conventions prestataires / administrations et sandbox.
3. Backend NestJS, PostgreSQL et webhooks signés.
4. OTP serveur, gestion sécurisée des sessions et contrôle des appareils.
5. Qualification des traitements APDP et autorisation d'usage ANIP/NPI le cas échéant.
6. Tests d'intrusion, audit de sécurité, rapprochement et procédure de remboursement.

Voir [docs/PLAN_DEVELOPPEMENT.md](./docs/PLAN_DEVELOPPEMENT.md) pour le plan produit et technique complet.
