import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';
import type { Material } from '@/types/ui';

interface Props {
  material: Material;
  active: boolean;
  onPress: () => void;
  width: number; // computed by parent
}

export function PaletteCard({ material, active, onPress, width }: Props) {
  const facadeHex = '#' + material.facade.toString(16).padStart(6, '0');
  const topHex = '#' + material.top.toString(16).padStart(6, '0');
  const height = width / 1.15;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, height },
        active && styles.active,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={[styles.facade, { backgroundColor: facadeHex }]} />
      <View style={[styles.top, { backgroundColor: topHex }]} />
      <View style={styles.labelPill}>
        <Text style={styles.label} numberOfLines={1}>{material.name}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.md,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    ...SHADOWS.sm,
  },
  active: { borderWidth: 1.5, borderColor: COLORS.ink },
  facade: { flex: 6 },
  top:    { flex: 4 },
  labelPill: {
    position: 'absolute',
    bottom: SPACE.xs,
    left: SPACE.xs,
    right: SPACE.xs,
    backgroundColor: COLORS.bgCardTint,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
  },
  label: { ...TYPE.body, color: COLORS.ink, fontSize: 10, fontWeight: '500', textAlign: 'center' },
});
