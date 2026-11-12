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

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'royal' | 'yellow';
  style?: ViewStyle;
  testID?: string;
  accessibilityHint?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  tone = 'royal',
  style,
  testID,
  accessibilityHint,
}) => {
  const isDisabled = disabled || loading;

  const accessibilityState: AccessibilityState = {
    disabled: isDisabled,
    busy: loading,
  };

  const isYellow = tone === 'yellow';
  const activeBg = isYellow ? colors.accent : colors.primary;
  const pressedBg = isYellow ? colors.accentHover : colors.primaryDeep;
  const textColor = isYellow ? colors.accentDark : colors.textOnPrimary;

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
        { backgroundColor: activeBg },
        isDisabled && styles.disabled,
        pressed && !isDisabled && { backgroundColor: pressedBg, transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
          accessibilityLabel="Chargement en cours"
        />
      ) : (
        <AppText
          variant="bodyMedium"
          color={isDisabled ? colors.disabledText : textColor}
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
    borderRadius: layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  disabled: {
    backgroundColor: colors.disabledBackground,
    borderWidth: 1,
    borderColor: colors.disabledBorder,
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
  },
});
