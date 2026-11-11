import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: (focused: boolean) => React.ReactNode;
  accessibilityLabel?: string;
}

export interface BottomNavigationProps {
  items: BottomNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  style?: ViewStyle;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeKey,
  onSelect,
  style,
}) => {
  return (
    <View style={[styles.bar, style]} accessibilityRole="tablist">
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel={item.accessibilityLabel || item.label}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [
              styles.tab,
              isActive && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
          >
            <View style={styles.iconWrap}>{item.icon(isActive)}</View>
            <AppText
              variant="caption"
              color={isActive ? colors.primaryDeep : colors.textSecondary}
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 64,
  },
  tab: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: layout.borderRadius.sm,
    paddingVertical: 4,
  },
  tabActive: {
    backgroundColor: colors.primarySoft,
  },
  tabPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
    fontWeight: '700',
  },
});
