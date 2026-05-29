import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  value: T;
  options: readonly Option<T>[];
  onChange: (v: T) => void;
}

/** Segmented control — used for thickness, supplier, hardware in Setup wizard. */
export function WizardChoice<T extends string | number>({ value, options, onChange }: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.active,
              pressed && !active && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.chipTxt, active && styles.activeTxt]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACE.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm + 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    ...SHADOWS.sm,
  },
  active: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  chipTxt: { ...TYPE.pillButton, color: COLORS.inkSoft, fontSize: 13 },
  activeTxt: { color: '#fff' },
});
