import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { AppText } from './AppText';
import { TextInput } from './TextInput';
import { IconButton } from './IconButton';
import { Select } from './Select';
import { Modal } from './Modal';
import { PrimaryButton } from './PrimaryButton';

export interface DatePickerProps {
  label: string;
  value?: string; // Format ISO YYYY-MM-DD
  onChange: (isoDate: string) => void;
  error?: string;
  helpText?: string;
  style?: ViewStyle;
}

function isValidIsoDate(val: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const d = new Date(`${val}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(val);
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value = '',
  onChange,
  error,
  helpText = 'Format AAAA-MM-JJ (ex: 2026-11-10)',
  style,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [day, setDay] = useState(value.slice(8, 10) || '01');
  const [month, setMonth] = useState(value.slice(5, 7) || '01');
  const [year, setYear] = useState(value.slice(0, 4) || String(currentYear));

  const dayOptions = Array.from({ length: 31 }, (_, i) => {
    const val = String(i + 1).padStart(2, '0');
    return { value: val, label: val };
  });

  const monthOptions = [
    { value: '01', label: 'Janvier (01)' },
    { value: '02', label: 'Février (02)' },
    { value: '03', label: 'Mars (03)' },
    { value: '04', label: 'Avril (04)' },
    { value: '05', label: 'Mai (05)' },
    { value: '06', label: 'Juin (06)' },
    { value: '07', label: 'Juillet (07)' },
    { value: '08', label: 'Août (08)' },
    { value: '09', label: 'Septembre (09)' },
    { value: '10', label: 'Octobre (10)' },
    { value: '11', label: 'Novembre (11)' },
    { value: '12', label: 'Décembre (12)' },
  ];

  const yearOptions = Array.from({ length: 25 }, (_, i) => {
    const y = String(currentYear + 2 - i);
    return { value: y, label: y };
  });

  const formattedError =
    error ||
    (value.length === 10 && !isValidIsoDate(value)
      ? 'Date invalide. Utilisez le format AAAA-MM-JJ.'
      : undefined);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <View style={styles.inputWrap}>
          <TextInput
            label={label}
            placeholder="AAAA-MM-JJ"
            value={value}
            onChangeText={(txt) => onChange(txt.replace(/[^0-9-]/g, '').slice(0, 10))}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            helpText={helpText}
            error={formattedError}
          />
        </View>
        <IconButton
          onPress={() => setModalOpen(true)}
          accessibilityLabel={`Ouvrir le sélecteur de date pour ${label}`}
          icon={<Calendar size={20} color={colors.primaryDeep} />}
          variant="subtle"
          style={styles.calendarBtn}
        />
      </View>

      <Modal
        visible={modalOpen}
        title={label}
        onClose={() => setModalOpen(false)}
      >
        <AppText variant="caption" color={colors.textSecondary} style={styles.modalHint}>
          Sélectionnez le jour, le mois et l’année :
        </AppText>
        <Select label="Jour" options={dayOptions} value={day} onChange={setDay} />
        <Select label="Mois" options={monthOptions} value={month} onChange={setMonth} />
        <Select label="Année" options={yearOptions} value={year} onChange={setYear} />
        <PrimaryButton
          label="Appliquer cette date"
          onPress={() => {
            const candidate = `${year}-${month}-${day}`;
            if (isValidIsoDate(candidate)) {
              onChange(candidate);
              setModalOpen(false);
            }
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputWrap: {
    flex: 1,
    marginRight: 8,
  },
  calendarBtn: {
    marginTop: 26,
  },
  modalHint: {
    marginBottom: 12,
  },
});
