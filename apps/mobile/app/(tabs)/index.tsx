import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Zap,
  Landmark,
  ArrowLeftRight,
  Globe,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react-native';
import {
  colors,
  layout,
  AppText,
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
      // Les erreurs réseau gardent l'état vide honnête sans données fictives
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Bandeau d'en-tête institutionnel */}
      <View style={styles.heroCard}>
        <View style={styles.badgeRow}>
          <View style={styles.nationalBadge}>
            <View style={styles.flagMini}>
              <View style={{ flex: 1, backgroundColor: '#008751' }} />
              <View style={{ flex: 1, backgroundColor: '#FCD116' }} />
              <View style={{ flex: 1, backgroundColor: '#E8112D' }} />
            </View>
            <AppText variant="caption" color={colors.textOnPrimary} style={styles.badgeText}>
              {t.countryBadge}
            </AppText>
          </View>
        </View>

        <AppText variant="h1" color={colors.textOnPrimary} style={styles.heroTitle}>
          {t.appName}
        </AppText>
        <AppText variant="bodyLarge" color="#D4EADB" style={styles.heroSubtitle}>
          {t.tagline}
        </AppText>

        {!isAuthenticated ? (
          <Pressable
            onPress={() => router.push('/auth')}
            style={styles.connectPrompt}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t.common.connect}
          >
            <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.connectText}>
              {t.common.connect}
            </AppText>
            <ArrowRight size={18} color={colors.primaryDeep} />
          </Pressable>
        ) : (
          <View style={styles.userGreeting}>
            <AppText variant="caption" color="#FFFFFF">
              {t.home.connectedPrefix} {user?.phone} ({t.home.level1Short})
            </AppText>
          </View>
        )}
      </View>

      {/* Barre de recherche rapide */}
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

      {/* Raccourcis des catégories prioritaires */}
      <View style={styles.categoriesGrid}>
        <Pressable
          onPress={() => router.push('/services?cat=UTILITIES_BILLS' as any)}
          style={styles.categoryItem}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t.home.catUtilities}
        >
          <View style={[styles.categoryIconCircle, { backgroundColor: colors.primarySoft }]}>
            <Zap size={24} color={colors.primaryDeep} strokeWidth={2.2} />
          </View>
          <AppText variant="caption" color={colors.text} style={styles.categoryLabel}>
            {t.home.catUtilities}
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => router.push('/services?cat=PUBLIC_ADMINISTRATION' as any)}
          style={styles.categoryItem}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t.home.catPublic}
        >
          <View style={[styles.categoryIconCircle, { backgroundColor: '#EBF4FE' }]}>
            <Landmark size={24} color={colors.primaryDeep} strokeWidth={2.2} />
          </View>
          <AppText variant="caption" color={colors.text} style={styles.categoryLabel}>
            {t.home.catPublic}
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => router.push('/transfers')}
          style={styles.categoryItem}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t.home.catTransfers}
        >
          <View style={[styles.categoryIconCircle, { backgroundColor: colors.accentSoft }]}>
            <ArrowLeftRight size={24} color={colors.warning} strokeWidth={2.2} />
          </View>
          <AppText variant="caption" color={colors.text} style={styles.categoryLabel}>
            {t.home.catTransfers}
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => router.push('/international')}
          style={styles.categoryItem}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t.home.catDiaspora}
        >
          <View style={[styles.categoryIconCircle, { backgroundColor: '#F3E8FF' }]}>
            <Globe size={24} color={colors.primaryDeep} strokeWidth={2.2} />
          </View>
          <AppText variant="caption" color={colors.text} style={styles.categoryLabel}>
            {t.home.catDiaspora}
          </AppText>
        </Pressable>
      </View>

      {/* Services prioritaires */}
      <SectionHeader
        title={t.home.popularTitle}
        actionLabel={t.home.seeAll}
        onAction={() => router.push('/services')}
      />

      {loading ? (
        <LoadingState message="Chargement des services officiels..." />
      ) : (
        popularServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onPress={() => router.push(`/service/${service.id}` as any)}
          />
        ))
      )}

      {/* Dernières opérations réelles */}
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

      {/* Notice légale obligatoire : Aucun portefeuille interne */}
      <View style={styles.disclaimerBox} accessible={true}>
        <View style={styles.disclaimerHeader}>
          <ShieldCheck size={16} color={colors.primaryDeep} />
          <AppText variant="caption" color={colors.primaryDeep} style={styles.disclaimerTitle}>
            {t.home.regulationTitle}
          </AppText>
        </View>
        <AppText variant="caption" color={colors.textSecondary} style={styles.disclaimerText}>
          {STANDARD_MESSAGES.noInternalWalletNotice}
        </AppText>
      </View>
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
  heroCard: {
    backgroundColor: colors.primaryDeep,
    borderRadius: layout.borderRadius.lg,
    padding: 20,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  nationalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  flagMini: {
    flexDirection: 'row',
    width: 14,
    height: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    marginBottom: 16,
  },
  connectPrompt: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
  },
  connectText: {
    fontWeight: '700',
  },
  userGreeting: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    padding: 10,
    borderRadius: layout.borderRadius.xs,
  },
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  categoryItem: {
    alignItems: 'center',
    width: '23%',
    minHeight: layout.minTouchTarget,
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryLabel: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  },
  disclaimerBox: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: layout.borderRadius.md,
    marginTop: 16,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  disclaimerTitle: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  disclaimerText: {
    lineHeight: 18,
    fontSize: 12,
  },
});
