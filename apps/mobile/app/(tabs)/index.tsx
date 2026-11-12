import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, Landmark, ArrowLeftRight, Globe } from 'lucide-react-native';
import {
  colors,
  SearchInput,
  SectionHeader,
  ServiceCard,
  TransactionCard,
  EmptyState,
  LoadingState,
} from '@paiementbj/ui';
import { ServiceItem, TransactionSummary } from '@paiementbj/types';
import { STANDARD_MESSAGES } from '@paiementbj/shared';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { getTranslations } from '../../src/i18n/translations';
import { api } from '../../src/services/api';
import { CategoryShortcut } from '../../src/components/molecules/CategoryShortcut';
import { HomeHeroBanner } from '../../src/components/organisms/HomeHeroBanner';
import { ScreenContainer } from '../../src/components/templates/ScreenContainer';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const language = useSettingsStore((s) => s.language);
  const t = getTranslations(language);

  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const servicesData = await api.services.list();
      setServices(servicesData);

      if (isAuthenticated) {
        const txData = await api.transactions.list();
        setTransactions(txData);
      } else {
        setTransactions([]);
      }
    } catch {
      // Conserve l'état courant sans erreur bloquante
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  const popularServices = services.slice(0, 4);

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <HomeHeroBanner
        title={t.appName}
        subtitle={t.tagline}
        isAuthenticated={isAuthenticated}
        connectLabel={t.common.connect}
        connectedText={`${t.home.connectedPrefix} ${user?.phone || ''} (${t.home.level1Short})`}
        onPressConnect={() => router.push('/auth')}
      />

      <SearchInput
        value={searchQuery}
        onChangeText={(q) => {
          setSearchQuery(q);
          if (q.length > 2) {
            router.push(`/services?q=${encodeURIComponent(q)}` as any);
          }
        }}
        placeholder={t.home.searchPlaceholder}
      />

      <View style={styles.categoriesGrid}>
        <CategoryShortcut
          label={t.home.catUtilities}
          backgroundColor={colors.primarySoft}
          icon={<Zap size={22} color={colors.primaryDeep} strokeWidth={2.2} />}
          onPress={() => router.push('/services?cat=UTILITIES_BILLS' as any)}
        />
        <CategoryShortcut
          label={t.home.catPublic}
          backgroundColor={colors.primarySoft}
          icon={<Landmark size={22} color={colors.primaryDeep} strokeWidth={2.2} />}
          onPress={() => router.push('/services?cat=PUBLIC_ADMINISTRATION' as any)}
        />
        <CategoryShortcut
          label={t.home.catTransfers}
          backgroundColor={colors.accentSoft}
          icon={<ArrowLeftRight size={22} color={colors.accentDark} strokeWidth={2.2} />}
          onPress={() => router.push('/transfers')}
        />
        <CategoryShortcut
          label={t.home.catDiaspora}
          backgroundColor={colors.primarySoft}
          icon={<Globe size={22} color={colors.primaryDeep} strokeWidth={2.2} />}
          onPress={() => router.push('/international')}
        />
      </View>

      <SectionHeader
        title={t.home.popularTitle}
        actionLabel={t.home.seeAll}
        onAction={() => router.push('/services')}
      />

      {loading ? (
        <LoadingState message="Chargement des services..." />
      ) : (
        popularServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onPress={() => router.push(`/service/${service.id}` as any)}
          />
        ))
      )}

      <SectionHeader
        title={t.home.recentTitle}
        actionLabel={transactions.length > 0 ? t.home.fullHistory : undefined}
        onAction={() => router.push('/activity')}
      />

      {transactions.length > 0 ? (
        transactions.slice(0, 3).map((tx) => (
          <TransactionCard
            key={tx.id}
            transaction={tx}
            onPress={() => router.push(`/transaction/${tx.id}` as any)}
          />
        ))
      ) : (
        <EmptyState
          title={t.home.emptyTitle}
          description={STANDARD_MESSAGES.emptyTransactions}
          actionLabel={t.common.exploreServices}
          onAction={() => router.push('/services')}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
});
