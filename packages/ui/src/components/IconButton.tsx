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

export interface IconButtonProps {
  icon: React.ReactNode;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'surface' | 'subtle' | 'primary';
  size?: number;
  style?: ViewStyle;
  testID?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  accessibilityLabel,
  onPress,
  disabled = false,
  loading = false,
  variant = 'surface',
  size = layout.minTouchTarget,
  style,
  testID,
}) => {
  const isDisabled = disabled || loading;
  const effectiveSize = Math.max(size, layout.minTouchTarget);

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
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={({ pressed }) => [
        styles.base,
        {
          width: effectiveSize,
          height: effectiveSize,
          borderRadius: effectiveSize / 2,
        },
        variant === 'surface' && styles.surface,
        variant === 'subtle' && styles.subtle,
        variant === 'primary' && styles.primary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.textOnPrimary : colors.primary}
        />
      ) : (
        icon
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  subtle: {
    backgroundColor: colors.primarySoft,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  pressed: {
    borderColor: colors.borderFocused,
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
