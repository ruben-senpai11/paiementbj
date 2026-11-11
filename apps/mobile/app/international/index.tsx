import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  colors,
  layout,
  AppText,
  BrandLogo,
  StatusBadge,
  PrimaryButton,
} from '@paiementbj/ui';

export default function InternationalScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <AppText variant="h2" color={colors.primaryDeep} style={styles.title}>
          Tourisme, Diaspora & International
        </AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.desc}>
          Ce parcours permet aux membres de la diaspora béninoise et aux visiteurs internationaux de régler des factures de proches, des démarches administratives ou des prestations locales avec des cartes bancaires étrangères.
        </AppText>

        <View style={styles.partnerSection}>
          <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.subhead}>
            RÉSEAUX MONÉTIQUES PRIS EN CHARGE
          </AppText>

          <View style={styles.networkRow}>
            <View style={styles.logoWrap}>
              <BrandLogo brandKey="visa" size={44} />
              <AppText variant="caption" color={colors.text} style={styles.netName}>
                Visa
              </AppText>
            </View>

            <View style={styles.logoWrap}>
              <BrandLogo brandKey="mastercard" size={44} />
              <AppText variant="caption" color={colors.text} style={styles.netName}>
                Mastercard
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <AppText variant="caption" color={colors.primaryDeep} style={styles.infoTitle}>
            TRANSPARENCE DES TAUX DE CHANGE ET FRAIS :
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.infoText}>
            • Tous les paiements finaux sont comptabilisés en Francs CFA (XOF).
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.infoText}>
            • Aucun taux de change n’est inventé : la conversion est certifiée par l’acquéreur bancaire agréé au moment de la transaction 3D-Secure.
          </AppText>
        </View>

        <View style={styles.statusSection}>
          <StatusBadge
            status="PENDING_AGREEMENT"
            customLabel="Homologation passerelle internationale en cours"
          />
        </View>

        <PrimaryButton
          label="Explorer les services compatibles"
          onPress={() => router.push('/services')}
          style={styles.btn}
        />
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  title: {
    marginBottom: 8,
  },
  desc: {
    lineHeight: 22,
    marginBottom: 20,
  },
  subhead: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  partnerSection: {
    marginBottom: 20,
  },
  networkRow: {
    flexDirection: 'row',
  },
  logoWrap: {
    alignItems: 'center',
    marginRight: 24,
  },
  netName: {
    marginTop: 6,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: colors.primarySoft,
    padding: 14,
    borderRadius: layout.borderRadius.sm,
    marginBottom: 20,
  },
  infoTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  infoText: {
    lineHeight: 18,
    marginBottom: 4,
  },
  statusSection: {
    marginBottom: 20,
  },
  btn: {
    width: '100%',
  },
});
