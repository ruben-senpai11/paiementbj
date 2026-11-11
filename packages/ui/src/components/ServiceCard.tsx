import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { ServiceItem } from '@paiementbj/types';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';
import { BrandLogo } from './BrandLogo';
import { StatusBadge } from './StatusBadge';

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
  const isAvailable =
    service.integrationStatus === 'LIVE' ||
    service.integrationStatus === 'SANDBOX_CONNECTED';

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Service: ${service.title}, organisme: ${service.organization?.name || 'Service public'}`}
      accessibilityHint={isAvailable ? 'Appuyez pour préparer ce paiement' : 'Service actuellement non disponible'}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        !isAvailable && styles.cardDisabled,
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
        <StatusBadge status={service.integrationStatus} />
        <AppText variant="caption" color={colors.primary} style={styles.actionPrompt}>
          {isAvailable ? 'Accéder →' : 'Indisponible'}
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
    backgroundColor: '#FAFCFA',
    borderColor: colors.borderFocused,
    transform: [{ scale: 0.99 }],
  },
  cardDisabled: {
    opacity: 0.75,
    backgroundColor: '#F8FAF8',
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
  },
  desc: {
    marginBottom: 12,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionPrompt: {
    fontWeight: '700',
  },
});
