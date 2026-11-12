import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from '../atoms/AppText';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Rechercher un service, organisme ou taxe...',
  onClear,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        style,
      ]}
    >
      <AppText variant="body" color={colors.textSecondary} style={styles.icon}>
        🔍
      </AppText>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessible={true}
        accessibilityLabel="Recherche de services de paiement"
        accessibilityRole="search"
        style={styles.input}
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Effacer la recherche"
          style={styles.clearButton}
        >
          <AppText variant="caption" color={colors.textSecondary} style={styles.clearText}>
            ✕
          </AppText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.inputHeight,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: 14,
    marginVertical: 8,
  },
  containerFocused: {
    borderColor: colors.borderFocused,
    backgroundColor: colors.primarySoft,
  },
  icon: {
    marginRight: 10,
    fontSize: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  clearText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
