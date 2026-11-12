import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, layout, AppText, PrimaryButton } from '@paiementbj/ui';

const FAQ_ITEMS = [
  {
    q: 'Paiement BJ garde-t-il mon argent dans un portefeuille ?',
    a: 'Non. Vos règlements passent directement par votre opérateur Mobile Money ou votre carte bancaire, sans solde intermédiaire.',
  },
  {
    q: 'Quels services puis-je régler sur Paiement BJ ?',
    a: 'Vous pouvez régler vos factures (SBEE, SONEB, CANAL+, Celtiis Fibre) ainsi que vos démarches Trésor Public et ANIP au même endroit.',
  },
  {
    q: 'Comment retrouver mon justificatif après un paiement ?',
    a: 'Dès la confirmation du règlement, votre reçu horodaté avec empreinte SHA-256 est disponible dans l’onglet Activité.',
  },
  {
    q: 'Que faire si mon paiement reste en attente ?',
    a: 'Consultez la transaction concernée et utilisez « Vérifier la confirmation » ou déposez une réclamation auprès de l’assistance.',
  },
  {
    q: 'Comment gérer mes données personnelles ?',
    a: 'Dans Profil > Langue et accessibilité, vous pouvez ajuster vos préférences ou demander la suppression de votre compte.',
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
        Réponses aux questions courantes sur l’utilisation de Paiement BJ.
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
