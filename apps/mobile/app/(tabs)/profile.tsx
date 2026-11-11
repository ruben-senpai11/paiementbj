import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  UserCheck,
  ShieldCheck,
  Smartphone,
  Settings,
  MessageSquareWarning,
  HelpCircle,
  Bell,
  ChevronRight,
} from 'lucide-react-native';
import {
  colors,
  layout,
  AppText,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from '@paiementbj/ui';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { getTranslations } from '../../src/i18n/translations';
import { api } from '../../src/services/api';
import { showConfirm } from '../../src/utils/dialog';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const language = useSettingsStore((s) => s.language);
  const t = getTranslations(language);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      return;
    }
    api.notifications
      .list()
      .then((list) => setUnreadNotifications(list.filter((n) => !n.isRead).length))
      .catch(() => setUnreadNotifications(0));
  }, [isAuthenticated]);

  const handleLogout = () => {
    showConfirm(
      t.profile.logoutConfirmTitle,
      t.profile.logoutConfirmBody,
      t.common.logout,
      async () => {
        await logout();
        router.replace('/(tabs)');
      },
      true
    );
  };

  if (!isAuthenticated) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.guestContent}>
        <AppText variant="h2" color={colors.primaryDeep} align="center" style={styles.title}>
          {t.profile.guestTitle}
        </AppText>
        <AppText variant="body" color={colors.textSecondary} align="center" style={styles.desc}>
          {t.profile.guestDesc}
        </AppText>
        <PrimaryButton
          label={t.profile.loginCta}
          onPress={() => router.push('/auth')}
          style={styles.loginBtn}
        />

        <View style={[styles.sectionCard, styles.guestSection]}>
          <Pressable
            onPress={() => router.push('/profile/settings')}
            style={styles.menuRow}
            accessible={true}
            accessibilityRole="button"
          >
            <View style={styles.menuLeft}>
              <Settings size={20} color={colors.primaryDeep} />
              <AppText variant="bodySmall" color={colors.text} style={styles.menuLabel}>
                {t.profile.settingsRow}
              </AppText>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/support/faq')}
            style={[styles.menuRow, styles.menuRowBorder]}
            accessible={true}
            accessibilityRole="button"
          >
            <View style={styles.menuLeft}>
              <HelpCircle size={20} color={colors.primaryDeep} />
              <AppText variant="bodySmall" color={colors.text} style={styles.menuLabel}>
                {t.profile.faqRow}
              </AppText>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Carte d'identité du compte */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <UserCheck size={28} color={colors.primaryDeep} />
        </View>
        <View style={styles.profileInfo}>
          <AppText variant="h3" color={colors.text} style={styles.phoneText}>
            {user?.phone}
          </AppText>
          {(user?.profile?.firstName || user?.profile?.lastName) && (
            <AppText variant="caption" color={colors.textSecondary} style={styles.fullName}>
              {[user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ')}
            </AppText>
          )}
          <View style={styles.badgeWrap}>
            <StatusBadge status="LIVE" customLabel={t.profile.levelBadge} />
          </View>
        </View>
        {unreadNotifications > 0 && (
          <View style={styles.notifBadge} accessibilityLabel={`${unreadNotifications} alertes non lues`}>
            <Bell size={16} color={colors.primaryDeep} />
            <AppText variant="caption" color={colors.primaryDeep} style={styles.notifText}>
              {unreadNotifications}
            </AppText>
          </View>
        )}
      </View>

      {/* Identité, Sessions & Paramètres */}
      <View style={styles.sectionCard}>
        <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.sectionTitle}>
          {t.profile.identitySection}
        </AppText>

        <Pressable
          onPress={() => router.push('/profile/identity')}
          style={styles.menuRow}
          accessible={true}
          accessibilityRole="button"
        >
          <View style={styles.menuLeft}>
            <ShieldCheck size={20} color={colors.primaryDeep} />
            <AppText variant="bodySmall" color={colors.text} style={styles.menuLabel}>
              {t.profile.identityRow}
            </AppText>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/profile/devices')}
          style={[styles.menuRow, styles.menuRowBorder]}
          accessible={true}
          accessibilityRole="button"
        >
          <View style={styles.menuLeft}>
            <Smartphone size={20} color={colors.primaryDeep} />
            <AppText variant="bodySmall" color={colors.text} style={styles.menuLabel}>
              {t.profile.devicesRow}
            </AppText>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/profile/settings')}
          style={[styles.menuRow, styles.menuRowBorder]}
          accessible={true}
          accessibilityRole="button"
        >
          <View style={styles.menuLeft}>
            <Settings size={20} color={colors.primaryDeep} />
            <AppText variant="bodySmall" color={colors.text} style={styles.menuLabel}>
              {t.profile.settingsRow}
            </AppText>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Assistance et Réclamations */}
      <View style={styles.sectionCard}>
        <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.sectionTitle}>
          {t.profile.supportSection}
        </AppText>
        <Pressable
          onPress={() => router.push('/support')}
          style={styles.menuRow}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t.profile.supportRow}
        >
          <View style={styles.menuLeft}>
            <MessageSquareWarning size={20} color={colors.primaryDeep} />
            <AppText variant="bodySmall" color={colors.text} style={styles.menuLabel}>
              {t.profile.supportRow}
            </AppText>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/support/faq')}
          style={[styles.menuRow, styles.menuRowBorder]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t.profile.faqRow}
        >
          <View style={styles.menuLeft}>
            <HelpCircle size={20} color={colors.primaryDeep} />
            <AppText variant="bodySmall" color={colors.text} style={styles.menuLabel}>
              {t.profile.faqRow}
            </AppText>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Conformité & Renseignements juridiques */}
      <View style={styles.sectionCard}>
        <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.sectionTitle}>
          {t.profile.complianceSection}
        </AppText>
        <View style={styles.legalInfo}>
          <AppText variant="caption" color={colors.textSecondary} style={styles.legalText}>
            • {t.profile.apdpNotice}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.legalText}>
            • {t.profile.bceaoNotice}
          </AppText>
        </View>
      </View>

      {/* Bouton de déconnexion */}
      <SecondaryButton
        label={t.common.logout}
        onPress={handleLogout}
        style={styles.logoutBtn}
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
  guestContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: layout.screenPaddingMobile,
  },
  title: {
    marginBottom: 8,
  },
  desc: {
    lineHeight: 22,
    marginBottom: 24,
  },
  loginBtn: {
    width: '100%',
    marginBottom: 24,
  },
  guestSection: {
    width: '100%',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  phoneText: {
    fontWeight: '700',
    marginBottom: 2,
  },
  fullName: {
    marginBottom: 6,
  },
  badgeWrap: {
    alignSelf: 'flex-start',
  },
  notifBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifText: {
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: layout.minTouchTarget,
  },
  menuRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuLabel: {
    fontWeight: '600',
    flex: 1,
  },
  legalInfo: {
    marginVertical: 4,
  },
  legalText: {
    lineHeight: 18,
    marginBottom: 6,
  },
  logoutBtn: {
    marginTop: 8,
  },
});
