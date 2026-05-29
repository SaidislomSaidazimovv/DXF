/**
 * Placeholder for the real R3F Canvas (Day 2-7).
 * Renders a styled box that hints at where the kitchen will appear.
 * Listens to selection/material via store so it FEELS responsive
 * — even without real geometry yet.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADII, SPACE, TYPE } from '@/lib/tokens';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { materialById } from '@/mocks/materials';
import { cabinetLabel } from '@/types/ui';

export function Canvas3DPlaceholder() {
  const variant = useUI(selectCurrentVariant);
  const globalMat = useUI((s) => s.globalMaterial);
  const lang = useUI((s) => s.language);
  const mat = materialById(globalMat);
  const facadeHex = '#' + mat.facade.toString(16).padStart(6, '0');
  const topHex = '#' + mat.top.toString(16).padStart(6, '0');

  return (
    <View style={styles.root}>
      {/* Faux floor + wall via stacked panels */}
      <View style={[styles.wall, { backgroundColor: '#ede8db' }]} />
      <View style={[styles.floor, { backgroundColor: '#e5dfd1' }]} />

      {/* Faux cabinet row */}
      <View style={styles.row}>
        {variant?.cabinets.map((c) => {
          const widthPct = (c.width / (variant.cabinets.reduce((s, x) => s + x.width, 0))) * 100;
          return (
            <View key={c.id} style={[styles.cab, { flexBasis: `${widthPct}%` }]}>
              <View style={[styles.cabTop, { backgroundColor: topHex }]} />
              <View style={[styles.cabBody, { backgroundColor: facadeHex }]}>
                <Text style={styles.cabTag}>{cabinetLabel(c.type, lang)}</Text>
                <Text style={styles.cabSize}>{Math.round(c.width * 1000)} мм</Text>
              </View>
              <View style={styles.cabPlinth} />
            </View>
          );
        })}
      </View>

      <Text style={styles.hint}>3D-сцена · placeholder (день 2-7: R3F + three.js)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    margin: SPACE.lg,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: '#ede8db',
    justifyContent: 'flex-end',
  },
  wall: { ...StyleSheet.absoluteFillObject, bottom: '38%' },
  floor: { ...StyleSheet.absoluteFillObject, top: '62%' },
  row: { flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: SPACE.md, paddingBottom: '12%' },
  cab: { marginHorizontal: 1 },
  cabTop: { height: 6, marginHorizontal: -1 },
  cabBody: {
    minHeight: 140,
    paddingHorizontal: SPACE.xs,
    paddingVertical: SPACE.sm,
    justifyContent: 'flex-end',
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },
  cabPlinth: { height: 10, backgroundColor: '#3a3a37', marginHorizontal: -1 },
  cabTag:  { ...TYPE.sectionLabel, color: 'rgba(0,0,0,0.55)', fontSize: 8 },
  cabSize: { ...TYPE.body, color: 'rgba(0,0,0,0.7)', fontSize: 9, fontFamily: 'monospace' },
  hint: { ...TYPE.hint, color: COLORS.inkFaint, position: 'absolute', bottom: SPACE.sm, alignSelf: 'center' },
});
