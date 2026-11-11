import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  AccessibilityState,
} from 'react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';

export interface TextButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'primary' | 'danger' | 'neutral';
  style?: ViewStyle;
  testID?: string;
  accessibilityHint?: string;
}

export const TextButton: React.FC<TextButtonProps> = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  tone = 'primary',
  style,
  testID,
  accessibilityHint,
}) => {
  const isDisabled = disabled || loading;
  const textColor =
    isDisabled
      ? colors.textMuted
      : tone === 'danger'
      ? colors.danger
      : tone === 'neutral'
      ? colors.textSecondary
      : colors.primary;

  const accessibilityState: AccessibilityState = {
    disabled: isDisabled,
    busy: loading,
  };

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} accessibilityLabel="Chargement" />
      ) : (
        <AppText variant="bodyMedium" color={textColor} style={styles.label}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: layout.borderRadius.sm,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
    transform: [{ scale: 0.985 }],
  },
  label: {
    fontWeight: '700',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
