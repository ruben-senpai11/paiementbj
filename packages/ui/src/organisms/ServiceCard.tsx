import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { ServiceItem } from '@paiementbj/types';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from '../atoms/AppText';
import { BrandLogo } from '../atoms/BrandLogo';

export interface ServiceCardProps {
  service: ServiceItem;
  onPress: () => void;
  style?: ViewStyle;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${service.title}, ${service.organization?.name || 'Service'}`}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <BrandLogo
          brandKey={service.organization?.logoAssetKey || 'tresor'}
          size={44}
          style={styles.logo}
        />
        <View style={styles.infoCol}>
          <AppText variant="bodyMedium" color={colors.text} style={styles.title} numberOfLines={2}>
            {service.title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {service.organization?.name || 'Administration publique'}
          </AppText>
        </View>
      </View>

      <AppText variant="caption" color={colors.textMuted} numberOfLines={2} style={styles.desc}>
        {service.description}
      </AppText>

      <View style={styles.footerRow}>
        <AppText variant="caption" color={colors.primaryDeep} style={styles.actionPrompt}>
          Payer ce service →
        </AppText>
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
    minHeight: 110,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderFocused,
    transform: [{ scale: 0.99 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  desc: {
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 10,
  },
  actionPrompt: {
    fontWeight: '700',
  },
});
