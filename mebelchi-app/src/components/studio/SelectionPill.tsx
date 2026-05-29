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
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { cabinetLabel, INTERACTION } from '@/types/ui';
import type { MaterialId } from '@/types/ui';
import { PALETTE_MATERIALS } from '@/mocks/materials';
import { MiniSwatch } from '@/components/shared/MiniSwatch';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';
import { useT } from '@/lib/i18n';
import { hapticTap, hapticSwatch } from '@/lib/haptics';

/** Approx height of StudioBottomBar (paddingVert 12*2 + button height ~46) */
const BOTTOM_BAR_HEIGHT = 78;

export function SelectionPill() {
  const selectedId = useUI((s) => s.selectedCabinetId);
  const selectedUpperId = useUI((s) => s.selectedUpperId);
  const variant = useUI(selectCurrentVariant);
  const lang = useUI((s) => s.language);
  const selectCabinet = useUI((s) => s.selectCabinet);
  const selectUpper = useUI((s) => s.selectUpper);
  const resizeCabinet = useUI((s) => s.resizeCabinet);

  /* Per-cabinet current values + global fallbacks */
  const globalMaterial = useUI((s) => s.globalMaterial);
  const globalDoorStyle = useUI((s) => s.globalDoorStyle);
  const sinkTypeDefault = useUI((s) => s.sinkType);
  const stoveTypeDefault = useUI((s) => s.stoveType);
  const cabinetMaterial = useUI((s) => s.cabinetMaterial);
  const cabinetDoorStyle = useUI((s) => s.cabinetDoorStyle);
  const cabinetHandle = useUI((s) => s.cabinetHandle);
  const cabinetSink = useUI((s) => s.cabinetSink);
  const cabinetStove = useUI((s) => s.cabinetStove);
  const cabinetFaucet = useUI((s) => s.cabinetFaucet);
  const cabinetFaucetFinish = useUI((s) => s.cabinetFaucetFinish);
  const cabinetBurners = useUI((s) => s.cabinetBurners);
  const upperMaterialMap = useUI((s) => s.upperMaterial);
  const upperHandleMap = useUI((s) => s.upperHandle);

  /* Direct setters for chip controls */
  const setCabMaterial = useUI((s) => s.setCabinetMaterial);
  const setUpperMaterial = useUI((s) => s.setUpperMaterial);
  const setUpperHandle = useUI((s) => s.setUpperHandle);
  const setDoorStyle = useUI((s) => s.setCabinetDoorStyle);
  const setHandle = useUI((s) => s.setCabinetHandle);
  const setSink = useUI((s) => s.setCabinetSink);
  const setStove = useUI((s) => s.setCabinetStove);
  const setFaucetStyle = useUI((s) => s.setCabinetFaucetStyle);
  const setFaucetFinish = useUI((s) => s.setCabinetFaucetFinish);
  const setBurners = useUI((s) => s.setCabinetBurners);
  const setDrawerCount = useUI((s) => s.setCabinetDrawerCount);

  const t = useT();
  const insets = useSafeAreaInsets();
  /* Position the pill ABOVE the bottom bar with margin, accounting for
     the device's bottom safe area inset (system nav bar on Android). */
  const bottomOffset = insets.bottom + BOTTOM_BAR_HEIGHT + 12;

  const translateY = useRef(new Animated.Value(220)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isOpen = !!selectedId || !!selectedUpperId;

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

  /* Upper (wall cabinet) variant — simpler pill: name + close + hint. */
  if (selectedUpperId) {
    return (
      <Animated.View
        pointerEvents="auto"
        style={[styles.root, { bottom: bottomOffset, transform: [{ translateY }], opacity }]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>ВЕРХНИЙ ШКАФ</Text>
          </View>
          <Pressable
            onPress={() => { hapticTap(); selectUpper(null); }}
            hitSlop={12}
            style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.closeTxt}>×</Text>
          </Pressable>
        </View>
        <View style={styles.divider} />

        {/* Colour swatches — per-upper override (horizontal scroll) */}
        <Text style={styles.chipLabel}>ЦВЕТ ФАСАДА</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.swatchRow}>
            {PALETTE_MATERIALS.map((m) => (
              <MiniSwatch
                key={m.id}
                material={m}
                active={(upperMaterialMap[selectedUpperId] ?? globalMaterial) === m.id}
                onPress={() => { hapticSwatch(); setUpperMaterial(selectedUpperId, m.id as MaterialId); }}
                size={34}
              />
            ))}
          </View>
        </ScrollView>

        <ChipRow
          label="РУЧКА"
          options={[['bar', 'Рейлинг'], ['knob', 'Кнопка'], ['inset', 'Врезная']]}
          value={upperHandleMap[selectedUpperId] ?? 'bar'}
          onPick={(v) => setUpperHandle(selectedUpperId, v as any)}
        />
      </Animated.View>
    );
  }

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

      {/* Explicit fixture controls — depend on cabinet type. */}
      {(() => {
        const type = cab.type;
        const isDrawer = type === 'drawer3' || type === 'drawer4';
        const hasSink = type === 'sink' || type === 'sink_stove';
        const hasStove = type === 'stove' || type === 'sink_stove';
        const hasDoor = !isDrawer && !hasSink && !hasStove && type !== 'fridge';

        return (
          <View>
            {/* Colour swatches — per-cabinet override (horizontal scroll) */}
            <Text style={styles.chipLabel}>ЦВЕТ ФАСАДА</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.swatchRow}>
                {PALETTE_MATERIALS.map((m) => (
                  <MiniSwatch
                    key={m.id}
                    material={m}
                    active={(cabinetMaterial[cab.id] ?? globalMaterial) === m.id}
                    onPress={() => { hapticSwatch(); setCabMaterial(cab.id, m.id as MaterialId); }}
                    size={34}
                  />
                ))}
              </View>
            </ScrollView>

            {hasDoor && (
              <>
                <ChipRow
                  label="ДВЕРЬ"
                  options={[['flat', 'Гладкая'], ['shaker', 'Шейкер'], ['grooved', 'Фрезеровка']]}
                  value={cabinetDoorStyle[cab.id] ?? globalDoorStyle}
                  onPick={(v) => setDoorStyle(cab.id, v as any)}
                />
                <ChipRow
                  label="РУЧКА"
                  options={[['bar', 'Рейлинг'], ['knob', 'Кнопка'], ['inset', 'Врезная']]}
                  value={cabinetHandle[cab.id] ?? 'bar'}
                  onPick={(v) => setHandle(cab.id, v as any)}
                />
              </>
            )}

            {isDrawer && (
              <ChipRow
                label="ЯЩИКИ"
                options={[['drawer3', '3 ящика'], ['drawer4', '4 ящика']]}
                value={type}
                onPick={(v) => setDrawerCount(cab.id, v === 'drawer4' ? 4 : 3)}
              />
            )}

            {hasSink && (
              <>
                <ChipRow
                  label="МОЙКА"
                  options={[['single', 'Одинарная'], ['double', 'Двойная']]}
                  value={cabinetSink[cab.id] ?? sinkTypeDefault}
                  onPick={(v) => setSink(cab.id, v as any)}
                />
                <ChipRow
                  label="КРАН · форма"
                  options={[['arch', 'Дуга'], ['straight', 'Прямой'], ['pull', 'Выдвижной']]}
                  value={cabinetFaucet[cab.id] ?? 'arch'}
                  onPick={(v) => setFaucetStyle(cab.id, v as any)}
                />
                <ChipRow
                  label="КРАН · цвет"
                  options={[['chrome', 'Хром'], ['black', 'Чёрный'], ['gold', 'Золото']]}
                  value={cabinetFaucetFinish[cab.id] ?? 'chrome'}
                  onPick={(v) => setFaucetFinish(cab.id, v as any)}
                />
              </>
            )}

            {hasStove && (
              <>
                <ChipRow
                  label="ПЛИТА"
                  options={[['induction', 'Индукция'], ['gas', 'Газ']]}
                  value={cabinetStove[cab.id] ?? stoveTypeDefault}
                  onPick={(v) => setStove(cab.id, v as any)}
                />
                <ChipRow
                  label="КОНФОРКИ"
                  options={[['4', '4 зоны'], ['2', '2 зоны']]}
                  value={String(cabinetBurners[cab.id] ?? 4)}
                  onPick={(v) => setBurners(cab.id, v === '2' ? 2 : 4)}
                />
              </>
            )}

          </View>
        );
      })()}
    </Animated.View>
  );
}

/** A labelled row of selectable chips. */
function ChipRow({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: [string, string][];
  value: string;
  onPick: (value: string) => void;
}) {
  return (
    <View style={styles.chipBlock}>
      <Text style={styles.chipLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map(([val, txt]) => {
          const active = val === value;
          return (
            <Pressable
              key={val}
              onPress={() => { hapticTap(); onPick(val); }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{txt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  hint: { ...TYPE.hint, color: COLORS.inkFaint, fontSize: 10, textAlign: 'center', marginTop: SPACE.xs },

  chipBlock: { marginBottom: SPACE.sm },
  chipLabel: { ...TYPE.sectionLabel, color: COLORS.inkMuted, fontSize: 9, marginBottom: 4 },
  swatchRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    marginBottom: SPACE.sm,
    paddingRight: SPACE.sm,
  },
  chipRow: { flexDirection: 'row', gap: SPACE.xs, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 6,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgSoft,
  },
  chipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  chipTxt: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 12 },
  chipTxtActive: { color: '#fff' },
});
