import React from 'react';
import { Tabs } from 'expo-router';
import { Home, LayoutGrid, ReceiptText, UserCircle2 } from 'lucide-react-native';
import { colors } from '@paiementbj/ui';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { getTranslations } from '../../src/i18n/translations';

export default function TabLayout() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslations(language);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1.5,
          height: 76,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '600',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontFamily: 'Outfit_700Bold',
          fontSize: 19,
          color: colors.primaryDeep,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          headerTitle: t.appName,
          tabBarIcon: ({ color, size }) => (
            <Home size={size || 22} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: t.tabs.services,
          headerTitle: t.headers.services,
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid size={size || 22} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: t.tabs.activity,
          headerTitle: t.headers.activity,
          tabBarIcon: ({ color, size }) => (
            <ReceiptText size={size || 22} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          headerTitle: t.headers.profile,
          tabBarIcon: ({ color, size }) => (
            <UserCircle2 size={size || 22} color={color} strokeWidth={2.2} />
          ),
        }}
      />
    </Tabs>
  );
}
