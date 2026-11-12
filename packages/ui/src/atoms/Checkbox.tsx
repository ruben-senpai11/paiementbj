import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';

export interface CheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  style?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  error,
  style,
}) => {
  return (
    <View style={[styles.wrapper, style]}>
      <Pressable
        onPress={() => onChange(!checked)}
        disabled={disabled}
        accessible={true}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={label}
        accessibilityHint={description}
        style={({ pressed }) => [
          styles.row,
          pressed && !disabled && styles.rowPressed,
          disabled && styles.rowDisabled,
        ]}
      >
        <View
          style={[
            styles.box,
            checked && styles.boxChecked,
            error ? styles.boxError : undefined,
            disabled && styles.boxDisabled,
          ]}
        >
          {checked ? <Check size={16} color={colors.textOnPrimary} strokeWidth={3} /> : null}
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
      {error ? (
        <AppText variant="caption" color={colors.danger} accessibilityRole="alert" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: layout.minTouchTarget,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: layout.borderRadius.xs,
  },
  rowPressed: {
    backgroundColor: colors.primarySoft,
  },
  rowDisabled: {
    opacity: 0.65,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderFocused,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  boxError: {
    borderColor: colors.danger,
  },
  boxDisabled: {
    backgroundColor: colors.disabledBackground,
    borderColor: colors.textMuted,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontWeight: '600',
    lineHeight: 20,
  },
  desc: {
    marginTop: 2,
    lineHeight: 18,
  },
  error: {
    marginTop: 4,
    marginLeft: 36,
    fontWeight: '600',
  },
});
