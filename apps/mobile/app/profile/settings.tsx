import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Switch, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Languages, Eye, Fingerprint, Trash2 } from 'lucide-react-native';
import {
  colors,
  layout,
  AppText,
  TextInput,
  PrimaryButton,
  SecondaryButton,
} from '@paiementbj/ui';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { api } from '../../src/services/api';
import { showNotice } from '../../src/utils/dialog';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { isAuthenticated, user, setAuth, token, logout } = useAuthStore();
  const {
    language,
    reducedMotion,
    largeFont,
    biometricEnabled,
    setLanguage,
    setReducedMotion,
    setLargeFont,
    setBiometricEnabled,
  } = useSettingsStore();

  const [firstName, setFirstName] = useState(user?.profile?.firstName || '');
  const [lastName, setLastName] = useState(user?.profile?.lastName || '');
  const [email, setEmail] = useState(user?.profile?.email || '');
  const [biometricHardwareAvailable, setBiometricHardwareAvailable] = useState<boolean | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [deleteReason, setDeleteReason] = useState('');
  const [confirmWord, setConfirmWord] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (active) {
          setBiometricHardwareAvailable(hasHardware && isEnrolled);
        }
      } catch {
        if (active) setBiometricHardwareAvailable(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleToggleBiometric = async (next: boolean) => {
    if (!next) {
      setBiometricEnabled(false);
      return;
    }
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirmer votre identité pour activer le verrouillage biométrique',
        cancelLabel: 'Annuler',
      });
      if (res.success) {
        setBiometricEnabled(true);
      } else {
        showNotice('Biométrie non validée', 'L’authentification biométrique n’a pas abouti.');
      }
    } catch {
      showNotice(
        'Capteur indisponible',
        'Ce navigateur ou appareil ne prend pas en charge la biométrie locale.'
      );
    }
  };

  const handleSavePreferences = async () => {
    if (!isAuthenticated || !user || !token) {
      showNotice('Préférences locales enregistrées', 'Vos réglages d’affichage sont actifs sur cet appareil.');
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser = await api.auth.updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        language,
        accessibilitySettings: {
          reducedMotion,
          largeFont,
          highContrast: true,
        },
      });
      await setAuth(updatedUser, token);
      showNotice('Profil mis à jour', 'Vos informations et préférences ont été sauvegardées.');
    } catch (err: any) {
      showNotice('Mise à jour impossible', err.message || 'Impossible de joindre le serveur.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }
    if (confirmWord.trim().toUpperCase() !== 'SUPPRIMER') {
      showNotice('Confirmation requise', 'Veuillez saisir exactement le mot SUPPRIMER.');
      return;
    }

    setDeleting(true);
    try {
      const res = await api.auth.requestAccountDeletion({
        confirmText: 'SUPPRIMER',
        reason: deleteReason.trim() || undefined,
      });
      showNotice('Demande enregistrée (APDP)', res.message);
      await logout();
      router.replace('/(tabs)');
    } catch (err: any) {
      showNotice('Échec de la demande', err.message || 'Impossible d’enregistrer votre demande.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Langue */}
      <View style={styles.card}>
        <View style={styles.sectionHead}>
          <Languages size={20} color={colors.primaryDeep} />
          <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.sectionTitle}>
            LANGUE DE L’INTERFACE
          </AppText>
        </View>
        <View style={styles.langRow}>
          <Pressable
            onPress={() => setLanguage('fr')}
            style={[styles.langBtn, language === 'fr' && styles.langBtnActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: language === 'fr' }}
          >
            <AppText
              variant="bodySmall"
              color={language === 'fr' ? colors.textOnPrimary : colors.text}
              style={styles.bold}
            >
              Français (Officiel)
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setLanguage('en')}
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: language === 'en' }}
          >
            <AppText
              variant="bodySmall"
              color={language === 'en' ? colors.textOnPrimary : colors.text}
              style={styles.bold}
            >
              English
            </AppText>
          </Pressable>
        </View>
      </View>

      {/* Accessibilité WCAG 2.2 AAA */}
      <View style={styles.card}>
        <View style={styles.sectionHead}>
          <Eye size={20} color={colors.primaryDeep} />
          <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.sectionTitle}>
            ACCESSIBILITÉ NUMÉRIQUE (WCAG 2.2 AAA)
          </AppText>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchMeta}>
            <AppText variant="bodySmall" color={colors.text} style={styles.bold}>
              Réduire les animations
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Désactive les transitions animées entre écrans.
            </AppText>
          </View>
          <Switch
            value={reducedMotion}
            onValueChange={setReducedMotion}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            accessibilityLabel="Réduire les animations"
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchMeta}>
            <AppText variant="bodySmall" color={colors.text} style={styles.bold}>
              Texte agrandi (+18 %)
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Augmente la taille des textes pour faciliter la lecture.
            </AppText>
          </View>
          <Switch
            value={largeFont}
            onValueChange={setLargeFont}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            accessibilityLabel="Texte agrandi"
          />
        </View>
      </View>

      {/* Sécurité biométrique locale */}
      <View style={styles.card}>
        <View style={styles.sectionHead}>
          <Fingerprint size={20} color={colors.primaryDeep} />
          <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.sectionTitle}>
            VÉRIFICATION BIOMÉTRIQUE LOCALE
          </AppText>
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchMeta}>
            <AppText variant="bodySmall" color={colors.text} style={styles.bold}>
              Verrouillage empreinte / Face ID
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {biometricHardwareAvailable === null
                ? 'Vérification du capteur matériel...'
                : biometricHardwareAvailable
                ? 'Capteur matériel détecté et prêt.'
                : 'Aucun capteur biométrique configuré sur cet environnement.'}
            </AppText>
          </View>
          <Switch
            value={biometricEnabled}
            disabled={!biometricHardwareAvailable}
            onValueChange={handleToggleBiometric}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            accessibilityLabel="Verrouillage biométrique"
          />
        </View>
      </View>

      {/* Coordonnées facultatives & sauvegarde */}
      {isAuthenticated && (
        <View style={styles.card}>
          <AppText variant="bodyMedium" color={colors.primaryDeep} style={[styles.sectionTitle, styles.mb12]}>
            COORDONNÉES DE CONTACT (FACULTATIF)
          </AppText>
          <TextInput label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Ex: Codjo" />
          <TextInput label="Nom" value={lastName} onChangeText={setLastName} placeholder="Ex: Mensah" />
          <TextInput
            label="Adresse e-mail (pour vos justificatifs)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="nom@exemple.bj"
          />
          <PrimaryButton
            label="Enregistrer mes préférences"
            onPress={handleSavePreferences}
            loading={savingProfile}
          />
        </View>
      )}

      {!isAuthenticated && (
        <PrimaryButton
          label="Enregistrer les réglages locaux"
          onPress={handleSavePreferences}
          style={styles.mb16}
        />
      )}

      {/* Suppression compte APDP */}
      {isAuthenticated && (
        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.sectionHead}>
            <Trash2 size={20} color={colors.danger} />
            <AppText variant="bodyMedium" color={colors.danger} style={styles.sectionTitle}>
              EXERCER MON DROIT À L’EFFACEMENT (APDP)
            </AppText>
          </View>
          <AppText variant="caption" color={colors.textSecondary} style={styles.dangerDesc}>
            Conformément à la Loi APDP n°2017-20, la suppression ferme votre accès usager tout en conservant les justificatifs comptables légaux exigés par la réglementation financière.
          </AppText>
          <TextInput
            label="Motif (facultatif)"
            value={deleteReason}
            onChangeText={setDeleteReason}
            placeholder="Ex: Changement de numéro"
          />
          <TextInput
            label="Tapez SUPPRIMER pour confirmer"
            value={confirmWord}
            onChangeText={setConfirmWord}
            autoCapitalize="characters"
            placeholder="SUPPRIMER"
          />
          <SecondaryButton
            label="Demander la suppression du compte"
            onPress={handleDeleteAccount}
            loading={deleting}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layout.screenPaddingMobile,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
  },
  dangerCard: {
    borderColor: colors.danger,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mb12: {
    marginBottom: 12,
  },
  mb16: {
    marginBottom: 16,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    borderRadius: layout.borderRadius.sm,
    backgroundColor: colors.backgroundMint,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  langBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDeep,
  },
  bold: {
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  switchMeta: {
    flex: 1,
    gap: 2,
  },
  dangerDesc: {
    lineHeight: 18,
    marginBottom: 12,
  },
});
