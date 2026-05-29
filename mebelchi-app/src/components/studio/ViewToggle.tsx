import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, RADII, SPACE, TYPE } from '@/lib/tokens';
import type { ViewMode } from '@/types/ui';

interface Props {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: Props) {
  return (
    <View style={styles.row}>
      {(['3d', '2d'] as const).map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          style={({ pressed }) => [
            styles.chip,
            mode === m && styles.active,
            pressed && mode !== m && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.txt, mode === m && styles.txtActive]}>{m.toUpperCase()}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardTint,
    borderRadius: RADII.pill,
    padding: 3,
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
  },
  chip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
  },
  active: { backgroundColor: COLORS.ink },
  txt: { ...TYPE.sectionLabel, color: COLORS.inkMuted, fontSize: 10 },
  txtActive: { color: '#fff' },
});
