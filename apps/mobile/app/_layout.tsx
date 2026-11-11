import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { colors, AccessibilityPreferencesProvider } from '@paiementbj/ui';
import { useAuthStore } from '../src/store/useAuthStore';
import { useSettingsStore } from '../src/store/useSettingsStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const { hydrateAuth } = useAuthStore();
  const { hydrateSettings, reducedMotion, largeFont } = useSettingsStore();

  const [fontsLoaded] = useFonts({
    Outfit: Outfit_700Bold,
    DMSans: DMSans_400Regular,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    void hydrateAuth();
    void hydrateSettings();
  }, [hydrateAuth, hydrateSettings]);

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AccessibilityPreferencesProvider value={{ largeFont, reducedMotion }}>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.primaryDeep,
                headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18 },
                contentStyle: { backgroundColor: colors.background },
                animation: reducedMotion ? 'none' : 'fade_from_bottom',
              }}
            >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="auth/index"
              options={{ title: 'Connexion / Inscription', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="auth/otp"
              options={{ title: 'Vérification du code', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="service/[id]"
              options={{ title: 'Préparer un paiement', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="payment/select-provider"
              options={{ title: 'Choisir le moyen de paiement', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="payment/confirm"
              options={{ title: 'Confirmation du débit', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="transaction/[id]"
              options={{ title: 'Détail de l’opération', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="transfers/index"
              options={{ title: 'Transferts interopérables', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="international/index"
              options={{ title: 'Paiements diaspora & touristes', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="support/index"
              options={{ title: 'Assistance & réclamations', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="support/faq"
              options={{ title: 'Questions fréquentes (FAQ)', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="profile/devices"
              options={{ title: 'Appareils & sessions', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="profile/identity"
              options={{ title: 'Identité ANIP & consentements', headerShadowVisible: false }}
            />
            <Stack.Screen
              name="profile/settings"
              options={{ title: 'Préférences & confidentialité', headerShadowVisible: false }}
            />
          </Stack>
          </QueryClientProvider>
        </AccessibilityPreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
