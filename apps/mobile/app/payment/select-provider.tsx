import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  colors,
  layout,
  AppText,
  ProviderCard,
  AmountDisplay,
  PrimaryButton,
  StepIndicator,
  LoadingState,
  ErrorState,
  StatusBadge,
} from '@paiementbj/ui';
import { PaymentProviderCode, PaymentQuote, ProviderSummary } from '@paiementbj/types';
import { formatFCFA } from '@paiementbj/shared';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { showNotice } from '../../src/utils/dialog';

function createUuidV4(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function SelectProviderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    serviceId: string;
    serviceTitle: string;
    amount: string;
    formData: string;
  }>();

  const { user } = useAuthStore();
  const serviceId = params.serviceId || '';
  const serviceTitle = params.serviceTitle || '';
  const amount = Number(params.amount) || 0;
  const parsedFormData: Record<string, string> = params.formData
    ? JSON.parse(params.formData)
    : {};

  // Clé d'idempotence figée pour toute cette session d'écran (évite les doubles débits)
  const idempotencyKeyRef = useRef<string>(createUuidV4());

  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderCode>('MTN_MOMO');
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 1, label: 'Références' },
    { id: 2, label: 'Opérateur' },
    { id: 3, label: 'Validation' },
  ];

  const loadProviders = async () => {
    setLoadingProviders(true);
    setLoadError(null);
    try {
      const list = await api.payments.listProviders();
      setProviders(list);
      const firstOperational = list.find((p) => p.availability === 'OPERATIONAL');
      if (firstOperational) {
        setSelectedProvider(firstOperational.code);
      } else if (list[0]) {
        setSelectedProvider(list[0].code);
      }
    } catch (err: any) {
      setLoadError(err.message || 'Impossible de récupérer l’état réel des prestataires.');
    } finally {
      setLoadingProviders(false);
    }
  };

  useEffect(() => {
    void loadProviders();
  }, []);

  useEffect(() => {
    if (!serviceId || amount <= 0) return;
    let active = true;
    api.payments
      .getQuote({
        serviceId,
        providerCode: selectedProvider,
        amount,
        currency: 'XOF',
      })
      .then((q) => {
        if (active) setQuote(q);
      })
      .catch(() => {
        if (active) setQuote(null);
      });
    return () => {
      active = false;
    };
  }, [serviceId, selectedProvider, amount]);

  const currentProvider = providers.find((p) => p.code === selectedProvider);
  const isSelectedOperational = currentProvider?.availability === 'OPERATIONAL';
  const currentFee = quote?.providerFee ?? 0;
  const totalToDebit = quote?.totalAmount ?? amount + currentFee;

  const providerSubtitle = (code: PaymentProviderCode): string => {
    switch (code) {
      case 'MTN_MOMO':
        return 'Débit direct via invite USSD MoMo';
      case 'MOOV_MONEY':
        return 'Validation via menu Moov Money (*155#)';
      case 'CELTIIS_CASH':
        return 'Débit compte monnaie électronique Celtiis';
      case 'BANK_CARD':
        return 'Paiement hébergé sécurisé 3D-Secure (Visa / Mastercard)';
      case 'TRESOR_PAY':
        return 'Passerelle officielle de la comptabilité publique';
    }
  };

  const handleConfirmProvider = async () => {
    if (!isSelectedOperational) {
      showNotice(
        'Prestataire indisponible',
        currentProvider?.statusMessage ||
          'Ce moyen de paiement n’est pas encore disponible pour les opérations réelles.'
      );
      return;
    }

    setLoading(true);
    try {
      const primaryRefKey = Object.keys(parsedFormData)[0] || 'ref';
      const serviceReference = parsedFormData[primaryRefKey] || `REF-${Date.now()}`;

      const validation = await api.payments.validatePayment({
        serviceId,
        providerCode: selectedProvider,
        serviceReference,
        amount,
      });

      if (!validation.isValid) {
        showNotice('Vérification refusée', validation.message);
        return;
      }

      const intent = await api.payments.createIntent({
        serviceId,
        amount,
        serviceReference,
        customerData: {
          ...parsedFormData,
          payerPhone: user?.phone || '',
        },
        idempotencyKey: idempotencyKeyRef.current,
      });

      const attemptRes = await api.payments.createAttempt({
        paymentIntentId: intent.id,
        providerCode: selectedProvider,
        payerPhone: user?.phone,
      });

      router.push({
        pathname: '/payment/confirm',
        params: {
          intentId: intent.id,
          reference: intent.reference,
          providerReference: attemptRes.providerReference,
          providerCode: selectedProvider,
          totalAmount: (quote?.totalAmount ?? intent.totalAmount).toString(),
          instructions: attemptRes.instructions || '',
          providerStatus: attemptRes.status,
          redirectUrl: attemptRes.redirectUrl || '',
        },
      });
    } catch (err: any) {
      showNotice(
        'Échec de l’initiation',
        err.message || 'Impossible d’initialiser le paiement.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProviders) {
    return <LoadingState message="Vérification en direct des passerelles de paiement..." />;
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <ErrorState
          title="Prestataires injoignables"
          message={loadError}
          onRetry={loadProviders}
          retryLabel="Réessayer"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StepIndicator steps={steps} currentStep={2} />

      <View style={styles.summaryCard}>
        <AppText variant="caption" color={colors.textSecondary}>
          PAIEMENT DE SERVICE
        </AppText>
        <AppText variant="h3" color={colors.text} style={styles.summaryTitle}>
          {serviceTitle}
        </AppText>
        <View style={styles.divider} />
        <View style={styles.row}>
          <AppText variant="body" color={colors.textSecondary}>
            Montant principal
          </AppText>
          <AppText variant="bodyMedium" color={colors.text}>
            {formatFCFA(amount)}
          </AppText>
        </View>
        <View style={styles.row}>
          <AppText variant="body" color={colors.textSecondary}>
            Frais estimés du prestataire
          </AppText>
          <AppText variant="bodyMedium" color={colors.text}>
            {quote ? formatFCFA(currentFee) : 'Calcul...'}
          </AppText>
        </View>
        <View style={[styles.row, styles.totalRow]}>
          <AppText variant="h3" color={colors.primaryDeep}>
            Total net à débiter
          </AppText>
          <AmountDisplay amount={totalToDebit} size="medium" />
        </View>
      </View>

      <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.sectionLabel}>
        SÉLECTIONNEZ VOTRE MOYEN DE PAIEMENT
      </AppText>

      {providers.map((p) => {
        const available = p.availability === 'OPERATIONAL';
        return (
          <ProviderCard
            key={p.code}
            providerCode={p.code}
            brandKey={p.brandAssetKey}
            name={p.name}
            subtitle={providerSubtitle(p.code)}
            feeNotice={p.statusMessage || (available ? 'Frais calculés selon barème officiel' : 'Non activé')}
            isSelected={selectedProvider === p.code}
            isAvailable={available}
            onSelect={() => setSelectedProvider(p.code)}
          />
        );
      })}

      {!isSelectedOperational && (
        <View style={styles.unavailableNotice}>
          <StatusBadge status="UNAVAILABLE" style={styles.unavailableBadge} />
          <AppText variant="caption" color={colors.danger} style={styles.unavailableText}>
            {currentProvider?.statusMessage ||
              'Ce prestataire n’est pas encore connecté. Aucun débit simulé n’est autorisé sur Paiement BJ.'}
          </AppText>
        </View>
      )}

      <PrimaryButton
        label={
          isSelectedOperational
            ? 'Valider et déclencher le paiement'
            : 'Moyen de paiement non disponible'
        }
        onPress={handleConfirmProvider}
        disabled={!isSelectedOperational}
        loading={loading}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: layout.screenPaddingMobile,
  },
  content: {
    padding: layout.screenPaddingMobile,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
  },
  summaryTitle: {
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 6,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 6,
  },
  unavailableNotice: {
    backgroundColor: colors.dangerSoft,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  unavailableBadge: {
    marginBottom: 6,
  },
  unavailableText: {
    lineHeight: 18,
    fontWeight: '600',
  },
  submitBtn: {
    width: '100%',
    marginTop: 12,
  },
});
