import React from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { colors, layout } from '@paiementbj/ui';

interface ScreenContainerProps {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ScreenContainer({
  children,
  refreshing,
  onRefresh,
}: ScreenContainerProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.outerContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  outerContent: {
    padding: layout.screenPaddingMobile,
    paddingBottom: 48,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 720,
  },
});
