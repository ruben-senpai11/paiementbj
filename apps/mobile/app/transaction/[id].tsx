import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  colors,
  layout,
  AppText,
  ReceiptCard,
  PrimaryButton,
  SecondaryButton,
  LoadingState,
  ErrorState,
} from '@paiementbj/ui';
import { Receipt, TransactionSummary } from '@paiementbj/types';
import { formatFCFA } from '@paiementbj/shared';
import { api } from '../../src/services/api';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [transaction, setTransaction] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        if (id) {
          try {
            const r = await api.transactions.getReceipt(id);
            setReceipt(r);
          } catch {
            // Si le reçu n'est pas encore disponible
          }
          const t = await api.transactions.getById(id);
          setTransaction(t);
        }
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les détails de cette transaction.');
      } finally {
        setLoading(false);
      }
    };

    void fetchTransactionData();
  }, [id]);

  const handleShareReceipt = async () => {
    if (!receipt) return;
    try {
      await Share.share({
        title: `Reçu Paiement BJ ${receipt.receiptNumber}`,
        message: `Justificatif de télépaiement Paiement BJ\nNuméro : ${receipt.receiptNumber}\nBénéficiaire : ${receipt.beneficiaryName}\nMontant : ${formatFCFA(receipt.totalAmount)}\nRéf : ${receipt.serviceReference}\nEmpreinte SHA-256 : ${receipt.digitalSignatureHash}`,
      });
    } catch {
      // Annulation partage
    }
  };

  const handleReportProblem = () => {
    router.push({
      pathname: '/support',
      params: {
        transactionId: id,
        prefillTitle: `Réclamation sur transaction ${transaction?.reference || id}`,
      },
    });
  };

  if (loading) {
    return <LoadingState message="Chargement du reçu..." />;
  }

  if (error && !transaction && !receipt) {
    return (
      <View style={styles.center}>
        <ErrorState
          title="Détail indisponible"
          message={error}
          onRetry={() => router.back()}
          retryLabel="Retour"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {receipt ? (
        <>
          <ReceiptCard receipt={receipt} />
          <PrimaryButton
            label="Partager ou enregistrer le justificatif"
            onPress={handleShareReceipt}
            style={styles.btn}
          />
        </>
      ) : (
        <View style={styles.pendingReceiptCard}>
          <AppText variant="h3" color={colors.warning} style={styles.pendingTitle}>
            Reçu en attente d’émission
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.pendingDesc}>
            Le reçu officiel ne peut être généré qu’après la confirmation définitive du paiement par le réseau partenaire.
          </AppText>
        </View>
      )}

      <SecondaryButton
        label="Signaler une difficulté sur ce paiement"
        onPress={handleReportProblem}
        style={styles.secondaryBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layout.screenPaddingMobile,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: layout.screenPaddingMobile,
  },
  btn: {
    width: '100%',
    marginTop: 12,
  },
  secondaryBtn: {
    width: '100%',
    marginTop: 12,
  },
  pendingReceiptCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    marginVertical: 16,
  },
  pendingTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  pendingDesc: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
