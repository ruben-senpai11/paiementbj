# Système de Design — Paiement BJ (`@paiementbj/ui`)

**Version :** 1.0.0  
**Référentiel d'accessibilité :** W3C WCAG 2.2 Niveau AAA (contraste texte normal >= 7.0:1, cibles tactiles >= 48 dp)  
**Identité visuelle :** Institutionnelle, apaisée et souveraine — inspirée des services publics numériques modernes et des usages fintech béninois.

---

## 1. Palette de Couleurs & Contraste WCAG 2.2 AAA

Définie dans [`packages/ui/src/tokens/colors.ts`](../../packages/ui/src/tokens/colors.ts) :

| Token | Valeur Hex | Rôle Sémantique | Combinaison Vérifiée | Ratio Calculé | Seuil |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `primary` | `#064B32` | Vert institutionnel principal (actions primaires) | `#FFFFFF` sur `#064B32` | **10.19 : 1** | >= 7.0:1 (AAA) |
| `primaryDeep` | `#003F2B` | Vert profond (en-têtes Hero, barre latérale Admin, focus) | `#FFFFFF` sur `#003F2B` | **12.03 : 1** | >= 7.0:1 (AAA) |
| `primarySoft` | `#E8F1EA` | Surface d'accentuation douce | `#123B2F` sur `#E8F1EA` | **11.15 : 1** | >= 7.0:1 (AAA) |
| `background` | `#F5F8F4` | Fond général d'écran apaisant | `#123B2F` sur `#F5F8F4` | **11.59 : 1** | >= 7.0:1 (AAA) |
| `surface` | `#FFFFFF` | Cartes, formulaires et conteneurs | `#123B2F` sur `#FFFFFF` | **12.41 : 1** | >= 7.0:1 (AAA) |
| `text` | `#123B2F` | Texte principal haute lisibilité | sur `#FFFFFF` / `#F5F8F4` | **>= 11.5 : 1** | >= 7.0:1 (AAA) |
| `textSecondary` | `#384C42` | Sous-titres et libellés explicatifs | sur `#FFFFFF` / `#F5F8F4` | **>= 8.5 : 1** | >= 7.0:1 (AAA) |
| `textMuted` | `#43574E` | Horodatages et notes secondaires | sur `#FFFFFF` / `#F5F8F4` | **>= 7.23 : 1** | >= 7.0:1 (AAA) |
| `accent` | `#FFC52C` | Or solaire béninois (CTA sur fond sombre, focus ring Web) | `#003F2B` sur `#FFC52C` | **8.49 : 1** | >= 7.0:1 (AAA) |
| `success` / `successSoft` | `#0A522E` / `#E6F4EC` | Statuts confirmés (`SUCCEEDED`, `LIVE`) | `#0A522E` sur `#E6F4EC` | **8.20 : 1** | >= 7.0:1 (AAA) |
| `warning` / `warningSoft` | `#6B3B00` / `#FFF4D6` | États d'attente (`PENDING`, `PENDING_AGREEMENT`) | `#6B3B00` sur `#FFF4D6` | **8.51 : 1** | >= 7.0:1 (AAA) |
| `danger` / `dangerSoft` | `#8A1919` / `#FCE8E8` | Erreurs et états indisponibles (`FAILED`, `UNAVAILABLE`) | `#8A1919` sur `#FCE8E8` | **7.99 : 1** | >= 7.0:1 (AAA) |
| État désactivé bouton | `#2E3E37` / `#E2EAE3` | Bouton inactif sans dégradation par opacité transparente | `#2E3E37` sur `#E2EAE3` | **9.07 : 1** | >= 7.0:1 (AAA) |

---

## 2. Typographie Officielle

Définie dans [`packages/ui/src/tokens/typography.ts`](../../packages/ui/src/tokens/typography.ts) et chargée hors ligne via `@expo-google-fonts/outfit` et `@expo-google-fonts/dm-sans` :

- **`Outfit`** (titres, montants majeurs, identité de marque) : graisses `400`, `600`, `700`, `800`.
- **`DM Sans`** (corps de texte, champs, tableaux et boutons) : graisses `400`, `500`, `700`.
- **Échelle de base** :
  - `h1` : 28 pt / interligne 36 pt
  - `h2` : 22 pt / interligne 30 pt
  - `h3` : 18 pt / interligne 26 pt
  - `bodyLarge` : 18 pt / interligne 26 pt
  - `body` / `bodyMedium` : 16 pt / interligne 24 pt
  - `bodySmall` : 14 pt / interligne 20 pt
  - `caption` : 13 pt / interligne 18 pt
  - `amountDisplay` : 32 pt / interligne 40 pt avec `fontVariant: ['tabular-nums']`
- **Accessibilité dynamique** :
  - `maxFontSizeMultiplier={2.0}` autorisé sur `AppText` (WCAG 1.4.4).
  - Réglage applicatif **Texte agrandi (+18 %)** propagé en temps réel par `AccessibilityPreferencesProvider`.

---

## 3. Ergonomie, Espacements & Cibles Tactiles

Définis dans [`packages/ui/src/tokens/spacing.ts`](../../packages/ui/src/tokens/spacing.ts) :

- **Grille d'espacement** : multiple de `4 px` (`xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`, `2xl: 32`, `3xl: 48`).
- **Cible tactile minimale garantie (`minTouchTarget`)** : **`48 dp`** sur tous les boutons, liens de navigation, cartes de sélection, puces de filtre, champs OTP et cases à cocher (WCAG 2.5.5 AAA / Material Android).
- **Boutons principaux** : hauteur minimale `54 dp`.

---

## 4. Inventaire des Composants `@paiementbj/ui`

| Famille | Composants Exportés | Comportements & États Clés |
| :--- | :--- | :--- |
| **Typographie & A11y** | `AppText`, `AccessibilityPreferencesProvider` | Mise à l'échelle `largeFont` (+18 %), support lecteur d'écran |
| **Navigation & En-têtes** | `AppHeader`, `BottomNavigation`, `SectionHeader`, `StepIndicator` | Fil d'Ariane par étapes (« Étape X sur 3 »), onglets Lucide |
| **Actions & Boutons** | `PrimaryButton`, `SecondaryButton`, `TextButton`, `IconButton` | États `default`, `pressed`, `loading` (`ActivityIndicator`), `disabled` haute lisibilité |
| **Formulaires & Saisie** | `TextInput`, `PhoneInput`, `OtpInput`, `SearchInput`, `Checkbox`, `RadioButton`, `Select`, `DatePicker` | Labels persistants au-dessus du champ, aide contextuelle, erreurs `accessibilityRole="alert"`, support 8 et 10 chiffres `+229` |
| **Métier Paiement BJ** | `BrandLogo`, `StatusBadge`, `AmountDisplay`, `ServiceCard`, `ProviderCard`, `TransactionCard`, `ReceiptCard` | Logos locaux sans CDN (`assets/brands/`), glyphes + textes doublant la couleur, hash SHA-256 sur reçu |
| **Feedback & Superpositions** | `EmptyState`, `ErrorState`, `LoadingState`, `Skeleton`, `Modal`, `BottomSheet`, `Snackbar`, `AlertDialog` | États vides honnêtes, messages d'erreur actionnables, respect de `reducedMotion` |

---

## 5. Responsive Multiplateforme

- **Mobile (Android prioritaire / iOS)** : grille mono-colonne fluide (`padding: 16 dp`), barre d'onglets basse de `64 dp`, clavier numérique adapté pour OTP/montants.
- **Web Usagers (Expo Web)** : rendu unifié via `react-native-web`, conteneurs centrés lisibles (`max-width`), liens canoniques `/auth`, `/services`, `/activity`, `/profile`, boîte de dialogue de confirmation compatible navigateur.
- **Console d'Administration Web (`apps/admin`)** : grille KPI 4 colonnes -> 2 colonnes (`<= 960 px`) -> 1 colonne (`<= 600 px`), tableaux défilables horizontalement, anneau de focus `:focus-visible` `#FFC52C` (`3 px`).
