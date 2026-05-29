import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACE, TYPE } from '@/lib/tokens';
import { useT } from '@/lib/i18n';

interface Props {
  sum: number;
}

function format(n: number): string {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ');
}

export function PriceBlock({ sum }: Props) {
  const t = useT();
  return (
    <View style={styles.box}>
      <Text style={styles.label}>{t('cost_label')}</Text>
      <View style={styles.row}>
        <Text style={styles.value}>{format(sum)}</Text>
        <Text style={styles.cur}>{t('currency')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'flex-end' },
  label: { ...TYPE.sectionLabel, color: COLORS.inkMuted, fontSize: 9 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE.xs },
  value: { ...TYPE.price, color: COLORS.ink },
  cur:   { ...TYPE.priceCur, color: COLORS.inkMuted },
});
