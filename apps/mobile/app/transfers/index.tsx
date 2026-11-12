import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  colors,
  layout,
  AppText,
  StatusBadge,
  PrimaryButton,
} from '@paiementbj/ui';

export default function TransfersScreen() {
  const router = useRouter();

  const interoperabilityPairs = [
    { from: 'MTN MoMo', to: 'Moov Money', status: 'PENDING_AGREEMENT' },
    { from: 'Moov Money', to: 'MTN MoMo', status: 'PENDING_AGREEMENT' },
    { from: 'Celtiis Cash', to: 'MTN MoMo', status: 'PENDING_AGREEMENT' },
    { from: 'Comptes Bancaires', to: 'Mobile Money (UEMOA)', status: 'PENDING_AGREEMENT' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <AppText variant="h2" color={colors.primaryDeep} style={styles.title}>
          Transferts Interopérables
        </AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.desc}>
          Passerelle nationale et régionale permettant d’envoyer et de recevoir des fonds entre opérateurs télécoms et comptes bancaires via l’infrastructure PI-SPI.
        </AppText>

        <View style={styles.warningBox}>
          <AppText variant="caption" color={colors.accentDark} style={styles.warningTitle}>
            INTEROPÉRABILITÉ NATIONALE
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.warningText}>
            Les transferts relient directement opérateurs télécoms et comptes bancaires sans portefeuille intermédiaire.
          </AppText>
        </View>

        <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.subhead}>
          CANAUX D’ÉCHANGE
        </AppText>

        {interoperabilityPairs.map((pair, idx) => (
          <View key={idx} style={styles.pairRow}>
            <View style={styles.pairMeta}>
              <AppText variant="bodyMedium" color={colors.text} style={styles.pairTitle}>
                {pair.from} ➔ {pair.to}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Routage interopérable PI-SPI
              </AppText>
            </View>
            <StatusBadge status="TECHNICAL_IN_PROGRESS" customLabel="En déploiement" />
          </View>
        ))}

        <PrimaryButton
          label="Retour aux services disponibles"
          onPress={() => router.back()}
          style={styles.btn}
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  title: {
    marginBottom: 8,
  },
  desc: {
    lineHeight: 22,
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: colors.warningSoft,
    padding: 14,
    borderRadius: layout.borderRadius.sm,
    marginBottom: 20,
  },
  warningTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  warningText: {
    lineHeight: 18,
  },
  subhead: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  pairRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pairMeta: {
    flex: 1,
  },
  pairTitle: {
    fontWeight: '700',
    fontSize: 15,
  },
  btn: {
    marginTop: 24,
    width: '100%',
  },
});
