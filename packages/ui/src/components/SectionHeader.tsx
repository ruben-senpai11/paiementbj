import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <AppText variant="h2" color={colors.text} style={styles.title}>
        {title}
      </AppText>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} pour ${title}`}
          style={styles.actionPressable}
        >
          <AppText variant="bodySmall" color={colors.primary} style={styles.actionLabel}>
            {actionLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  title: {
    fontWeight: '700',
    fontSize: 20,
  },
  actionPressable: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actionLabel: {
    fontWeight: '700',
  },
});
