# Paiement BJ — Design system

Référence visuelle : capture du portail du Prix national de la simplification administrative fournie dans la conversation. Tokens repris dans `src/theme/tokens.ts`.

## Direction visuelle

Application mobile-first, institutionnelle et accessible. Le rendu reste sobre, lumineux et rassurant : vert profond, fonds vert très pâle, cartes blanches, accent jaune solaire. Éviter les dégradés décoratifs, les ombres lourdes, les couleurs criardes et les illustrations qui occupent l'espace de l'action utile.

## Couleurs

| Token | Hex | Usage |
|---|---|---|
| Primary | `#064B32` | Boutons principaux, icônes actives, éléments de marque |
| Primary deep | `#003F2B` | Hero et surfaces d'emphase |
| Text | `#123B2F` | Texte principal |
| Background | `#F5F8F4` | Fond de page |
| Background mint | `#EAF2EC` | Zones secondaires |
| Primary soft | `#E8F1EA` | Fonds d'icônes et informations |
| Surface | `#FFFFFF` | Cartes, champs, feuilles |
| Accent | `#FFC52C` | CTA secondaire et accent solaire |
| Accent soft | `#FFF4D2` | Informations et alertes non critiques |
| Muted | `#708178` | Aides et métadonnées |
| Border | `#E2EAE3` | Bordures et séparateurs |
| Success | `#1B8752` | Succès confirmé par le prestataire uniquement |
| Warning | `#B7791F` | Attente, disponibilité ou action à vérifier |
| Danger | `#C74646` | Échec ou action destructive |

## Typographie

- **Outfit** pour les titres et l'emphase (poids 400, 500, 600, 700, 800, 900 selon la hiérarchie).
- **DM Sans** pour le corps, les contrôles, les libellés et les métadonnées.
- Les deux familles sont embarquées via `@expo-google-fonts/*`; pas de dépendance à un chargement Google Fonts à l'exécution.
- Les montants affichent toujours `FCFA`.

## Grille et dimensions

- Unité de base : 4 dp.
- Espacements usuels : 4, 8, 12, 16, 24, 32 dp.
- Marges d'écran : 20 dp sur mobile.
- Champs : hauteur minimale 52 dp, rayon 10–14 dp.
- Boutons primaires : 52–56 dp, rayon 14 dp.
- Cartes : rayon 14–20 dp ; carte principale 20–26 dp.
- Zones tactiles : 44 × 44 dp minimum.
- Bordures fines ; ombre légère réservée aux cartes structurantes.

## Composants

1. `Screen` : safe area, défilement, entrée d'écran.
2. `AppText` : Outfit pour les titres, DM Sans pour l'interface selon taille/poids.
3. `PrimaryButton` : action principale, état désactivé, chargement et feedback d'appui.
4. `OutlineButton` : action secondaire.
5. `Field` : libellé visible au-dessus, saisie, placeholder explicite.
6. `Surface` : carte blanche avec bordure et ombre légère.
7. `InfoNote` : information ou alerte, accompagnée d'une icône et d'un libellé.
8. `BrandLogo` : image non déformée, conteneur neutre et fallback textuel si l'image ne charge pas.

## États obligatoires

- Default, pressed, focused, disabled, loading.
- Paiement : initiated, waiting, confirmed, failed, reversed/refunded.
- Service : available, maintenance, coming soon.
- Authentification : unverified phone, verified phone, identity pending, identity verified, step-up required.
- Ne jamais montrer un succès avant la confirmation serveur du prestataire.

## Mouvement

- Entrée écran : fade + déplacement vertical de 6–8 dp, 180–240 ms.
- Appui bouton : scale 0.985, 100–140 ms.
- Sélection opérateur : changement de bordure et d'état, 140–180 ms.
- Confirmation : apparition du symbole en 240–320 ms.
- Respecter l'option système « réduire les animations » ; aucun mouvement décoratif permanent.

## Règles de marque et logos

Les logos sont référencés dans `BRAND_ASSETS.md` et `src/data/logos.ts`. Ne jamais générer, retracer, étirer ou recolorer ces marques. Les images distantes sont des copies de travail ; la release doit utiliser les masters approuvés, auto-hébergés dans `assets/logos/` et autorisés par les détenteurs. Un logo ne constitue pas une preuve de partenariat signé.

## Accessibilité

- Contraste adapté et texte jamais communiqué uniquement par couleur.
- Libellés explicites pour lecteur d'écran et ordre de focus cohérent.
- Vocabulaire non technique, références masquées si nécessaire.
- Validation visible et messages d'erreur correctifs.
- Pas de biométrie obligatoire à chaque paiement ; authentification proportionnée au risque.
