import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';
import { WALL_SIZES_MM } from '@/types/ui';
import { useT } from '@/lib/i18n';

interface Props {
  wallMm: number;
  onPress: () => void;
}

export function WallPill({ wallMm, onPress }: Props) {
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    >
      <Text style={styles.value}>{wallMm}</Text>
      <Text style={styles.unit}> {t('unit_mm')}</Text>
      <View style={styles.dots}>
        {WALL_SIZES_MM.map((s) => (
          <View key={s} style={[styles.dot, s === wallMm && styles.dotActive]} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm + 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bgCardTint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    ...SHADOWS.sm,
  },
  value: { ...TYPE.wallPill, color: COLORS.ink },
  unit:  { ...TYPE.body, color: COLORS.inkMuted, fontSize: 12 },
  dots:  { flexDirection: 'row', gap: 3, marginLeft: SPACE.sm },
  dot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.inkFaint },
  dotActive: { backgroundColor: COLORS.ink, width: 6 },
});
