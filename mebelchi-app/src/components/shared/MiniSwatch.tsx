import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { COLORS, RADII } from '@/lib/tokens';
import type { Material } from '@/types/ui';

interface Props {
  material: Material;
  active: boolean;
  onPress: () => void;
  size?: number;
}

export function MiniSwatch({ material, active, onPress, size = 38 }: Props) {
  const facadeHex = '#' + material.facade.toString(16).padStart(6, '0');
  const topHex = '#' + material.top.toString(16).padStart(6, '0');
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.box,
        { width: size, height: size },
        active && styles.active,
        pressed && { transform: [{ scale: 0.94 }] },
      ]}
    >
      <View style={[styles.facade, { backgroundColor: facadeHex }]} />
      <View style={[styles.top, { backgroundColor: topHex }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: RADII.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  active: { borderWidth: 1.5, borderColor: COLORS.ink },
  facade: { flex: 7 },
  top:    { flex: 3 },
});
