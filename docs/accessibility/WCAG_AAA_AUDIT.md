# Matrice d'Audit et de Conformité Accessibilité — WCAG 2.2 AAA

**Projet :** Paiement BJ  
**Niveau visé :** WCAG 2.2 Niveau AAA  
**Date de mise à jour :** 11 novembre 2026  
**Référentiel :** W3C Web Content Accessibility Guidelines (WCAG) 2.2  

---

## 1. Synthèse de Conception (A11y by Design)

Paiement BJ applique le principe d'**accessibilité universelle par conception** afin d'inclure les usagers sur smartphones d'entrée de gamme, les personnes âgées, les personnes malvoyantes ou daltoniennes, et les citoyens peu familiers du numérique.

---

## 2. Matrice des Critères WCAG 2.2 AAA Vérifiés dans le Code

| Critère WCAG 2.2 | Intitulé | Implémentation Vérifiable dans le Code | Statut |
| :--- | :--- | :--- | :--- |
| **1.1.1** (A) | Contenu non textuel | Tous les `BrandLogo` disposent d'un `accessibilityRole="image"` + `accessibilityLabel` complet et d'un fallback texte lisible. Icônes décoratives vectorielles `lucide-react-native` accompagnées de labels textuels. | **Implémenté** |
| **1.4.1** (A) | Utilisation de la couleur | `StatusBadge` associe un glyphe distinctif (`✓`, `⏳`, `✕`), un libellé textuel en français et des couleurs calibrées. | **Implémenté** |
| **1.4.4** (AA) | Redimensionnement texte | `maxFontSizeMultiplier={2.0}` sur `AppText` + réglage applicatif interactif **Texte agrandi (+18 %)** propagé via `AccessibilityPreferencesProvider`. | **Implémenté** |
| **1.4.6** (AAA) | Contraste renforcé (>= 7.0:1) | Palette vérifiée mathématiquement par script automatisé (`tests/run-tests.mjs` & `tests/unit-domain.test.ts`), incluant boutons désactivés (`#2E3E37` sur `#E2EAE3` sans opacité atténuée) et Console Admin (`#384C42`, `#6B3B00`, `#0A522E`, `#8A1919`). | **Vérifié par calcul sRGB** |
| **1.4.8** (AAA) | Présentation visuelle | Alignement à gauche non justifié, interlignes 1.4x–1.5x, défilement vertical unique mobile et tableaux scrollables sur Admin. | **Implémenté** |
| **1.4.11** (AA) | Contraste composants UI | Bordures `#D8E2DA`, focus `#003F2B`, anneau focus clavier Web `3px solid #FFC52C` dans `apps/admin/index.html`. | **Implémenté** |
| **2.1.1 / 2.1.2** (A) | Accessibilité clavier | Formulaire Admin avec `<label htmlFor=...>`, `<th scope="col">`, `aria-current="page"`, navigation sans piège de focus. | **Implémenté** |
| **2.2.1** (A) | Délais réglables | Compte à rebours visible OTP (`180 s`) avec bouton de renvoi SMS explicite. | **Implémenté** |
| **2.3.3** (AAA) | Animation sur interaction | Réglage système `AccessibilityInfo.isReduceMotionEnabled()` + bascule explicite **Réduire les animations** (`animation: 'none'` sur le routeur Stack). | **Implémenté** |
| **2.4.8 / 2.4.9** (AAA) | Localisation & Lien explicite | `StepIndicator` (« Étape X sur 3 ») sur tout tunnel de paiement ; boutons d'action à intitulés univoques. | **Implémenté** |
| **2.5.5** (AAA) | Cible tactile (>= 44x44 / 48 dp) | Constante `layout.minTouchTarget = 48` imposée sur `PrimaryButton` (`54 dp`), `SecondaryButton`, `Checkbox`, onglets et contrôles Web Admin (`minHeight: 40–48px`). | **Implémenté** |
| **3.3.1 / 3.3.2** (A) | Erreurs & étiquettes | Labels persistants placés **au-dessus** de chaque champ et messages d'erreur reliés via `accessibilityRole="alert"`. | **Implémenté** |
| **3.3.8 / 3.3.9** (AA/AAA) | Authentification accessible | Aucun CAPTCHA visuel/énigme cognitive ; collage OTP autorisé et vérification par SMS. | **Implémenté** |

---

## 3. Relevé Mathématique Automatisé des Ratios sRGB

Formule W3C officielle `(L1 + 0.05) / (L2 + 0.05)` exécutée dans `tests/run-tests.mjs` et `tests/unit-domain.test.ts` :

| Paire Premier Plan / Fond | Hex Premier Plan | Hex Fond | Ratio Exact Calculé | Seuil AAA | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Texte principal / Fond clair | `#123B2F` | `#F5F8F4` | **11.59 : 1** | >= 7.0 : 1 | **VALIDE** |
| Texte principal / Carte blanche | `#123B2F` | `#FFFFFF` | **12.41 : 1** | >= 7.0 : 1 | **VALIDE** |
| Texte blanc / Bouton primaire | `#FFFFFF` | `#064B32` | **10.19 : 1** | >= 7.0 : 1 | **VALIDE** |
| Texte blanc / En-tête Hero | `#FFFFFF` | `#003F2B` | **12.03 : 1** | >= 7.0 : 1 | **VALIDE** |
| Texte secondaire / Blanc | `#384C42` | `#FFFFFF` | **8.83 : 1** | >= 7.0 : 1 | **VALIDE** |
| Texte atténué / Fond clair | `#43574E` | `#F5F8F4` | **7.18 : 1** | >= 7.0 : 1 | **VALIDE** |
| Texte désactivé / Fond désactivé | `#2E3E37` | `#E2EAE3` | **9.07 : 1** | >= 7.0 : 1 | **VALIDE** |
| Succès / Badge vert pâle | `#0A522E` | `#E6F4EC` | **8.61 : 1** | >= 7.0 : 1 | **VALIDE** |
| Erreur / Badge rouge pâle | `#8A1919` | `#FCE8E8` | **7.46 : 1** | >= 7.0 : 1 | **VALIDE** |
| Attention / Badge ambre clair | `#6B3B00` | `#FFF4D6` | **8.11 : 1** | >= 7.0 : 1 | **VALIDE** |

---

## 4. Note sur la Validation sur Terminaux Physiques

Les contrôles statiques, mathématiques et structurels (`accessibilityLabel`, `accessibilityRole`, cibles `minHeight: 48`, focus ring, contrastes) ont été vérifiés sur le code source et par tests automatisés. Un passage manuel complet sous **Android TalkBack** et **iOS VoiceOver** sur terminaux réels reste requis lors de la phase de recette QA avant publication sur les stores.
