import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  colors,
  layout,
  AppText,
  OtpInput,
  PrimaryButton,
  SecondaryButton,
} from '@paiementbj/ui';
import { getOrCreateDeviceId, useAuthStore } from '../../src/store/useAuthStore';
import { api } from '../../src/services/api';

export default function OtpVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; expiresIn?: string; devCode?: string }>();
  const phone = params.phone || '';
  const devCode = params.devCode || '';

  const [code, setCode] = useState(devCode);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(Number(params.expiresIn) || 180);

  const { setAuth } = useAuthStore();

  const currentPlatform: 'android' | 'ios' | 'web' =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android';

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Veuillez renseigner le code complet à 6 chiffres.');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const deviceId = await getOrCreateDeviceId();
      const deviceName =
        Platform.OS === 'ios'
          ? 'iPhone / iPad'
          : Platform.OS === 'web'
          ? 'Navigateur Web'
          : 'Smartphone Android';

      const res = await api.auth.verifyOtp({
        phone,
        code,
        platform: currentPlatform,
        deviceId,
        deviceName,
      });

      await setAuth(res.user, res.accessToken);

      // Enregistre le consentement éclairé horodaté côté serveur
      try {
        await api.auth.recordConsent({
          purpose: 'terms_of_service',
          version: '2026.1',
          accepted: true,
        });
        await api.auth.recordConsent({
          purpose: 'privacy_policy',
          version: '2026.1',
          accepted: true,
        });
      } catch {
        // N'empêche pas la connexion si la trace secondaire échoue
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Code de vérification incorrect ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const deviceId = await getOrCreateDeviceId();
      const res = await api.auth.requestOtp({
        phone,
        platform: currentPlatform,
        deviceId,
      });
      setCountdown(res.expiresInSeconds);
      if (res.devOtpCode) {
        setCode(res.devOtpCode);
      }
      setError(undefined);
    } catch (err: any) {
      setError(err.message || 'Impossible de renvoyer le code actuellement.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="h1" color={colors.primaryDeep} style={styles.title}>
          Vérification SMS
        </AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
          Un code de confirmation à 6 chiffres a été transmis par SMS au numéro :
        </AppText>
        <AppText variant="h3" color={colors.text} style={styles.phoneHighlight}>
          {phone}
        </AppText>
      </View>

      <View style={styles.card}>
        <OtpInput
          value={code}
          onChangeOtp={(val) => {
            setCode(val);
            if (error) setError(undefined);
          }}
          error={error}
        />

        {Boolean(devCode) && (
          <View style={styles.devBox}>
            <AppText variant="caption" color={colors.accentDark} style={styles.devText}>
              Code de confirmation : {devCode}
            </AppText>
          </View>
        )}

        <PrimaryButton
          label="Valider le code"
          onPress={handleVerify}
          disabled={code.length !== 6}
          loading={loading}
          style={styles.btn}
        />

        <View style={styles.resendSection}>
          {countdown > 0 ? (
            <AppText variant="caption" color={colors.textMuted}>
              Renvoyer un nouveau code dans {Math.floor(countdown / 60)}:
              {(countdown % 60).toString().padStart(2, '0')}
            </AppText>
          ) : (
            <SecondaryButton
              label="Renvoyer un code par SMS"
              onPress={handleResend}
              style={styles.resendBtn}
            />
          )}
        </View>
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
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
    marginBottom: 4,
  },
  phoneHighlight: {
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  devBox: {
    backgroundColor: colors.accentSoft,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  devText: {
    fontWeight: '600',
  },
  btn: {
    width: '100%',
    marginTop: 8,
  },
  resendSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendBtn: {
    width: '100%',
  },
});
