import React, { useState } from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Sélectionner une option',
  options,
  value,
  onChange,
  error,
  helpText,
  disabled = false,
  style,
}) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, style]}>
      <AppText variant="caption" color={colors.textSecondary} style={styles.label}>
        {label}
      </AppText>

      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${selectedOption ? selectedOption.label : placeholder}`}
        accessibilityState={{ expanded: open, disabled }}
        style={({ pressed }) => [
          styles.trigger,
          error ? styles.triggerError : undefined,
          pressed && !disabled && styles.triggerPressed,
          disabled && styles.triggerDisabled,
        ]}
      >
        <AppText
          variant="body"
          color={selectedOption ? colors.text : colors.textMuted}
          style={styles.triggerText}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </AppText>
        <ChevronDown size={20} color={colors.textSecondary} />
      </Pressable>

      {error ? (
        <AppText variant="caption" color={colors.danger} accessibilityRole="alert" style={styles.error}>
          {error}
        </AppText>
      ) : helpText ? (
        <AppText variant="caption" color={colors.textMuted} style={styles.help}>
          {helpText}
        </AppText>
      ) : null}

      <BottomSheet visible={open} title={label} onClose={() => setOpen(false)}>
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              accessible={true}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={[styles.optionRow, isSelected && styles.optionSelected]}
            >
              <View style={styles.optionTextCol}>
                <AppText variant="bodySmall" color={colors.text} style={styles.optionLabel}>
                  {opt.label}
                </AppText>
                {opt.description ? (
                  <AppText variant="caption" color={colors.textSecondary}>
                    {opt.description}
                  </AppText>
                ) : null}
              </View>
              {isSelected ? <Check size={20} color={colors.primaryDeep} /> : null}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
  },
  trigger: {
    minHeight: layout.inputHeight,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.sm,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerPressed: {
    borderColor: colors.borderFocused,
  },
  triggerError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  triggerText: {
    flex: 1,
    marginRight: 8,
  },
  error: {
    marginTop: 4,
    fontWeight: '600',
  },
  help: {
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.minTouchTarget,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: layout.borderRadius.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderFocused,
  },
  optionTextCol: {
    flex: 1,
    marginRight: 8,
  },
  optionLabel: {
    fontWeight: '700',
  },
});
