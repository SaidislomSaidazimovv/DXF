import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACE, TYPE } from '@/lib/tokens';

interface Props {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function WizardField({ label, hint, children }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: SPACE.sm, marginBottom: SPACE.xl },
  label: { ...TYPE.sectionLabel, color: COLORS.inkMuted },
  hint:  { ...TYPE.hint, color: COLORS.inkFaint, marginTop: SPACE.xxs },
});
