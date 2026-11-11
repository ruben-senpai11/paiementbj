import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';

export interface RadioButtonProps {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  description,
  selected,
  onSelect,
  disabled = false,
  style,
}) => {
  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      accessible={true}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      accessibilityHint={description}
      style={({ pressed }) => [
        styles.container,
        selected && styles.selectedContainer,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={[styles.circle, selected && styles.circleSelected]}>
        {selected ? <View style={styles.dot} /> : null}
      </View>
      <View style={styles.textCol}>
        <AppText variant="bodySmall" color={colors.text} style={styles.label}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" color={colors.textSecondary} style={styles.desc}>
            {description}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.minTouchTarget,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  selectedContainer: {
    borderColor: colors.borderFocused,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderFocused,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: colors.surface,
  },
  circleSelected: {
    borderColor: colors.primary,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontWeight: '700',
  },
  desc: {
    marginTop: 2,
    lineHeight: 18,
  },
});
