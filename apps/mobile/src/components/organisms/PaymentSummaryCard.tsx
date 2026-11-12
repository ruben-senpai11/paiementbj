import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, layout, AppText, AmountDisplay } from '@paiementbj/ui';
import { formatFCFA } from '@paiementbj/shared';

interface PaymentSummaryCardProps {
  serviceTitle: string;
  amount: number;
  fee: number | null;
  totalToDebit: number;
}

export function PaymentSummaryCard({
  serviceTitle,
  amount,
  fee,
  totalToDebit,
}: PaymentSummaryCardProps) {
  return (
    <View style={styles.card}>
      <AppText variant="caption" color={colors.textMuted}>
        RÉCAPITULATIF
      </AppText>
      <AppText variant="h3" color={colors.text} style={styles.title}>
        {serviceTitle}
      </AppText>
      <View style={styles.divider} />
      <View style={styles.row}>
        <AppText variant="body" color={colors.textSecondary}>
          Montant
        </AppText>
        <AppText variant="bodyMedium" color={colors.text}>
          {formatFCFA(amount)}
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText variant="body" color={colors.textSecondary}>
          Frais opérateur
        </AppText>
        <AppText variant="bodyMedium" color={colors.text}>
          {fee !== null ? formatFCFA(fee) : 'Calcul...'}
        </AppText>
      </View>
      <View style={[styles.row, styles.totalRow]}>
        <AppText variant="h3" color={colors.primaryDeep}>
          Total à payer
        </AppText>
        <AmountDisplay amount={totalToDebit} size="medium" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    marginBottom: 20,
  },
  title: {
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 12,
    marginTop: 6,
    alignItems: 'center',
  },
});
