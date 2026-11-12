import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors, layout, AppText } from '@paiementbj/ui';
import { FlagStripe } from '../atoms/FlagStripe';

interface HomeHeroBannerProps {
  title: string;
  subtitle: string;
  isAuthenticated: boolean;
  connectLabel: string;
  connectedText?: string;
  onPressConnect: () => void;
}

export function HomeHeroBanner({
  title,
  subtitle,
  isAuthenticated,
  connectLabel,
  connectedText,
  onPressConnect,
}: HomeHeroBannerProps) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.topRow}>
        <FlagStripe />
      </View>

      <AppText variant="h1" color={colors.textOnPrimary} style={styles.title}>
        {title}
      </AppText>
      <AppText variant="bodyLarge" color={colors.primarySoft} style={styles.subtitle}>
        {subtitle}
      </AppText>

      {!isAuthenticated ? (
        <Pressable
          onPress={onPressConnect}
          style={styles.ctaButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={connectLabel}
        >
          <AppText variant="bodyMedium" color={colors.accentDark} style={styles.ctaText}>
            {connectLabel}
          </AppText>
          <ArrowRight size={18} color={colors.accentDark} />
        </Pressable>
      ) : (
        <View style={styles.userPill}>
          <AppText variant="caption" color={colors.textOnPrimary} style={styles.userPillText}>
            {connectedText}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: layout.borderRadius.lg,
    padding: 24,
    marginBottom: 20,
  },
  topRow: {
    marginBottom: 14,
  },
  title: {
    marginBottom: 6,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginBottom: 20,
    lineHeight: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minTouchTarget,
  },
  ctaText: {
    fontWeight: '700',
  },
  userPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: layout.borderRadius.full,
  },
  userPillText: {
    fontWeight: '600',
  },
});
