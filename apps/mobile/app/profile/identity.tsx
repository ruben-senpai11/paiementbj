import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, Clock, Lock, FileCheck2 } from 'lucide-react-native';
import {
  colors,
  layout,
  AppText,
  BrandLogo,
  StatusBadge,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@paiementbj/ui';
import { ConsentRecord, IdentityLevel } from '@paiementbj/types';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';

const PURPOSE_LABELS: Record<ConsentRecord['purpose'], string> = {
  terms_of_service: 'Conditions Générales d’Utilisation (CGU)',
  privacy_policy: 'Politique de protection des données (Loi APDP n°2017-20)',
  telemetry: 'Mesures techniques anonymisées de fiabilité',
  anip_verification: 'Vérification d’identité ANIP / NPI',
};

export default function ProfileIdentityScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await api.auth.getConsents();
      setConsents(list);
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer l’historique de vos consentements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Connexion requise"
          description="Connectez-vous pour consulter vos niveaux d’identification et vos consentements APDP."
          actionLabel="Se connecter"
          onAction={() => router.replace('/auth')}
        />
      </View>
    );
  }

  const currentLevel = user?.identityLevel || IdentityLevel.LEVEL_1_PHONE_VERIFIED;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Niveaux de confiance identitaire */}
      <View style={styles.card}>
        <View style={styles.anipHeader}>
          <BrandLogo brandKey="anip" size={44} />
          <View style={styles.anipHeaderText}>
            <AppText variant="h3" color={colors.primaryDeep}>
              Niveaux d’identification officielle
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Architecture progressive conforme ANIP / BCEAO
            </AppText>
          </View>
        </View>

        <View style={styles.levelItem}>
          <CheckCircle2 size={20} color={colors.success} />
          <View style={styles.levelBody}>
            <AppText variant="bodySmall" color={colors.text} style={styles.bold}>
              Niveau 1 : Numéro de téléphone vérifié (OTP SMS)
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {currentLevel === IdentityLevel.LEVEL_1_PHONE_VERIFIED ||
              currentLevel === IdentityLevel.LEVEL_2_IDENTITY_VERIFIED ||
              currentLevel === IdentityLevel.LEVEL_3_ENHANCED
                ? 'Actif. Autorise l’accès aux paiements du quotidien et reçus centralisés.'
                : 'En attente de validation OTP.'}
            </AppText>
          </View>
        </View>

        <View style={styles.levelItem}>
          <Clock size={20} color={colors.warning} />
          <View style={styles.levelBody}>
            <View style={styles.rowBetween}>
              <AppText variant="bodySmall" color={colors.text} style={styles.bold}>
                Niveau 2 : Identité certifiée ANIP / NPI
              </AppText>
              <StatusBadge status="PENDING_AGREEMENT" customLabel="En attente ANIP" />
            </View>
            <AppText variant="caption" color={colors.textSecondary}>
              La vérification du Numéro Personnel d’Identification (NPI) sera activée exclusivement après homologation officielle de l’interconnexion ANIP. Aucun faux NPI n’est accepté.
            </AppText>
          </View>
        </View>

        <View style={styles.levelItem}>
          <Lock size={20} color={colors.textSecondary} />
          <View style={styles.levelBody}>
            <AppText variant="bodySmall" color={colors.text} style={styles.bold}>
              Niveau 3 : Authentification biométrique renforcée
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Réservé aux démarches publiques sensibles après activation du Niveau 2.
            </AppText>
          </View>
        </View>
      </View>

      {/* Consentements APDP horodatés */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <FileCheck2 size={20} color={colors.primaryDeep} />
          <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.sectionTitle}>
            CONSENTEMENTS APDP HORODATÉS
          </AppText>
        </View>

        {loading ? (
          <LoadingState message="Chargement des preuves de consentement..." />
        ) : error ? (
          <ErrorState title="Lecture impossible" message={error} onRetry={loadData} />
        ) : consents.length === 0 ? (
          <AppText variant="caption" color={colors.textSecondary}>
            Aucun consentement enregistré sur cette session.
          </AppText>
        ) : (
          consents.map((record) => (
            <View key={record.id} style={styles.consentRow}>
              <View style={styles.rowBetween}>
                <AppText variant="bodySmall" color={colors.text} style={styles.bold}>
                  {PURPOSE_LABELS[record.purpose] || record.purpose}
                </AppText>
                <StatusBadge
                  status={record.revokedAt ? 'FAILED' : 'SUCCEEDED'}
                  customLabel={record.revokedAt ? 'Révoqué' : `v${record.version}`}
                />
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                Accepté le {new Date(record.acceptedAt).toLocaleString('fr-BJ')}
              </AppText>
            </View>
          ))
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
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: layout.screenPaddingMobile,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
  },
  anipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  anipHeaderText: {
    flex: 1,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  levelBody: {
    flex: 1,
    gap: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  bold: {
    fontWeight: '700',
  },
  sectionHeaderRow: {
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
  consentRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
});
