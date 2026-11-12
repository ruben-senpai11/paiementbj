import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors, layout, AppText } from '@paiementbj/ui';

interface CategoryShortcutProps {
  label: string;
  backgroundColor?: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export function CategoryShortcut({
  label,
  backgroundColor = colors.primarySoft,
  icon,
  onPress,
}: CategoryShortcutProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.item}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconCircle, { backgroundColor }]}>{icon}</View>
      <AppText variant="caption" color={colors.text} style={styles.label} numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    width: '23%',
    minHeight: layout.minTouchTarget,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
});
