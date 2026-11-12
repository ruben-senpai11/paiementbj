import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from '../atoms/AppText';
import { PrimaryButton } from '../atoms/PrimaryButton';

export interface EmptyStateProps {
  iconSymbol?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconSymbol = '📋',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]} accessible={true}>
      <View style={styles.iconCircle}>
        <AppText variant="h1" style={styles.icon}>
          {iconSymbol}
        </AppText>
      </View>
      <AppText variant="h3" color={colors.text} align="center" style={styles.title}>
        {title}
      </AppText>
      <AppText
        variant="body"
        color={colors.textSecondary}
        align="center"
        style={styles.description}
      >
        {description}
      </AppText>
      {actionLabel && onAction && (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginVertical: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    marginBottom: 8,
    fontWeight: '700',
  },
  description: {
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    minWidth: 180,
  },
});
