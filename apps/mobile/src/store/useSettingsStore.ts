import { create } from 'zustand';
import { AccessibilityInfo } from 'react-native';

export type AppLanguage = 'fr' | 'en';

interface SettingsState {
  language: AppLanguage;
  reducedMotion: boolean;
  largeFont: boolean;
  biometricEnabled: boolean;
  setLanguage: (lang: AppLanguage) => void;
  setReducedMotion: (val: boolean) => void;
  setLargeFont: (val: boolean) => void;
  setBiometricEnabled: (val: boolean) => void;
  hydrateSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'fr',
  reducedMotion: false,
  largeFont: false,
  biometricEnabled: false,
  setLanguage: (language) => set({ language }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setLargeFont: (largeFont) => set({ largeFont }),
  setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
  hydrateSettings: async () => {
    try {
      const osReduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      if (osReduceMotion) {
        set({ reducedMotion: true });
      }
    } catch {
      // Ignore sur plateformes ne supportant pas l'API
    }
  },
}));
