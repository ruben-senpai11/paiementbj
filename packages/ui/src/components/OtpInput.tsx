import React, { useRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';

export interface OtpInputProps {
  value: string;
  onChangeOtp: (otp: string) => void;
  length?: number;
  error?: string;
  containerStyle?: ViewStyle;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChangeOtp,
  length = 6,
  error,
  containerStyle,
}) => {
  const hiddenInputRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);

  const handleTextChange = (text: string) => {
    // Nettoyer pour ne garder que les chiffres jusqu'à `length`
    const sanitized = text.replace(/[^\d]/g, '').slice(0, length);
    onChangeOtp(sanitized);
  };

  const focusInput = () => {
    hiddenInputRef.current?.focus();
  };

  const digits = value.split('');

  return (
    <View style={[styles.container, containerStyle]}>
      <AppText variant="caption" color={colors.textSecondary} style={styles.label}>
        Code de confirmation (6 chiffres)
      </AppText>

      {/* Input natif invisible mais focusable et accessible : permet le copier-coller et l'autofill SMS */}
      <RNTextInput
        ref={hiddenInputRef}
        value={value}
        onChangeText={handleTextChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        accessible={true}
        accessibilityLabel="Code de confirmation OTP à 6 chiffres"
        accessibilityHint="Collez ou saisissez le code reçu par SMS"
        style={styles.hiddenInput}
      />

      {/* Rendu visuel accessible des 6 cellules */}
      <Pressable
        onPress={focusInput}
        accessible={false}
        style={styles.cellsRow}
      >
        {Array.from({ length }).map((_, idx) => {
          const char = digits[idx] || '';
          const isFocusedCell = idx === value.length && value.length < length;

          return (
            <View
              key={idx}
              style={[
                styles.cell,
                isFocusedCell && styles.cellFocused,
                char ? styles.cellFilled : undefined,
                error ? styles.cellError : undefined,
              ]}
            >
              <AppText variant="h2" color={colors.text} style={styles.cellText}>
                {char}
              </AppText>
            </View>
          );
        })}
      </Pressable>

      {error ? (
        <AppText
          variant="caption"
          color={colors.danger}
          style={styles.errorText}
          accessibilityRole="alert"
        >
          {error}
        </AppText>
      ) : (
        <AppText variant="caption" color={colors.textMuted} style={styles.helpText}>
          Le copier-coller et le remplissage automatique du code sont autorisés.
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0.01,
    height: 1,
    width: 1,
  },
  cellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cell: {
    width: 48,
    height: 56,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellFocused: {
    borderColor: colors.borderFocused,
    backgroundColor: '#FAFDFB',
    transform: [{ scale: 1.05 }],
  },
  cellFilled: {
    borderColor: colors.primary,
  },
  cellError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  cellText: {
    fontWeight: '800',
  },
  errorText: {
    marginTop: 8,
    fontWeight: '500',
  },
  helpText: {
    marginTop: 6,
  },
});
