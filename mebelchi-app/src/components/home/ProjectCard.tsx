import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';
import { materialById } from '@/mocks/materials';
import type { ProjectSummary } from '@/types/ui';

interface Props {
  project: ProjectSummary;
  onPress: () => void;
}

function formatPrice(sum: number): string {
  return sum.toLocaleString('ru-RU').replace(/,/g, ' ');
}

function relativeDate(ms: number): string {
  const days = Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 7) return days + ' дн. назад';
  if (days < 30) return Math.floor(days / 7) + ' нед. назад';
  return Math.floor(days / 30) + ' мес. назад';
}

export function ProjectCard({ project, onPress }: Props) {
  const mat = materialById(project.thumbnailColor);
  const facadeHex = '#' + mat.facade.toString(16).padStart(6, '0');
  const topHex = '#' + mat.top.toString(16).padStart(6, '0');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}>
      {/* Mock 3D thumbnail — two-tone bands */}
      <View style={[styles.thumb, { backgroundColor: facadeHex }]}>
        <View style={[styles.thumbTop, { backgroundColor: topHex }]} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{project.name}</Text>
        <Text style={styles.meta}>{project.wallLengthMm} мм · {relativeDate(project.createdAt)}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(project.totalPriceSum)}</Text>
          <Text style={styles.priceCur}>сум</Text>
        </View>
      </View>
    </Pressable>
  );
}

const CARD_W = 220;
const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  thumb: {
    height: 120,
    justifyContent: 'flex-end',
  },
  thumbTop: { height: 18 },
  body: { padding: SPACE.md, gap: SPACE.xxs },
  name: { ...TYPE.bodyMed, color: COLORS.ink, fontSize: 15 },
  meta: { ...TYPE.body, color: COLORS.inkMuted, fontSize: 11, marginBottom: SPACE.xs },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE.xs },
  price: { ...TYPE.price, color: COLORS.ink },
  priceCur: { ...TYPE.priceCur, color: COLORS.inkMuted },
});
