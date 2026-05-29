import React from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';

type Variant = 'light' | 'dark' | 'ghost';

interface Props {
  label?: string;
  value?: string;
  unit?: string;
  variant?: Variant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Generic pill — used for wall length, price, variant counter, etc.
 * `label` = small grey prefix, `value` = bold main text, `unit` = small suffix.
 */
export function Pill({ label, value, unit, variant = 'light', onPress, style, children }: Props) {
  const isDark = variant === 'dark';
  const isGhost = variant === 'ghost';

  const content = children ?? (
    <>
      {!!label && <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>}
      {!!value && (
        <Text style={[styles.value, isDark && styles.valueDark]} numberOfLines={1}>
          {value}
        </Text>
      )}
      {!!unit && <Text style={[styles.unit, isDark && styles.unitDark]}>{unit}</Text>}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isDark && styles.dark,
        isGhost && styles.ghost,
        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm + 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bgCardTint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    ...SHADOWS.sm,
  },
  dark: {
    backgroundColor: COLORS.ink,
    borderColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: COLORS.line,
    ...SHADOWS.sm,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: { ...TYPE.body, color: COLORS.inkMuted, fontSize: 11 },
  value: { ...TYPE.wallPill, color: COLORS.ink },
  unit:  { ...TYPE.body, color: COLORS.inkMuted, fontSize: 11 },
  labelDark: { color: 'rgba(255,255,255,0.55)' },
  valueDark: { color: '#ffffff' },
  unitDark:  { color: 'rgba(255,255,255,0.55)' },
});
