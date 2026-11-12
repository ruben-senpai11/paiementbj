import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { PaymentProviderCode } from '@paiementbj/types';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from '../atoms/AppText';
import { BrandLogo } from '../atoms/BrandLogo';
import { StatusBadge } from '../molecules/StatusBadge';

export interface ProviderCardProps {
  providerCode: PaymentProviderCode;
  brandKey: string;
  name: string;
  subtitle: string;
  feeNotice?: string;
  unavailableReason?: string;
  isSelected: boolean;
  isAvailable?: boolean;
  onSelect: () => void;
  style?: ViewStyle;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  brandKey,
  name,
  subtitle,
  feeNotice,
  unavailableReason,
  isSelected,
  isAvailable = true,
  onSelect,
  style,
}) => {
  return (
    <Pressable
      onPress={onSelect}
      disabled={!isAvailable}
      accessible={true}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
      accessibilityLabel={`Moyen de paiement ${name}, ${subtitle}${!isAvailable ? ', non disponible' : ''}`}
      style={({ pressed }) => [
        styles.card,
        isSelected && isAvailable && styles.cardSelected,
        !isAvailable && styles.cardDisabled,
        pressed && isAvailable && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <BrandLogo brandKey={brandKey} size={48} style={styles.logo} />
        <View style={styles.textCol}>
          <AppText variant="bodyMedium" color={colors.text} style={styles.name}>
            {name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.subtitle}>
            {subtitle}
          </AppText>
          {isAvailable && feeNotice ? (
            <AppText variant="caption" color={colors.textMuted} style={styles.fee}>
              {feeNotice}
            </AppText>
          ) : null}
          {!isAvailable ? (
            <View style={styles.unavailableRow}>
              <StatusBadge
                status="UNAVAILABLE"
                customLabel={unavailableReason || 'Non disponible'}
              />
            </View>
          ) : null}
        </View>
        <View
          style={[
            styles.radioCircle,
            isSelected && isAvailable && styles.radioCircleSelected,
            !isAvailable && styles.radioCircleDisabled,
          ]}
        >
          {isSelected && isAvailable && <View style={styles.radioInner} />}
        </View>
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
    marginBottom: 12,
    minHeight: layout.minTouchTarget,
  },
  cardSelected: {
    borderColor: colors.borderFocused,
    backgroundColor: colors.primarySoft,
  },
  cardDisabled: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    marginRight: 14,
  },
  textCol: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
  },
  subtitle: {
    marginTop: 2,
  },
  fee: {
    marginTop: 2,
    fontSize: 12,
  },
  unavailableRow: {
    marginTop: 6,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioCircleDisabled: {
    borderColor: colors.textMuted,
    backgroundColor: colors.disabledBackground,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
});
