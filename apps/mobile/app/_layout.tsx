import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, useWindowDimensions } from 'react-native';
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

if (Platform.OS === 'web') {
  require('../global.css');
}

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
  const { width } = useWindowDimensions();
  const isDesktopWebFrame = Platform.OS === 'web' && width >= 540;

  const [fontsLoaded, fontError] = useFonts({
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
  const [fontTimeout, setFontTimeout] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFontTimeout(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    void hydrateAuth();
    void hydrateSettings();
  }, [hydrateAuth, hydrateSettings]);

  if (!fontsLoaded && !fontError && !fontTimeout) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const appTree = (
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
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      {isDesktopWebFrame ? (
        <View style={styles.desktopStage}>
          <View style={styles.desktopTitaniumBezel}>
            <View style={styles.desktopScreen}>
              <View style={styles.desktopStatusBar} aria-hidden>
                <View style={styles.desktopDynamicIsland}>
                  <View style={styles.desktopIslandLens} />
                </View>
              </View>
              <View style={styles.desktopAppViewport}>{appTree}</View>
              <View style={styles.desktopHomeArea} aria-hidden>
                <View style={styles.desktopHomeIndicator} />
              </View>
            </View>
          </View>
        </View>
      ) : (
        appTree
      )}
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
  desktopStage: {
    flex: 1,
    minHeight: '100vh' as unknown as number,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  desktopTitaniumBezel: {
    width: '100%',
    maxWidth: 422,
    height: '92vh' as unknown as number,
    maxHeight: 868,
    borderRadius: 50,
    padding: 9,
    backgroundColor: '#9EA2A8',
    borderWidth: 1,
    borderColor: '#D4D7DC',
    shadowColor: '#000000',
    shadowOpacity: 0.34,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
  },
  desktopScreen: {
    flex: 1,
    borderRadius: 42,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  desktopStatusBar: {
    height: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopDynamicIsland: {
    width: 96,
    height: 24,
    borderRadius: 14,
    backgroundColor: '#050505',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 9,
  },
  desktopIslandLens: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E2534',
  },
  desktopAppViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  desktopHomeArea: {
    height: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopHomeIndicator: {
    width: 112,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
});
