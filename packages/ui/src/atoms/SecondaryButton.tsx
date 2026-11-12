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

export interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityHint?: string;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
  testID,
  accessibilityHint,
}) => {
  const isDisabled = disabled || loading;

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
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          accessibilityLabel="Chargement en cours"
        />
      ) : (
        <AppText
          variant="bodyMedium"
          color={isDisabled ? colors.disabledText : colors.primaryDeep}
          style={styles.label}
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: layout.primaryButtonHeight,
    minHeight: layout.minTouchTarget,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    borderColor: colors.disabledBorder,
    backgroundColor: colors.surfaceSubtle,
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
  },
});
