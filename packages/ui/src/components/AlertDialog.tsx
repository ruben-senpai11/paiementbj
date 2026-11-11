import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../tokens/colors';
import { AppText } from './AppText';
import { Modal } from './Modal';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

export interface AlertDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal visible={visible} title={title} onClose={onCancel}>
      <AppText variant="body" color={colors.textSecondary} style={styles.message}>
        {message}
      </AppText>
      <View style={styles.actions}>
        <SecondaryButton label={cancelLabel} onPress={onCancel} disabled={loading} style={styles.btn} />
        <PrimaryButton
          label={confirmLabel}
          onPress={onConfirm}
          loading={loading}
          style={destructive ? { ...styles.btn, ...styles.destructiveBtn } : styles.btn}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  message: {
    lineHeight: 22,
    marginBottom: 18,
  },
  actions: {
    gap: 10,
  },
  btn: {
    width: '100%',
  },
  destructiveBtn: {
    backgroundColor: colors.danger,
  },
});
