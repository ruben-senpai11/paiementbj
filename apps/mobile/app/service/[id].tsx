import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  colors,
  layout,
  AppText,
  BrandLogo,
  StatusBadge,
  TextInput,
  AmountDisplay,
  PrimaryButton,
  LoadingState,
  StepIndicator,
  ErrorState,
} from '@paiementbj/ui';
import { ServiceItem } from '@paiementbj/types';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { showConfirm, showNotice } from '../../src/utils/dialog';

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();

  const [service, setService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchService = async () => {
      try {
        if (id) {
          const s = await api.services.getById(id);
          setService(s);
          if (s.minAmount && s.minAmount === s.maxAmount) {
            setAmount(s.minAmount.toString());
          }
        }
      } catch {
        showNotice('Erreur', 'Impossible de charger ce service.');
      } finally {
        setLoading(false);
      }
    };
    void fetchService();
  }, [id]);

  if (loading) {
    return <LoadingState message="Chargement des paramètres du service..." />;
  }

  if (!service) {
    return (
      <View style={styles.center}>
        <ErrorState
          title="Service introuvable"
          message="Le service demandé n’a pas pu être trouvé dans le catalogue."
          onRetry={() => router.back()}
          retryLabel="Retour au catalogue"
        />
      </View>
    );
  }

  const isAvailable =
    service.integrationStatus === 'LIVE' ||
    service.integrationStatus === 'SANDBOX_CONNECTED';

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleProceed = () => {
    if (!isAuthenticated) {
      showConfirm(
        'Connexion requise',
        'Veuillez vous connecter pour préparer et enregistrer votre paiement.',
        'Se connecter',
        () => router.push('/auth')
      );
      return;
    }

    // Validation des champs requis
    const newErrors: Record<string, string> = {};
    for (const field of service.fields) {
      if (field.name === 'amount') continue;
      const val = formData[field.name];
      if (field.required && (!val || val.trim() === '')) {
        newErrors[field.name] = `Le champ ${field.label} est obligatoire.`;
      }
    }

    const parsedAmount = Number(amount || formData['amount'] || 0);
    if (!parsedAmount || parsedAmount <= 0) {
      newErrors['amount'] = 'Veuillez saisir un montant supérieur à 0 FCFA.';
    } else if (service.minAmount && parsedAmount < service.minAmount) {
      newErrors['amount'] = `Le montant minimum autorisé est de ${service.minAmount} FCFA.`;
    } else if (service.maxAmount && parsedAmount > service.maxAmount) {
      newErrors['amount'] = `Le montant maximum autorisé est de ${service.maxAmount} FCFA.`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Navigation vers la sélection du moyen de paiement
    router.push({
      pathname: '/payment/select-provider',
      params: {
        serviceId: service.id,
        serviceTitle: service.title,
        amount: parsedAmount.toString(),
        formData: JSON.stringify(formData),
      },
    });
  };

  const steps = [
    { id: 1, label: 'Références' },
    { id: 2, label: 'Opérateur' },
    { id: 3, label: 'Validation' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StepIndicator steps={steps} currentStep={1} />

      {/* En-tête officiel du service */}
      <View style={styles.serviceHeaderCard}>
        <View style={styles.logoRow}>
          <BrandLogo
            brandKey={service.organization?.logoAssetKey || 'tresor'}
            size={52}
            style={styles.logo}
          />
          <View style={styles.headerInfo}>
            <AppText variant="h3" color={colors.text} style={styles.title}>
              {service.title}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {service.organization?.name}
            </AppText>
          </View>
        </View>

        <StatusBadge status={service.integrationStatus} style={styles.badge} />

        <AppText variant="caption" color={colors.textMuted} style={styles.desc}>
          {service.description}
        </AppText>

        {!isAvailable && service.statusMessage && (
          <View style={styles.noticeUnavailable}>
            <AppText variant="caption" color={colors.danger} style={styles.noticeText}>
              ℹ {service.statusMessage}
            </AppText>
          </View>
        )}
      </View>

      {/* Formulaire des champs requis */}
      <View style={styles.formCard}>
        <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.formTitle}>
          RÉFÉRENCES ET MONTANT DU PAIEMENT
        </AppText>

        {service.fields.map((field) => {
          if (field.name === 'amount') return null;
          return (
            <TextInput
              key={field.id}
              label={field.label}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              helpText={field.helpText}
              error={errors[field.name]}
              keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            />
          );
        })}

        {/* Champ Montant si non fixé */}
        {(!service.minAmount || service.minAmount !== service.maxAmount) && (
          <TextInput
            label="Montant à payer (FCFA)"
            placeholder="Ex: 5000"
            value={amount}
            onChangeText={(text) => {
              setAmount(text.replace(/[^\d]/g, ''));
              if (errors['amount']) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next['amount'];
                  return next;
                });
              }
            }}
            keyboardType="numeric"
            error={errors['amount']}
            helpText={
              service.minAmount
                ? `Plafonds autorisés : de ${service.minAmount} à ${service.maxAmount || 500000} FCFA`
                : undefined
            }
          />
        )}

        {/* Récapitulatif dynamique */}
        {Number(amount) > 0 && (
          <View style={styles.amountBox}>
            <AmountDisplay
              amount={Number(amount)}
              label="Montant principal calculé"
              size="medium"
            />
          </View>
        )}

        <PrimaryButton
          label="Continuer vers le paiement"
          onPress={handleProceed}
          disabled={!isAvailable}
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
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: layout.screenPaddingMobile,
  },
  serviceHeaderCard: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 17,
  },
  badge: {
    marginBottom: 10,
  },
  desc: {
    lineHeight: 20,
  },
  noticeUnavailable: {
    backgroundColor: colors.dangerSoft,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  noticeText: {
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  amountBox: {
    backgroundColor: colors.primarySoft,
    padding: 12,
    borderRadius: layout.borderRadius.sm,
    marginBottom: 16,
  },
  submitBtn: {
    width: '100%',
    marginTop: 8,
  },
});
