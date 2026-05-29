import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/tokens';

interface Props {
  count: number;
  activeIdx: number;
}

export function VariantDots({ count, activeIdx }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIdx && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.inkFaint, opacity: 0.55 },
  dotActive: { width: 16, height: 6, borderRadius: 3, backgroundColor: COLORS.ink, opacity: 1 },
});
