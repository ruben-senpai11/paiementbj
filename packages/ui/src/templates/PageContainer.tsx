import React from 'react';
import { ScrollView, View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';

export interface PageContainerProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  maxWidth?: number;
  contentStyle?: ViewStyle;
  style?: ViewStyle;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  header,
  footer,
  scrollable = true,
  maxWidth = 680,
  contentStyle,
  style,
}) => {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top']}>
      {header}
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { maxWidth }, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scrollContent, styles.flex1, { maxWidth }, contentStyle]}>
          {children}
        </View>
      )}
      {footer}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
    padding: layout.screenPaddingMobile,
  },
});
