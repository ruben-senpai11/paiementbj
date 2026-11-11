import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  colors,
  layout,
  AppText,
  SearchInput,
  ServiceCard,
  EmptyState,
  LoadingState,
} from '@paiementbj/ui';
import { ServiceItem, ServiceCategoryType } from '@paiementbj/types';
import { STANDARD_MESSAGES } from '@paiementbj/shared';
import { api } from '../../src/services/api';

export default function ServicesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cat?: string; q?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>(params.cat || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>(params.q || '');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadServices = async () => {
    try {
      const data = await api.services.list();
      setServices(data);
    } catch {
      // Résilience
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const categories = [
    { key: 'ALL', label: 'Tous les services' },
    { key: ServiceCategoryType.UTILITIES_BILLS, label: '⚡ Factures & Abonnements' },
    { key: ServiceCategoryType.PUBLIC_ADMINISTRATION, label: '🏛 Démarches Publiques' },
    { key: ServiceCategoryType.GOODS_SERVICES, label: '🛍 Biens & Services' },
  ];

  const filteredServices = services.filter((s) => {
    const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.organization?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher par nom, organisme..."
        />

        {/* Filtres de catégories accessibles */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key)}
                accessible={true}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
              >
                <AppText
                  variant="caption"
                  color={isSelected ? colors.textOnPrimary : colors.text}
                  style={styles.chipText}
                >
                  {cat.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadServices();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <LoadingState message="Chargement du catalogue des services..." />
        ) : filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onPress={() => router.push(`/service/${service.id}` as any)}
            />
          ))
        ) : (
          <EmptyState
            iconSymbol="🔍"
            title="Aucun service trouvé"
            description="Aucun service ne correspond à vos critères de recherche. Vérifiez l’orthographe ou réinitialisez les filtres."
            actionLabel="Réinitialiser les filtres"
            onAction={() => {
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
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
  headerArea: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingMobile,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryScroll: {
    marginVertical: 10,
  },
  categoryScrollContent: {
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundMint,
    marginRight: 8,
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontWeight: '600',
    fontSize: 13,
  },
  listContent: {
    padding: layout.screenPaddingMobile,
    paddingBottom: 40,
  },
});
