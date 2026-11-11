import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { TransactionSummary } from '@paiementbj/types';
import { formatFCFA } from '@paiementbj/shared';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';
import { BrandLogo } from './BrandLogo';
import { StatusBadge } from './StatusBadge';

export interface TransactionCardProps {
  transaction: TransactionSummary;
  onPress: () => void;
  style?: ViewStyle;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onPress,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Paiement ${transaction.serviceTitle}, montant ${formatFCFA(transaction.totalAmount)}, statut: ${transaction.statusLabel}`}
      accessibilityHint="Appuyez pour consulter les détails et le reçu officiel"
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftMeta}>
          <BrandLogo
            brandKey={transaction.organizationLogoKey || 'tresor'}
            size={40}
            style={styles.logo}
          />
          <View>
            <AppText variant="bodyMedium" color={colors.text} style={styles.title} numberOfLines={1}>
              {transaction.serviceTitle}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {transaction.beneficiaryName}
            </AppText>
          </View>
        </View>

        <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.amount}>
          {formatFCFA(transaction.totalAmount)}
        </AppText>
      </View>

      <View style={styles.bottomRow}>
        <AppText variant="caption" color={colors.textMuted} style={styles.date}>
          Réf: {transaction.reference} • {new Date(transaction.initiatedAt).toLocaleDateString('fr-BJ', { day: '2-digit', month: 'short', year: 'numeric' })}
        </AppText>
        <StatusBadge status={transaction.status} customLabel={transaction.statusLabel} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 10,
    minHeight: layout.minTouchTarget,
  },
  pressed: {
    backgroundColor: '#FAFDFB',
    borderColor: colors.borderFocused,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    marginRight: 10,
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
  },
  amount: {
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  date: {
    fontSize: 12,
  },
});
