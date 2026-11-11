import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { AppText } from './AppText';

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
          bg: colors.successSoft,
          fg: colors.success,
          symbol: '✓',
          label: customLabel || (status === 'LIVE' ? 'Opérationnel' : 'Confirmé'),
        };
      case 'PENDING':
      case 'PROCESSING':
      case 'SANDBOX_CONNECTED':
      case 'PENDING_AGREEMENT':
      case 'TECHNICAL_IN_PROGRESS':
        return {
          bg: colors.warningSoft,
          fg: colors.warning,
          symbol: status === 'PENDING_AGREEMENT' ? '⏸' : '⏳',
          label:
            customLabel ||
            (status === 'SANDBOX_CONNECTED'
              ? 'Test Sandbox'
              : status === 'PENDING_AGREEMENT'
              ? 'Convention en attente'
              : status === 'TECHNICAL_IN_PROGRESS'
              ? 'Intégration en cours'
              : 'En cours'),
        };
      case 'FAILED':
      case 'CANCELLED':
      case 'UNAVAILABLE':
      default:
        return {
          bg: colors.dangerSoft,
          fg: colors.danger,
          symbol: '✕',
          label: customLabel || (status === 'UNAVAILABLE' ? 'Non disponible' : 'Échoué'),
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View
      style={[styles.badge, { backgroundColor: config.bg, borderColor: config.fg }, style]}
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  symbol: {
    marginRight: 6,
    fontWeight: '700',
    fontSize: 12,
  },
  label: {
    fontWeight: '700',
    fontSize: 12,
  },
});
