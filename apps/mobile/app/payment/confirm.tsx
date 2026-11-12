import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  colors,
  layout,
  AppText,
  PrimaryButton,
  SecondaryButton,
  StepIndicator,
  StatusBadge,
  ErrorState,
} from '@paiementbj/ui';
import { formatFCFA } from '@paiementbj/shared';
import { api } from '../../src/services/api';
import { showNotice } from '../../src/utils/dialog';

export default function PaymentConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    intentId: string;
    reference: string;
    providerReference?: string;
    providerCode: string;
    totalAmount: string;
    instructions: string;
    providerStatus: string;
    redirectUrl?: string;
  }>();

  const intentId = params.intentId || '';
  const reference = params.reference || '';
  const redirectUrl = params.redirectUrl || '';
  const totalAmount = Number(params.totalAmount) || 0;
  const initialInstructions = params.instructions || '';
  const initialStatus = params.providerStatus || 'PENDING';

  const [status, setStatus] = useState<string>(initialStatus);
  const [instructions, setInstructions] = useState<string>(initialInstructions);
  const [checking, setChecking] = useState(false);

  const steps = [
    { id: 1, label: 'Références' },
    { id: 2, label: 'Opérateur' },
    { id: 3, label: 'Validation' },
  ];

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await api.payments.getStatus(intentId);
      setStatus(res.status);
      if (res.isConfirmed) {
        setInstructions('Paiement confirmé avec succès par le réseau partenaire !');
      } else if (res.failureReason) {
        setInstructions(res.failureReason);
      }
    } catch (err: any) {
      showNotice(
        'Vérification impossible',
        err.message || 'Impossible de contacter le serveur pour vérifier la transaction.'
      );
    } finally {
      setChecking(false);
    }
  };

  const openHostedCheckout = async () => {
    if (!redirectUrl) return;
    try {
      const supported = await Linking.canOpenURL(redirectUrl);
      if (supported) {
        await Linking.openURL(redirectUrl);
      } else {
        showNotice('Lien non pris en charge', redirectUrl);
      }
    } catch {
      showNotice('Ouverture impossible', 'Impossible d’ouvrir la page partenaire sécurisée.');
    }
  };

  const isSuccess = status === 'SUCCEEDED';
  const isFailed = status === 'FAILED';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StepIndicator steps={steps} currentStep={3} />

      <View style={styles.statusCard}>
        <View style={styles.badgeRow}>
          <StatusBadge status={status} />
        </View>

        {Boolean(reference) && (
          <AppText variant="caption" color={colors.primaryDeep} style={styles.refText}>
            Référence dossier : {reference}
          </AppText>
        )}

        {isSuccess ? (
          <>
            <View style={styles.iconCircleSuccess}>
              <AppText variant="h1" color={colors.success}>
                ✓
              </AppText>
            </View>
            <AppText variant="h2" color={colors.primaryDeep} align="center" style={styles.title}>
              Paiement Confirmé
            </AppText>
            <AppText variant="body" color={colors.textSecondary} align="center" style={styles.desc}>
              Votre règlement d’un montant de {formatFCFA(totalAmount)} a été attesté et validé par le prestataire.
            </AppText>
            <PrimaryButton
              label="Consulter le reçu"
              onPress={() => router.replace(`/transaction/${intentId}` as any)}
              style={styles.actionBtn}
            />
          </>
        ) : isFailed ? (
          <ErrorState
            title="Paiement non abouti"
            message={
              instructions ||
              'L’opération n’a pas pu être validée. Aucun montant n’a été prélevé.'
            }
            retryLabel="Choisir un autre moyen"
            onRetry={() => router.back()}
          />
        ) : (
          <>
            <View style={styles.iconCirclePending}>
              <AppText variant="h1" color={colors.warning}>
                ⏳
              </AppText>
            </View>
            <AppText variant="h2" color={colors.primaryDeep} align="center" style={styles.title}>
              {status === 'REDIRECT_REQUIRED'
                ? 'Finalisation sur le portail partenaire'
                : 'Confirmation en cours'}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} align="center" style={styles.desc}>
              {instructions ||
                'Confirmez l’opération puis vérifiez le statut ci-dessous.'}
            </AppText>

            {Boolean(redirectUrl) && (
              <PrimaryButton
                label="Ouvrir la page de paiement"
                onPress={openHostedCheckout}
                style={styles.actionBtn}
              />
            )}

            <View style={styles.instructionBox}>
              <AppText variant="caption" color={colors.textSecondary} style={styles.instructTitle}>
                RAPPEL :
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={styles.instructItem}>
                • Vérifiez le montant affiché ({formatFCFA(totalAmount)}) avant validation.
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={styles.instructItem}>
                • Cliquez sur « Vérifier la confirmation » une fois l’opération validée.
              </AppText>
            </View>

            <PrimaryButton
              label={checking ? 'Vérification en cours...' : 'Vérifier la confirmation'}
              onPress={checkStatus}
              loading={checking}
              style={styles.actionBtn}
            />

            <SecondaryButton
              label="Retour à l’accueil"
              onPress={() => router.replace('/(tabs)')}
              style={styles.secondaryBtn}
            />
          </>
        )}
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
    paddingTop: 24,
  },
  statusCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  badgeRow: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  refText: {
    alignSelf: 'flex-start',
    fontWeight: '700',
    marginBottom: 16,
  },
  iconCircleSuccess: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCirclePending: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.warningSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: '700',
  },
  desc: {
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 320,
  },
  instructionBox: {
    backgroundColor: colors.primarySoft,
    padding: 14,
    borderRadius: layout.borderRadius.sm,
    width: '100%',
    marginBottom: 20,
  },
  instructTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  instructItem: {
    lineHeight: 18,
    marginBottom: 4,
  },
  actionBtn: {
    width: '100%',
    marginBottom: 10,
  },
  secondaryBtn: {
    width: '100%',
  },
});
