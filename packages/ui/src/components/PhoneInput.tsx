import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { validateAndNormalizeBeninPhone, BeninOperator } from '@paiementbj/shared';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';

export interface PhoneInputProps {
  label?: string;
  value: string;
  onChangePhone: (raw: string, normalized?: string, isValid?: boolean) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label = 'Numéro de téléphone au Bénin',
  value,
  onChangePhone,
  error,
  containerStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const validation = validateAndNormalizeBeninPhone(value);

  const handleChange = (text: string) => {
    // Ne garder que chiffres et espaces
    const sanitized = text.replace(/[^\d\s]/g, '');
    const res = validateAndNormalizeBeninPhone(sanitized);
    onChangePhone(sanitized, res.normalized, res.isValid);
  };

  const getOperatorBadge = (operator: BeninOperator) => {
    switch (operator) {
      case 'MTN':
        return { label: 'MTN', bg: '#FFCC00', fg: '#000000' };
      case 'MOOV':
        return { label: 'Moov', bg: '#0055A5', fg: '#FFFFFF' };
      case 'CELTIIS':
        return { label: 'Celtiis', bg: '#064B32', fg: '#FFFFFF' };
      default:
        return null;
    }
  };

  const badge = getOperatorBadge(validation.operator);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelRow}>
        <AppText variant="caption" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
        {badge && (
          <View style={[styles.operatorBadge, { backgroundColor: badge.bg }]}>
            <AppText
              variant="caption"
              color={badge.fg}
              style={styles.operatorText}
            >
              {badge.label}
            </AppText>
          </View>
        )}
      </View>

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : undefined,
        ]}
      >
        <View style={styles.countryCodeBadge}>
          <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.countryCodeText}>
            🇧🇯 +229
          </AppText>
        </View>

        <RNTextInput
          value={value}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType="phone-pad"
          placeholder="01 97 00 00 00"
          placeholderTextColor={colors.textMuted}
          maxLength={14}
          accessibilityLabel="Numéro de téléphone à 8 ou 10 chiffres"
          accessibilityHint="Saisissez votre numéro sans l’indicatif +229"
          style={styles.input}
        />
      </View>

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
          Format 8 chiffres (97...) ou 10 chiffres ARCEP (01 97...)
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontWeight: '600',
  },
  operatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  operatorText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    height: layout.inputHeight,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    overflow: 'hidden',
  },
  countryCodeBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  countryCodeText: {
    fontWeight: '700',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.borderFocused,
    backgroundColor: '#FAFDFB',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  errorText: {
    marginTop: 4,
    fontWeight: '500',
  },
  helpText: {
    marginTop: 4,
  },
});
