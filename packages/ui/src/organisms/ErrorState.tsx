import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from '../atoms/AppText';
import { PrimaryButton } from '../atoms/PrimaryButton';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Difficulté rencontrée',
  message,
  onRetry,
  retryLabel = 'Réessayer',
  style,
}) => {
  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="alert"
    >
      <View style={styles.iconCircle}>
        <AppText variant="h2" color={colors.danger} style={styles.icon}>
          ⚠
        </AppText>
      </View>
      <AppText variant="h3" color={colors.danger} align="center" style={styles.title}>
        {title}
      </AppText>
      <AppText
        variant="body"
        color={colors.textSecondary}
        align="center"
        style={styles.message}
      >
        {message}
      </AppText>
      {onRetry && (
        <PrimaryButton
          label={retryLabel}
          onPress={onRetry}
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
    borderColor: colors.danger,
    marginVertical: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dangerSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontWeight: '800',
  },
  title: {
    marginBottom: 6,
    fontWeight: '700',
  },
  message: {
    lineHeight: 22,
    marginBottom: 16,
    maxWidth: 320,
  },
  button: {
    minWidth: 160,
  },
});
