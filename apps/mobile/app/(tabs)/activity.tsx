import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  colors,
  layout,
  AppText,
  TransactionCard,
  EmptyState,
  LoadingState,
  PrimaryButton,
} from '@paiementbj/ui';
import { TransactionSummary } from '@paiementbj/types';
import { STANDARD_MESSAGES } from '@paiementbj/shared';
import { useAuthStore } from '../../src/store/useAuthStore';
import { api } from '../../src/services/api';

export default function ActivityScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [filter, setFilter] = useState<'ALL' | 'SUCCEEDED' | 'PENDING'>('ALL');
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await api.transactions.list();
      setTransactions(data);
    } catch {
      // Résilience
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          iconSymbol="🔒"
          title="Connexion requise"
          description="Connectez-vous avec votre numéro de téléphone pour retrouver l’historique vérifié de vos opérations et vos reçus officiels."
          actionLabel="Se connecter"
          onAction={() => router.push('/auth')}
        />
      </View>
    );
  }

  const filtered = transactions.filter((t) => {
    if (filter === 'SUCCEEDED') return t.status === 'SUCCEEDED';
    if (filter === 'PENDING') return t.status === 'PENDING' || t.status === 'PROCESSING';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Filtres de statut */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter('ALL')}
          style={[styles.filterTab, filter === 'ALL' && styles.filterTabActive]}
          accessible={true}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === 'ALL' }}
        >
          <AppText
            variant="caption"
            color={filter === 'ALL' ? colors.primaryDeep : colors.textMuted}
            style={styles.filterText}
          >
            Toutes ({transactions.length})
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => setFilter('SUCCEEDED')}
          style={[styles.filterTab, filter === 'SUCCEEDED' && styles.filterTabActive]}
          accessible={true}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === 'SUCCEEDED' }}
        >
          <AppText
            variant="caption"
            color={filter === 'SUCCEEDED' ? colors.success : colors.textMuted}
            style={styles.filterText}
          >
            Confirmées
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => setFilter('PENDING')}
          style={[styles.filterTab, filter === 'PENDING' && styles.filterTabActive]}
          accessible={true}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === 'PENDING' }}
        >
          <AppText
            variant="caption"
            color={filter === 'PENDING' ? colors.warning : colors.textMuted}
            style={styles.filterText}
          >
            En cours
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadTransactions();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <LoadingState message="Récupération de vos transactions..." />
        ) : filtered.length > 0 ? (
          filtered.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              onPress={() => router.push(`/transaction/${tx.id}` as any)}
            />
          ))
        ) : (
          <EmptyState
            iconSymbol="📑"
            title="Aucune transaction trouvée"
            description={STANDARD_MESSAGES.emptyTransactions}
            actionLabel="Effectuer un paiement"
            onAction={() => router.push('/services')}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: layout.screenPaddingMobile,
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingMobile,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primarySoft,
  },
  filterText: {
    fontWeight: '700',
  },
  listContent: {
    padding: layout.screenPaddingMobile,
    paddingBottom: 40,
  },
});
