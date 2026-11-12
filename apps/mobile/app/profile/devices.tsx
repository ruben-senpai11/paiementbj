import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Smartphone, Monitor, ShieldAlert } from 'lucide-react-native';
import {
  colors,
  layout,
  AppText,
  SecondaryButton,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@paiementbj/ui';
import { DeviceSession } from '@paiementbj/types';
import { api } from '../../src/services/api';
import { useAuthStore, getOrCreateDeviceId } from '../../src/store/useAuthStore';
import { showConfirm, showNotice } from '../../src/utils/dialog';

export default function ProfileDevicesScreen() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadSessions = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [localId, list] = await Promise.all([
        getOrCreateDeviceId(),
        api.auth.getSessions(),
      ]);
      setCurrentDeviceId(localId);
      setSessions(list);
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les sessions actives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [isAuthenticated]);

  const handleRevoke = (session: DeviceSession) => {
    const isSelf = session.deviceId === currentDeviceId || session.isCurrent;
    showConfirm(
      'Révoquer cet appareil ?',
      isSelf
        ? 'Vous allez fermer votre session actuelle sur cet appareil.'
        : `L’accès depuis « ${session.deviceName} » sera immédiatement invalidé.`,
      'Révoquer',
      async () => {
        setRevokingId(session.deviceId);
        try {
          await api.auth.revokeSession(session.deviceId);
          if (isSelf) {
            await logout();
            router.replace('/(tabs)');
            return;
          }
          setSessions((prev) => prev.filter((s) => s.deviceId !== session.deviceId));
          showNotice('Session révoquée', 'L’appareil a été déconnecté avec succès.');
        } catch (err: any) {
          showNotice('Action impossible', err.message || 'Échec de la révocation.');
        } finally {
          setRevokingId(null);
        }
      },
      true
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Connexion requise"
          description="Connectez-vous pour consulter et gérer les appareils autorisés sur votre compte."
          actionLabel="Se connecter"
          onAction={() => router.replace('/auth')}
        />
      </View>
    );
  }

  if (loading) {
    return <LoadingState message="Chargement des sessions actives..." />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ErrorState
          title="Chargement impossible"
          message={error}
          onRetry={loadSessions}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoBanner}>
        <ShieldAlert size={20} color={colors.primaryDeep} />
        <AppText variant="caption" color={colors.primaryDeep} style={styles.infoBannerText}>
          Par sécurité, révoquez immédiatement tout terminal inconnu ou perdu.
        </AppText>
      </View>

      {sessions.length === 0 ? (
        <EmptyState
          title="Aucune autre session enregistrée"
          description="Votre appareil actuel n’a pas encore d’autres sessions associées sur ce serveur."
        />
      ) : (
        sessions.map((session) => {
          const isCurrent = session.deviceId === currentDeviceId || session.isCurrent;
          const IconComponent = session.platform === 'web' ? Monitor : Smartphone;
          return (
            <View key={session.id} style={styles.card}>
              <View style={styles.rowHeader}>
                <View style={styles.iconTitle}>
                  <View style={styles.iconCircle}>
                    <IconComponent size={20} color={colors.primaryDeep} />
                  </View>
                  <View style={styles.meta}>
                    <AppText variant="bodyMedium" color={colors.text} style={styles.deviceName}>
                      {session.deviceName}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Plateforme : {session.platform.toUpperCase()} • ID {session.deviceId.slice(0, 10)}
                    </AppText>
                  </View>
                </View>
                {isCurrent && (
                  <AppText variant="caption" color={colors.primaryDeep} style={styles.deviceName}>
                    Cet appareil
                  </AppText>
                )}
              </View>

              <View style={styles.detailsRow}>
                <AppText variant="caption" color={colors.textMuted}>
                  Dernière activité : {new Date(session.lastActiveAt).toLocaleString('fr-BJ')}
                </AppText>
                {Boolean(session.ipAddress) && (
                  <AppText variant="caption" color={colors.textMuted}>
                    IP : {session.ipAddress}
                  </AppText>
                )}
              </View>

              <SecondaryButton
                label={isCurrent ? 'Fermer cette session' : 'Révoquer cet appareil'}
                onPress={() => handleRevoke(session)}
                loading={revokingId === session.deviceId}
                style={styles.revokeBtn}
              />
            </View>
          );
        })
      )}
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: layout.screenPaddingMobile,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primarySoft,
    padding: 14,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  iconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundMint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meta: {
    flex: 1,
  },
  deviceName: {
    fontWeight: '700',
  },
  detailsRow: {
    gap: 2,
    marginBottom: 12,
  },
  revokeBtn: {
    width: '100%',
  },
});
