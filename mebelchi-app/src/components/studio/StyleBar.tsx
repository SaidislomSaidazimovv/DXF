/**
 * StyleBar — one-tap whole-kitchen style presets.
 *
 * A horizontal strip of style chips. Tapping one applies the preset to the
 * entire kitchen (material + doors + handle + worktop + faucet) and clears
 * per-element overrides. The master just picks a vibe — no thinking.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useUI } from '@/store/uiStore';
import { STYLE_PRESETS } from '@/mocks/styles';
import { COLORS, SPACE, TYPE, RADII } from '@/lib/tokens';
import { hapticTap } from '@/lib/haptics';

export function StyleBar() {
  const applyStylePreset = useUI((s) => s.applyStylePreset);
  const globalMaterial = useUI((s) => s.globalMaterial);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>СТИЛЬ</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {STYLE_PRESETS.map((p) => {
            const active = globalMaterial === p.material;
            return (
              <Pressable
                key={p.id}
                onPress={() => { hapticTap(); applyStylePreset(p); }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: '#' + p.swatch.toString(16).padStart(6, '0') },
                  ]}
                />
                <Text style={[styles.chipTxt, active && styles.chipTxtActive]} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.xs },
  label: { ...TYPE.sectionLabel, color: COLORS.inkMuted, fontSize: 9, marginBottom: 4 },
  row: { flexDirection: 'row', gap: SPACE.xs, paddingRight: SPACE.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgCard,
  },
  chipActive: { borderColor: COLORS.ink, backgroundColor: COLORS.bgSoft },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: COLORS.line },
  chipTxt: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 11 },
  chipTxtActive: { color: COLORS.ink },
});
