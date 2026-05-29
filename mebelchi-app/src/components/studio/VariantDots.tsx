import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/tokens';

interface Props {
  count: number;
  activeIdx: number;
}

const MAX_DOTS = 9;   // never render more than this — window around the active one

export function VariantDots({ count, activeIdx }: Props) {
  /* For large variant sets, show a sliding window of dots centred on the
     active one (so the row never overflows the phone width). */
  let start = 0;
  let visible = count;
  if (count > MAX_DOTS) {
    visible = MAX_DOTS;
    start = Math.max(0, Math.min(activeIdx - Math.floor(MAX_DOTS / 2), count - MAX_DOTS));
  }

  return (
    <View style={styles.row}>
      {Array.from({ length: visible }).map((_, k) => {
        const i = start + k;
        /* Shrink the edge dots when there's more beyond the window. */
        const atStartEdge = count > MAX_DOTS && k === 0 && start > 0;
        const atEndEdge = count > MAX_DOTS && k === visible - 1 && start + visible < count;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIdx && styles.dotActive,
              (atStartEdge || atEndEdge) && styles.dotEdge,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.inkFaint, opacity: 0.55 },
  dotActive: { width: 16, height: 6, borderRadius: 3, backgroundColor: COLORS.ink, opacity: 1 },
  dotEdge: { width: 4, height: 4, borderRadius: 2, opacity: 0.3 },
});
