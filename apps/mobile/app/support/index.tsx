import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  colors,
  layout,
  AppText,
  TextInput,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  LoadingState,
} from '@paiementbj/ui';
import { SupportTicket, TicketCategory } from '@paiementbj/types';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { showNotice } from '../../src/utils/dialog';

export default function SupportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ transactionId?: string; prefillTitle?: string }>();
  const { isAuthenticated } = useAuthStore();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState<TicketCategory>('DEBITED_NOT_CREDITED');
  const [title, setTitle] = useState(params.prefillTitle || '');
  const [description, setDescription] = useState('');
  const [replyByTicket, setReplyByTicket] = useState<Record<string, string>>({});
  const [replyLoadingId, setReplyLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  const loadTickets = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.support.listTickets();
      setTickets(data);
    } catch {
      // Résilience
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [isAuthenticated]);

  const categories: Array<{ key: TicketCategory; label: string }> = [
    { key: 'DEBITED_NOT_CREDITED', label: 'Débité mais service non crédité' },
    { key: 'INCORRECT_AMOUNT', label: 'Montant prélevé incorrect' },
    { key: 'REFERENCE_ERROR', label: 'Erreur sur la référence saisie' },
    { key: 'RECEIPT_NOT_GENERATED', label: 'Reçu non disponible' },
    { key: 'TECHNICAL_DIFFICULTY', label: 'Difficulté technique / bug' },
    { key: 'OTHER', label: 'Autre motif' },
  ];

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (!title.trim() || title.trim().length < 5) {
      setError('Veuillez renseigner un objet de réclamation d’au moins 5 caractères.');
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      setError('Veuillez décrire le problème en au moins 15 caractères.');
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      await api.support.createTicket({
        transactionId: params.transactionId,
        category,
        title: title.trim(),
        description: description.trim(),
      });

      showNotice(
        'Réclamation enregistrée',
        'Votre dossier a été transmis au centre de support. Une référence de suivi vous a été attribuée.'
      );
      void loadTickets();

      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Impossible d’enregistrer votre réclamation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    const content = (replyByTicket[ticketId] || '').trim();
    if (content.length < 2) return;
    setReplyLoadingId(ticketId);
    try {
      const updated = await api.support.addMessage(ticketId, content);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setReplyByTicket((prev) => ({ ...prev, [ticketId]: '' }));
    } catch (err: any) {
      showNotice('Envoi impossible', err.message || 'Impossible d’ajouter le message.');
    } finally {
      setReplyLoadingId(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SecondaryButton
        label="Consulter la Foire Aux Questions (FAQ)"
        onPress={() => router.push('/support/faq' as any)}
        style={styles.faqBtn}
      />

      <View style={styles.card}>
        <AppText variant="h2" color={colors.primaryDeep} style={styles.cardTitle}>
          Déposer une réclamation
        </AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.desc}>
          En cas d’incident sur un prélèvement ou de non-délivrance de justificatif, renseignez le formulaire ci-dessous.
        </AppText>

        {params.transactionId && (
          <View style={styles.transactionNotice}>
            <AppText variant="caption" color={colors.primaryDeep} style={styles.txText}>
              ✓ Rattaché à la transaction : {params.transactionId}
            </AppText>
          </View>
        )}

        <AppText variant="caption" color={colors.textSecondary} style={styles.label}>
          MOTIF DU LITIGE
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {categories.map((c) => {
            const isSelected = category === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[styles.chip, isSelected && styles.chipSelected]}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <AppText
                  variant="caption"
                  color={isSelected ? colors.textOnPrimary : colors.text}
                  style={styles.chipText}
                >
                  {c.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <TextInput
          label="Objet de la réclamation"
          placeholder="Ex: Facture SBEE non créditée après débit MoMo"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          label="Description détaillée"
          placeholder="Précisez la date, l'heure et les références du message de confirmation reçu..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.textArea}
          error={error}
        />

        <PrimaryButton
          label={isAuthenticated ? 'Transmettre la réclamation' : 'Se connecter pour déposer'}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </View>

      <View style={styles.historySection}>
        <AppText variant="h3" color={colors.primaryDeep} style={styles.historyTitle}>
          Vos réclamations en cours
        </AppText>

        {loading ? (
          <LoadingState message="Chargement des dossiers..." />
        ) : tickets.length > 0 ? (
          tickets.map((t) => (
            <View key={t.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <AppText variant="caption" color={colors.primaryDeep} style={styles.ticketNum}>
                  {t.ticketNumber}
                </AppText>
                <StatusBadge
                  status={t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'SUCCEEDED' : 'PENDING'}
                  customLabel={t.statusLabel}
                />
              </View>
              <AppText variant="bodyMedium" color={colors.text} style={styles.ticketTitle}>
                {t.title}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {t.description}
              </AppText>

              {t.messages?.length > 1 && (
                <View style={styles.messagesBox}>
                  {t.messages.slice(1).map((m) => (
                    <View key={m.id} style={styles.messageRow}>
                      <AppText variant="caption" color={colors.primaryDeep} style={styles.msgAuthor}>
                        {m.senderName} :
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {m.content}
                      </AppText>
                    </View>
                  ))}
                </View>
              )}

              {t.status !== 'CLOSED' && (
                <View style={styles.replyBox}>
                  <TextInput
                    label="Ajouter une précision"
                    placeholder="Répondre à l’équipe support..."
                    value={replyByTicket[t.id] || ''}
                    onChangeText={(txt) =>
                      setReplyByTicket((prev) => ({ ...prev, [t.id]: txt }))
                    }
                  />
                  <SecondaryButton
                    label="Envoyer le message"
                    onPress={() => handleSendReply(t.id)}
                    loading={replyLoadingId === t.id}
                  />
                </View>
              )}

              <AppText variant="caption" color={colors.textMuted} style={styles.ticketDate}>
                Déposé le {new Date(t.createdAt).toLocaleDateString('fr-BJ')}
              </AppText>
            </View>
          ))
        ) : (
          <View style={styles.emptyTickets}>
            <AppText variant="caption" color={colors.textMuted} align="center">
              Aucun dossier de réclamation ouvert.
            </AppText>
          </View>
        )}
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  faqBtn: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 20,
  },
  cardTitle: {
    marginBottom: 6,
  },
  desc: {
    lineHeight: 20,
    marginBottom: 16,
  },
  transactionNotice: {
    backgroundColor: colors.primarySoft,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  txText: {
    fontWeight: '700',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsScroll: {
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.backgroundMint,
    marginRight: 8,
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitBtn: {
    marginTop: 8,
    width: '100%',
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    marginBottom: 12,
    fontWeight: '700',
  },
  ticketCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNum: {
    fontWeight: '700',
  },
  ticketTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  messagesBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  messageRow: {
    backgroundColor: colors.surfaceSubtle,
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  msgAuthor: {
    fontWeight: '700',
    marginBottom: 2,
  },
  replyBox: {
    marginTop: 12,
  },
  ticketDate: {
    marginTop: 10,
  },
  emptyTickets: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
});
