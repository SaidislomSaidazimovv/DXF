import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';
import { useT } from '@/lib/i18n';

interface Props {
  variantIdx: number;
  variantCount: number;
  onOpenMaterial: () => void;
  onSave: () => void;
  onCycleVariant: () => void;
}

export function StudioBottomBar({ variantIdx, variantCount, onOpenMaterial, onSave, onCycleVariant }: Props) {
  const t = useT();
  return (
    <View style={styles.bar}>
      {/* Material button */}
      <Pressable
        onPress={onOpenMaterial}
        style={({ pressed }) => [styles.matBtn, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.dotMat} />
        <Text style={styles.matTxt}>{t('material')}</Text>
      </Pressable>

      {/* Save (primary) */}
      <Pressable
        onPress={onSave}
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
      >
        <Text style={styles.saveTxt}>{t('save')}</Text>
      </Pressable>

      {/* Variant counter */}
      <Pressable
        onPress={onCycleVariant}
        style={({ pressed }) => [styles.varBtn, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.varLabel}>{t('variant')}</Text>
        <Text style={styles.varVal}>{variantIdx + 1}/{variantCount}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  matBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.md - 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bgCardTint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    ...SHADOWS.sm,
  },
  dotMat: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#ddd0b6', borderWidth: 1, borderColor: COLORS.ink },
  matTxt: { ...TYPE.pillButton, color: COLORS.ink, fontSize: 13 },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.ink,
    borderRadius: RADII.pill,
    paddingVertical: SPACE.md,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  saveTxt: { ...TYPE.pillButton, color: '#fff', fontSize: 14 },
  varBtn: {
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm - 1,
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    backgroundColor: COLORS.bgCardTint,
  },
  varLabel: { ...TYPE.sectionLabel, color: COLORS.inkMuted, fontSize: 9, marginBottom: 2 },
  varVal: { ...TYPE.bodyMed, color: COLORS.ink, fontSize: 13, fontFamily: 'monospace' },
});
