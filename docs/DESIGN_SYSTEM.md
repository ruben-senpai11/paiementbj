# Système de Design — Paiement BJ (`@paiementbj/ui`)

**Version :** 1.0.0  
**Référentiel d'accessibilité :** W3C WCAG 2.2 Niveau AAA (contraste texte normal >= 7.0:1, cibles tactiles >= 48 dp)  
**Identité visuelle :** Institutionnelle, apaisée et souveraine — inspirée des services publics numériques modernes et des usages fintech béninois.

---

## 1. Palette de Couleurs & Contraste WCAG 2.2 AAA

Définie dans [`packages/ui/src/tokens/theme.css`](../../packages/ui/src/tokens/theme.css) et synchronisée vers [`packages/ui/src/tokens/colors.ts`](../../packages/ui/src/tokens/colors.ts) :

| Token | Valeur Hex | Rôle Sémantique | Combinaison Vérifiée | Ratio Calculé | Seuil |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `primary` | `#1746A2` | Bleu Royal principal (Hero, header, actions primaires) | `#FFFFFF` sur `#1746A2` | **8.63 : 1** | >= 7.0:1 (AAA) |
| `primaryDeep` | `#123B7A` | Bleu Royal profond (hover CTA, encre sur jaune) | `#FFFFFF` sur `#123B7A` | **10.87 : 1** | >= 7.0:1 (AAA) |
| `primarySoft` | `#EAF0FF` | Surface bleue douce et badges neutres | `#14213D` sur `#EAF0FF` | **14.00 : 1** | >= 7.0:1 (AAA) |
| `background` | `#F5F8FF` | Fond général d'écran apaisant | `#14213D` sur `#F5F8FF` | **15.03 : 1** | >= 7.0:1 (AAA) |
| `surface` | `#FFFFFF` | Cartes, formulaires et conteneurs | `#14213D` sur `#FFFFFF` | **15.97 : 1** | >= 7.0:1 (AAA) |
| `text` | `#14213D` | Texte principal Navy haute lisibilité | sur `#FFFFFF` / `#F5F8FF` | **>= 15.03 : 1** | >= 7.0:1 (AAA) |
| `textSecondary` | `#40516B` | Sous-titres et libellés explicatifs | sur `#FFFFFF` / `#F5F8FF` | **>= 7.58 : 1** | >= 7.0:1 (AAA) |
| `accent` | `#FFC928` | Jaune Accent (CTA Hero & focus) | `#123B7A` sur `#FFC928` | **7.06 : 1** | >= 7.0:1 (AAA) |
| `accentSoft` | `#FFF7D6` | Surface jaune douce | `#14213D` sur `#FFF7D6` | **14.85 : 1** | >= 7.0:1 (AAA) |
| `border` | `#7185A5` | Bordures de champs et contrôles UI | `#7185A5` sur `#FFFFFF` | **3.75 : 1** | >= 3.0:1 (AA UI) |
| `success` / `successSoft` | `#115A34` / `#E8F6EE` | Statuts confirmés (`SUCCEEDED`, `LIVE`) | `#115A34` sur `#E8F6EE` | **7.43 : 1** | >= 7.0:1 (AAA) |
| `warning` / `warningSoft` | `#654400` / `#FFF7D6` | États d'attente (`PENDING`, `PENDING_AGREEMENT`) | `#654400` sur `#FFF7D6` | **8.20 : 1** | >= 7.0:1 (AAA) |
| `danger` / `dangerSoft` | `#8B1E2D` / `#FDF0F2` | Erreurs et états indisponibles (`FAILED`, `UNAVAILABLE`) | `#8B1E2D` sur `#FDF0F2` | **8.15 : 1** | >= 7.0:1 (AAA) |

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
- **Console d'Administration Web (`apps/admin`)** : grille KPI 4 colonnes -> 2 colonnes (`<= 960 px`) -> 1 colonne (`<= 600 px`), tableaux défilables horizontalement, anneau de focus `:focus-visible` `#FFC928` (`3 px`).
