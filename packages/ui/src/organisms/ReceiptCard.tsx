import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Receipt } from '@paiementbj/types';
import { formatFCFA } from '@paiementbj/shared';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from '../atoms/AppText';
import { BeninFlagBar } from '../atoms/BeninFlagBar';
import { StatusBadge } from '../molecules/StatusBadge';

export interface ReceiptCardProps {
  receipt: Receipt;
  style?: ViewStyle;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt, style }) => {
  return (
    <View style={[styles.card, style]} accessible={true}>
      <View style={styles.header}>
        <BeninFlagBar height={4} width={60} style={styles.flagStrip} />
        <AppText variant="caption" color={colors.textSecondary} style={styles.headerTitle}>
          RÉPUBLIQUE DU BÉNIN • REÇU DE TÉLÉPAIEMENT
        </AppText>
        <AppText variant="h3" color={colors.primaryDeep} style={styles.receiptNumber}>
          {receipt.receiptNumber}
        </AppText>
        <StatusBadge status="SUCCEEDED" customLabel="Paiement confirmé" style={styles.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <AppText variant="caption" color={colors.textSecondary}>
          BÉNÉFICIAIRE
        </AppText>
        <AppText variant="bodyMedium" color={colors.text} style={styles.beneficiary}>
          {receipt.beneficiaryName}
        </AppText>

        <AppText variant="caption" color={colors.textSecondary} style={styles.fieldSpacing}>
          SERVICE & RÉFÉRENCE CLIENT
        </AppText>
        <AppText variant="body" color={colors.text}>
          {receipt.serviceTitle}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          Réf: {receipt.serviceReference}
        </AppText>
      </View>

      <View style={styles.divider} />

      <View style={styles.amountsBox}>
        <View style={styles.amountRow}>
          <AppText variant="body" color={colors.textSecondary}>
            Montant principal
          </AppText>
          <AppText variant="bodyMedium" color={colors.text}>
            {formatFCFA(receipt.amountPrincipal)}
          </AppText>
        </View>
        <View style={styles.amountRow}>
          <AppText variant="body" color={colors.textSecondary}>
            Frais de service
          </AppText>
          <AppText variant="bodyMedium" color={colors.text}>
            {formatFCFA(receipt.fees)}
          </AppText>
        </View>
        <View style={[styles.amountRow, styles.totalRow]}>
          <AppText variant="h3" color={colors.primaryDeep}>
            Total réglé
          </AppText>
          <AppText variant="h2" color={colors.primaryDeep} style={styles.totalAmount}>
            {formatFCFA(receipt.totalAmount)}
          </AppText>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <AppText variant="caption" color={colors.textMuted}>
          Opérateur : {receipt.providerName} (Réf: {receipt.providerReference})
        </AppText>
        <AppText variant="caption" color={colors.textMuted} style={styles.dateText}>
          Date : {new Date(receipt.issuedAt).toLocaleString('fr-BJ')}
        </AppText>
        <View style={styles.hashBox}>
          <AppText variant="caption" color={colors.textSecondary} style={styles.hashLabel}>
            Code de vérification :
          </AppText>
          <AppText variant="caption" color={colors.primaryDeep} style={styles.hashValue}>
            {receipt.digitalSignatureHash}
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 20,
    marginVertical: 12,
  },
  flagStrip: {
    borderRadius: 2,
    marginBottom: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptNumber: {
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  status: {
    alignSelf: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  section: {
    marginVertical: 4,
  },
  beneficiary: {
    fontWeight: '700',
    fontSize: 17,
    marginTop: 2,
  },
  fieldSpacing: {
    marginTop: 10,
  },
  amountsBox: {
    backgroundColor: colors.primarySoft,
    padding: 14,
    borderRadius: layout.borderRadius.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
    alignItems: 'center',
  },
  totalAmount: {
    fontWeight: '800',
  },
  footer: {
    marginTop: 4,
  },
  dateText: {
    marginTop: 2,
  },
  hashBox: {
    marginTop: 10,
    backgroundColor: colors.surfaceSubtle,
    padding: 8,
    borderRadius: 6,
  },
  hashLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  hashValue: {
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 2,
  },
});
