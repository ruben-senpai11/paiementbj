import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  colors,
  layout,
  AppText,
  PhoneInput,
  PrimaryButton,
  Checkbox,
} from '@paiementbj/ui';
import { api } from '../../src/services/api';
import { getOrCreateDeviceId } from '../../src/store/useAuthStore';

export default function AuthIndexScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const currentPlatform: 'android' | 'ios' | 'web' =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android';

  const handlePhoneChange = (raw: string, normalized?: string, valid?: boolean) => {
    setPhone(raw);
    setNormalizedPhone(normalized || '');
    setIsValid(Boolean(valid));
    if (error) setError(undefined);
  };

  const handleRequestOtp = async () => {
    if (!isValid || !normalizedPhone) {
      setError('Veuillez saisir un numéro béninois valide à 8 ou 10 chiffres.');
      return;
    }
    if (!consentAccepted) {
      setError(
        'Veuillez cocher la case d’acceptation des Conditions d’Utilisation et de la Politique APDP.'
      );
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const deviceId = await getOrCreateDeviceId();
      const response = await api.auth.requestOtp({
        phone: normalizedPhone,
        platform: currentPlatform,
        deviceId,
      });

      router.push({
        pathname: '/auth/otp',
        params: {
          phone: normalizedPhone,
          expiresIn: String(response.expiresInSeconds),
          devCode: response.devOtpCode || '',
        },
      });
    } catch (err: any) {
      setError(err.message || 'Impossible d’envoyer le code SMS. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="h1" color={colors.primaryDeep} style={styles.title}>
          Bienvenue sur Paiement BJ
        </AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
          Saisissez votre numéro de téléphone béninois pour vous connecter ou créer votre espace usager.
        </AppText>
      </View>

      <View style={styles.card}>
        <PhoneInput
          value={phone}
          onChangePhone={handlePhoneChange}
          error={error}
        />

        <View style={styles.consentContainer}>
          <Checkbox
            checked={consentAccepted}
            onChange={(checked) => {
              setConsentAccepted(checked);
              if (checked && error) setError(undefined);
            }}
            label="J’accepte les Conditions Générales d’Utilisation et le traitement de mes données conformément à la Loi béninoise APDP n°2017-20."
            description="Paiement BJ ne détient aucun solde interne : vos fonds restent auprès de votre opérateur ou banque."
          />
        </View>

        <PrimaryButton
          label="Recevoir le code de vérification"
          onPress={handleRequestOtp}
          disabled={!isValid || !consentAccepted}
          loading={loading}
          style={styles.submitBtn}
        />
      </View>
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
    justifyContent: 'center',
    paddingTop: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  consentContainer: {
    backgroundColor: colors.backgroundMint,
    padding: 12,
    borderRadius: layout.borderRadius.sm,
    marginBottom: 20,
  },
  submitBtn: {
    width: '100%',
  },
});
