import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

export type SnackbarVariant = 'info' | 'success' | 'warning' | 'error';

export interface SnackbarProps {
  visible: boolean;
  message: string;
  variant?: SnackbarVariant;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  variant = 'info',
  onDismiss,
  style,
}) => {
  if (!visible) return null;

  const config =
    variant === 'success'
      ? { bg: colors.successSoft, fg: colors.success, Icon: CheckCircle2 }
      : variant === 'warning'
      ? { bg: colors.warningSoft, fg: colors.warning, Icon: AlertTriangle }
      : variant === 'error'
      ? { bg: colors.dangerSoft, fg: colors.danger, Icon: XCircle }
      : { bg: colors.primarySoft, fg: colors.primaryDeep, Icon: Info };

  const IconComp = config.Icon;

  return (
    <View
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        { backgroundColor: config.bg, borderColor: config.fg },
        style,
      ]}
    >
      <IconComp size={20} color={config.fg} style={styles.icon} />
      <AppText variant="bodySmall" color={config.fg} style={styles.text}>
        {message}
      </AppText>
      {onDismiss ? (
        <IconButton
          onPress={onDismiss}
          accessibilityLabel="Fermer le message"
          icon={<X size={18} color={config.fg} />}
          variant="subtle"
          style={styles.closeBtn}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    marginVertical: 8,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 19,
  },
  closeBtn: {
    marginLeft: 8,
  },
});
