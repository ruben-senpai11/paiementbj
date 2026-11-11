import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, layout, AppText, PrimaryButton } from '@paiementbj/ui';

const FAQ_ITEMS = [
  {
    q: 'Paiement BJ garde-t-il mon argent dans un portefeuille ?',
    a: 'Non. Paiement BJ ne crée aucune monnaie électronique et ne détient aucun fonds utilisateur. Vos fonds restent directement auprès de votre opérateur Mobile Money ou de votre banque, conformément à l’Instruction BCEAO n°001-01-2024.',
  },
  {
    q: 'Pourquoi certains services affichent « En attente de convention » ?',
    a: 'Par transparence absolue, seuls les services et opérateurs disposant de passerelles raccordées et de conventions valides peuvent déclencher un paiement. Nous ne simulons jamais un paiement indisponible.',
  },
  {
    q: 'Comment obtenir mon reçu officiel avec signature SHA-256 ?',
    a: 'Dès que l’opérateur confirme le règlement (via webhook signé ou vérification d’état), votre reçu officiel est émis automatiquement dans l’onglet Activité avec une empreinte SHA-256 vérifiable et partageable.',
  },
  {
    q: 'Que faire si j’ai été débité mais que mon reçu indique En cours ?',
    a: 'Ne relancez pas un second paiement immédiatement. Ouvrez l’écran de la transaction puis sélectionnez « Signaler une difficulté sur ce paiement » pour transmettre votre référence dossier PBJ au support.',
  },
  {
    q: 'Comment exercer mes droits APDP (Loi n°2017-20) ?',
    a: 'Dans Profil > Préférences & confidentialité, vous pouvez consulter vos consentements horodatés ou soumettre une demande formelle de suppression de compte (les pièces comptables légales restant archivées selon la durée réglementaire).',
  },
];

export default function SupportFaqScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="h2" color={colors.primaryDeep} style={styles.title}>
        Foire Aux Questions
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
        Informations officielles sur le fonctionnement, la sécurité et la conformité de Paiement BJ.
      </AppText>

      {FAQ_ITEMS.map((item, idx) => (
        <View key={idx} style={styles.card}>
          <AppText variant="bodyMedium" color={colors.primaryDeep} style={styles.question}>
            {item.q}
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.answer}>
            {item.a}
          </AppText>
        </View>
      ))}

      <PrimaryButton
        label="Ouvrir une réclamation"
        onPress={() => router.replace('/support')}
        style={styles.cta}
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
  title: {
    marginBottom: 6,
  },
  subtitle: {
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 12,
  },
  question: {
    fontWeight: '700',
    marginBottom: 6,
  },
  answer: {
    lineHeight: 20,
  },
  cta: {
    marginTop: 12,
  },
});
