/**
 * SelectionPill — HANDOVER §3.3.
 *
 * Slides up from below the bottom bar when a cabinet is selected.
 * Contains:
 *   - Cabinet name + size
 *   - Close (×)
 *   - Width row [− 600 мм +]
 *   - "Цвет фасада" + 6 mini-swatches (per-cabinet material override)
 *   - Hint text
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { cabinetLabel, INTERACTION } from '@/types/ui';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';
import { useT } from '@/lib/i18n';
import { hapticTap } from '@/lib/haptics';

/** Approx height of StudioBottomBar (paddingVert 12*2 + button height ~46) */
const BOTTOM_BAR_HEIGHT = 78;

export function SelectionPill() {
  const selectedId = useUI((s) => s.selectedCabinetId);
  const variant = useUI(selectCurrentVariant);
  const lang = useUI((s) => s.language);
  const selectCabinet = useUI((s) => s.selectCabinet);
  const resizeCabinet = useUI((s) => s.resizeCabinet);

  const t = useT();
  const insets = useSafeAreaInsets();
  /* Position the pill ABOVE the bottom bar with margin, accounting for
     the device's bottom safe area inset (system nav bar on Android). */
  const bottomOffset = insets.bottom + BOTTOM_BAR_HEIGHT + 12;

  const translateY = useRef(new Animated.Value(220)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isOpen = !!selectedId;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isOpen ? 0 : 220,
        duration: 280,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isOpen ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, translateY, opacity]);

  const cab = variant?.cabinets.find((c) => c.id === selectedId);

  if (!cab) {
    /* Render but invisible — so the slide-down animation has something to animate */
    return (
      <Animated.View
        pointerEvents="none"
        style={[styles.root, { bottom: bottomOffset, transform: [{ translateY }], opacity }]}
      />
    );
  }

  const widthMm = Math.round(cab.width * 1000);

  return (
    <Animated.View
      pointerEvents={isOpen ? 'auto' : 'none'}
      style={[styles.root, { bottom: bottomOffset, transform: [{ translateY }], opacity }]}
    >
      {/* Header row — inline "NAME · SIZE мм" with close on the right */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{cabinetLabel(cab.type, lang)}</Text>
          <Text style={styles.headerSep}> · </Text>
          <Text style={styles.size}>{widthMm} {t('unit_mm')}</Text>
        </View>
        <Pressable
          onPress={() => { hapticTap(); selectCabinet(null); }}
          hitSlop={12}
          style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.closeTxt}>×</Text>
        </Pressable>
      </View>

      {/* Width row */}
      <View style={styles.widthRow}>
        <Pressable
          onPress={() => { hapticTap(); resizeCabinet(cab.id, -INTERACTION.RESIZE_STEP_MM); }}
          style={({ pressed }) => [styles.widthBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.widthSign}>−</Text>
        </Pressable>
        <View style={styles.widthValBox}>
          <Text style={styles.widthVal}>{widthMm}</Text>
          <Text style={styles.widthUnit}>{t('unit_mm')}</Text>
        </View>
        <Pressable
          onPress={() => { hapticTap(); resizeCabinet(cab.id, +INTERACTION.RESIZE_STEP_MM); }}
          style={({ pressed }) => [styles.widthBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.widthSign}>+</Text>
        </Pressable>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Hint — facade colour is chosen via the bottom "material" button,
          so we don't duplicate the swatches here. */}
      <Text style={styles.hint}>{t('pill_hint')}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: SPACE.lg,
    right: SPACE.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    padding: SPACE.lg,
    ...SHADOWS.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACE.md,
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'baseline' },
  name: { ...TYPE.sectionLabel, color: COLORS.ink, fontSize: 12 },
  headerSep: { ...TYPE.body, color: COLORS.inkFaint, fontSize: 12 },
  size: { ...TYPE.body, color: COLORS.inkMuted, fontSize: 12, fontFamily: 'monospace' },
  close: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { fontSize: 22, color: COLORS.inkSoft, marginTop: -4 },
  widthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  widthBtn: {
    width: 56, height: 44, borderRadius: RADII.md,
    backgroundColor: COLORS.bgSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  widthSign: { fontSize: 22, color: COLORS.ink, fontWeight: '300' },
  widthValBox: {
    flex: 1, height: 44, borderRadius: RADII.md,
    backgroundColor: COLORS.bgSoft,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACE.xs,
  },
  widthVal:  { ...TYPE.wallPill, color: COLORS.ink, fontFamily: 'monospace' },
  widthUnit: { ...TYPE.body, color: COLORS.inkMuted, fontSize: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.line, marginVertical: SPACE.md },
  hint: { ...TYPE.hint, color: COLORS.inkFaint, fontSize: 10, textAlign: 'center' },
});
