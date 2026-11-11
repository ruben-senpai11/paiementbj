import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { formatFCFA, formatCurrency } from '@paiementbj/shared';
import { colors } from '../tokens/colors';
import { AppText } from './AppText';

export interface AmountDisplayProps {
  amount: number;
  currency?: 'XOF' | 'EUR' | 'USD';
  label?: string;
  size?: 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  currency = 'XOF',
  label,
  size = 'large',
  color = colors.primaryDeep,
  style,
}) => {
  const formatted =
    currency === 'XOF' ? formatFCFA(amount) : formatCurrency(amount, currency);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <AppText variant="caption" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      )}
      <AppText
        variant={size === 'large' ? 'amount' : 'h2'}
        color={color}
        style={styles.amount}
      >
        {formatted}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    marginBottom: 4,
    fontWeight: '600',
  },
  amount: {
    letterSpacing: -0.5,
  },
});
