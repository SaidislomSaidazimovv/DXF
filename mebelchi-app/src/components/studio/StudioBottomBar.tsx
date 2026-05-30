import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';
import { useT } from '@/lib/i18n';

interface Props {
  variantIdx: number;
  variantCount: number;
  onCycleVariant: () => void;
  /** Primary call-to-action shown as the big bar button. */
  ctaLabel: string;
  onCta: () => void;
  /** 'good' renders a green CTA (e.g. confirmed → next phase). */
  tone?: 'default' | 'good';
}

export function StudioBottomBar({
  variantIdx, variantCount, onCycleVariant, ctaLabel, onCta, tone = 'default',
}: Props) {
  const t = useT();
  const ctaBg = tone === 'good' ? COLORS.good : COLORS.ink;
  return (
    <View style={styles.bar}>
      {/* Primary CTA */}
      <Pressable
        onPress={onCta}
        style={({ pressed }) => [
          styles.ctaBtn,
          { backgroundColor: ctaBg },
          pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
        ]}
      >
        <Text style={styles.ctaTxt}>{ctaLabel}</Text>
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
  ctaBtn: {
    flex: 1,
    borderRadius: RADII.pill,
    paddingVertical: SPACE.md,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  ctaTxt: { ...TYPE.pillButton, color: '#fff', fontSize: 15, letterSpacing: 0.3 },
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
