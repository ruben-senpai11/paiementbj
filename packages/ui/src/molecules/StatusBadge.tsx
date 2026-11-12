import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { AppText } from '../atoms/AppText';

export type StatusType =
  | 'SUCCEEDED'
  | 'PENDING'
  | 'PROCESSING'
  | 'FAILED'
  | 'CANCELLED'
  | 'LIVE'
  | 'UNAVAILABLE'
  | 'SANDBOX_CONNECTED'
  | 'PENDING_AGREEMENT'
  | 'TECHNICAL_IN_PROGRESS';

export interface StatusBadgeProps {
  status: StatusType | string;
  customLabel?: string;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  style,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'SUCCEEDED':
      case 'LIVE':
        return {
          fg: colors.success,
          symbol: '✓',
          label: customLabel || (status === 'LIVE' ? 'Disponible' : 'Confirmé'),
        };
      case 'PENDING':
      case 'PROCESSING':
      case 'SANDBOX_CONNECTED':
      case 'PENDING_AGREEMENT':
      case 'TECHNICAL_IN_PROGRESS':
        return {
          fg: colors.warning,
          symbol: '•',
          label: customLabel || 'En cours',
        };
      case 'FAILED':
      case 'CANCELLED':
      case 'UNAVAILABLE':
      default:
        return {
          fg: colors.danger,
          symbol: '✕',
          label: customLabel || (status === 'UNAVAILABLE' ? 'Indisponible' : 'Échoué'),
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View
      style={[styles.badge, style]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Statut: ${config.label}`}
    >
      <AppText variant="caption" color={config.fg} style={styles.symbol}>
        {config.symbol}
      </AppText>
      <AppText variant="caption" color={config.fg} style={styles.label}>
        {config.label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  symbol: {
    marginRight: 5,
    fontWeight: '700',
    fontSize: 12,
  },
  label: {
    fontWeight: '700',
    fontSize: 12,
  },
});
