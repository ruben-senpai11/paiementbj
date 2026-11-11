import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightSlot?: React.ReactNode;
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBackPress,
  rightSlot,
  style,
}) => {
  return (
    <View style={[styles.header, style]} accessibilityRole="header">
      <View style={styles.leftCol}>
        {onBackPress ? (
          <IconButton
            onPress={onBackPress}
            accessibilityLabel="Revenir à l’écran précédent"
            icon={<ArrowLeft size={20} color={colors.primaryDeep} />}
            variant="subtle"
            style={styles.backBtn}
          />
        ) : null}
        <View style={styles.titleWrap}>
          <AppText variant="h3" color={colors.primaryDeep} numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      {rightSlot ? <View style={styles.rightCol}>{rightSlot}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingMobile,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    minHeight: 64,
  },
  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  rightCol: {
    marginLeft: 12,
  },
});
