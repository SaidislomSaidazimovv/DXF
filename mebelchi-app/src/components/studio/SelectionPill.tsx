/**
 * SelectionPill — right-edge contextual rail + flyout (research-driven redesign).
 *
 * Replaces the tall bottom modal that used to cover the 3D view (and forced
 * the camera to zoom far out). Instead:
 *   • a thin vertical RAIL pinned to the right edge shows only the section
 *     icons relevant to the selected element (Material-Design navigation-rail
 *     pattern: icon + tiny label, 3–7 destinations, ~64dp wide);
 *   • tapping a section icon opens a narrow FLYOUT overlay to its left with
 *     that section's controls, which the master scrolls + taps to choose;
 *   • tapping the active icon again closes the flyout → full clean 3D.
 *
 * Because the bottom is now free, the camera can frame the element MUCH
 * closer (CameraRig biases it to the left so the flyout never covers it).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { cabinetLabel, INTERACTION } from '@/types/ui';
import type { MaterialId } from '@/types/ui';
import { PALETTE_MATERIALS, WORKTOP_COLORS } from '@/mocks/materials';
import { MiniSwatch } from '@/components/shared/MiniSwatch';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';
import { useT } from '@/lib/i18n';
import { hapticTap, hapticSwatch } from '@/lib/haptics';

/** Approx height of StudioBottomBar (paddingVert 12*2 + button height ~46) */
const BOTTOM_BAR_HEIGHT = 78;

interface Section {
  key: string;
  icon: string;
  label: string;
  content: React.ReactNode;
}

export function SelectionPill() {
  const selectedId = useUI((s) => s.selectedCabinetId);
  const selectedUpperId = useUI((s) => s.selectedUpperId);
  const selectedWorktop = useUI((s) => s.selectedWorktop);
  const worktopOverride = useUI((s) => s.worktopOverride);
  const variant = useUI(selectCurrentVariant);
  const lang = useUI((s) => s.language);
  const selectCabinet = useUI((s) => s.selectCabinet);
  const selectUpper = useUI((s) => s.selectUpper);
  const selectWorktop = useUI((s) => s.selectWorktop);
  const setWorktopColor = useUI((s) => s.setWorktopColor);
  const resizeCabinet = useUI((s) => s.resizeCabinet);

  /* Per-element current values + global fallbacks */
  const globalMaterial = useUI((s) => s.globalMaterial);
  const globalDoorStyle = useUI((s) => s.globalDoorStyle);
  const sinkTypeDefault = useUI((s) => s.sinkType);
  const stoveTypeDefault = useUI((s) => s.stoveType);
  const globalHandle = useUI((s) => s.globalHandle);
  const globalFaucetStyle = useUI((s) => s.globalFaucetStyle);
  const globalFaucetFinish = useUI((s) => s.globalFaucetFinish);
  const cabinetMaterial = useUI((s) => s.cabinetMaterial);
  const cabinetDoorStyle = useUI((s) => s.cabinetDoorStyle);
  const cabinetHandle = useUI((s) => s.cabinetHandle);
  const cabinetSink = useUI((s) => s.cabinetSink);
  const cabinetStove = useUI((s) => s.cabinetStove);
  const cabinetFaucet = useUI((s) => s.cabinetFaucet);
  const cabinetFaucetFinish = useUI((s) => s.cabinetFaucetFinish);
  const cabinetBurners = useUI((s) => s.cabinetBurners);
  const drawerTypes = useUI((s) => s.drawerTypes);
  const upperMaterialMap = useUI((s) => s.upperMaterial);
  const upperHandleMap = useUI((s) => s.upperHandle);
  const upperTypeMap = useUI((s) => s.upperType);

  /* Direct setters for chip controls */
  const setCabMaterial = useUI((s) => s.setCabinetMaterial);
  const setUpperMaterial = useUI((s) => s.setUpperMaterial);
  const setUpperHandle = useUI((s) => s.setUpperHandle);
  const setUpperType = useUI((s) => s.setUpperType);
  const setDoorStyle = useUI((s) => s.setCabinetDoorStyle);
  const setHandle = useUI((s) => s.setCabinetHandle);
  const setSink = useUI((s) => s.setCabinetSink);
  const setStove = useUI((s) => s.setCabinetStove);
  const setFaucetStyle = useUI((s) => s.setCabinetFaucetStyle);
  const setFaucetFinish = useUI((s) => s.setCabinetFaucetFinish);
  const setBurners = useUI((s) => s.setCabinetBurners);
  const setDrawerCount = useUI((s) => s.setCabinetDrawerCount);
  const setDrawerType = useUI((s) => s.setDrawerType);
  const setCabinetType = useUI((s) => s.setCabinetType);

  const t = useT();
  const insets = useSafeAreaInsets();
  const bottomAnchor = insets.bottom + BOTTOM_BAR_HEIGHT + 12;

  const [activeKey, setActiveKey] = useState<string | null>(null);

  const cab = variant?.cabinets.find((c) => c.id === selectedId);
  const isOpen = selectedWorktop || !!selectedUpperId || !!cab;

  /* Identity of the current selection — re-opens the first section on change */
  const selKey = selectedWorktop ? 'wt' : selectedUpperId ?? cab?.id ?? null;

  /* ── Build the contextual section list ──────────────────────────────── */
  const sections: Section[] = [];

  const colorSwatches = (
    activeId: string,
    current: string,
    onPick: (id: MaterialId) => void,
  ) => (
    <View style={styles.swatchGrid}>
      {PALETTE_MATERIALS.map((m) => (
        <MiniSwatch
          key={m.id}
          material={m}
          active={current === m.id}
          onPress={() => { hapticSwatch(); onPick(m.id as MaterialId); }}
          size={44}
        />
      ))}
    </View>
  );

  if (selectedWorktop) {
    sections.push({
      key: 'color',
      icon: '🎨',
      label: 'ЦВЕТ',
      content: (
        <View style={styles.swatchGrid}>
          {WORKTOP_COLORS.map((c) => {
            const active = (worktopOverride ?? -1) === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => { hapticSwatch(); setWorktopColor(c.value); }}
                style={[
                  styles.worktopSwatch,
                  { backgroundColor: '#' + c.value.toString(16).padStart(6, '0') },
                  active && styles.worktopSwatchActive,
                ]}
              />
            );
          })}
        </View>
      ),
    });
  } else if (selectedUpperId) {
    const id = selectedUpperId;
    sections.push({
      key: 'color',
      icon: '🎨',
      label: 'ЦВЕТ',
      content: colorSwatches(
        id,
        upperMaterialMap[id] ?? globalMaterial,
        (m) => setUpperMaterial(id, m),
      ),
    });
    sections.push({
      key: 'type',
      icon: '🗄️',
      label: 'ТИП',
      content: (
        <ChipRow
          options={[['closed', 'Закрытый'], ['open', 'Открытый'], ['glass', 'Стекло'], ['lift', 'Подъёмный'], ['rail', 'Рейлинг']]}
          value={upperTypeMap[id] ?? 'closed'}
          onPick={(v) => setUpperType(id, v as any)}
        />
      ),
    });
    sections.push({
      key: 'handle',
      icon: '🎛️',
      label: 'РУЧКА',
      content: (
        <ChipRow
          options={[['bar', 'Рейлинг'], ['knob', 'Кнопка'], ['inset', 'Врезная']]}
          value={upperHandleMap[id] ?? 'bar'}
          onPick={(v) => setUpperHandle(id, v as any)}
        />
      ),
    });
  } else if (cab) {
    const id = cab.id;
    const type = cab.type;
    const widthMm = Math.round(cab.width * 1000);
    const isDrawer = type === 'drawer3' || type === 'drawer4';
    const isShelf = type === 'open_shelf';
    const hasSink = type === 'sink' || type === 'sink_stove';
    const hasStove = type === 'stove' || type === 'sink_stove';
    const hasDoor = !isDrawer && !isShelf && !hasSink && !hasStove && type !== 'fridge';
    const carcassType = isDrawer ? 'drawer3' : isShelf ? 'open_shelf' : 'base';

    sections.push({
      key: 'color',
      icon: '🎨',
      label: 'ЦВЕТ',
      content: colorSwatches(
        id,
        cabinetMaterial[id] ?? globalMaterial,
        (m) => setCabMaterial(id, m),
      ),
    });

    sections.push({
      key: 'size',
      icon: '📏',
      label: 'РАЗМЕР',
      content: (
        <View style={styles.widthRow}>
          <Pressable
            onPress={() => { hapticTap(); resizeCabinet(id, -INTERACTION.RESIZE_STEP_MM); }}
            style={({ pressed }) => [styles.widthBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.widthSign}>−</Text>
          </Pressable>
          <View style={styles.widthValBox}>
            <Text style={styles.widthVal}>{widthMm}</Text>
            <Text style={styles.widthUnit}>{t('unit_mm')}</Text>
          </View>
          <Pressable
            onPress={() => { hapticTap(); resizeCabinet(id, +INTERACTION.RESIZE_STEP_MM); }}
            style={({ pressed }) => [styles.widthBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.widthSign}>+</Text>
          </Pressable>
        </View>
      ),
    });

    if (hasDoor || isDrawer || isShelf) {
      sections.push({
        key: 'carcass',
        icon: '🗄️',
        label: 'ТИП',
        content: (
          <ChipRow
            options={[['base', 'Двери'], ['drawer3', 'Ящики'], ['open_shelf', 'Полки']]}
            value={carcassType}
            onPick={(v) => setCabinetType(id, v as any)}
          />
        ),
      });
    }

    if (hasDoor) {
      sections.push({
        key: 'door',
        icon: '🚪',
        label: 'ФАСАД',
        content: (
          <>
            <Text style={styles.chipLabel}>ФАСАД</Text>
            <ChipRow
              options={[['flat', 'Гладкая'], ['shaker', 'Шейкер'], ['grooved', 'Фрезеровка'], ['glass', 'Стекло'], ['slat', 'Рейки'], ['profile', 'Профиль']]}
              value={cabinetDoorStyle[id] ?? globalDoorStyle}
              onPick={(v) => setDoorStyle(id, v as any)}
            />
            <Text style={[styles.chipLabel, { marginTop: SPACE.md }]}>РУЧКА</Text>
            <ChipRow
              options={[['bar', 'Рейлинг'], ['knob', 'Кнопка'], ['inset', 'Врезная']]}
              value={cabinetHandle[id] ?? globalHandle}
              onPick={(v) => setHandle(id, v as any)}
            />
          </>
        ),
      });
    }

    if (isDrawer) {
      const count = type === 'drawer4' ? 4 : 3;
      sections.push({
        key: 'drawers',
        icon: '🗃️',
        label: 'ЯЩИКИ',
        content: (
          <>
            <Text style={styles.chipLabel}>КОЛИЧЕСТВО</Text>
            <ChipRow
              options={[['drawer3', '3 ящика'], ['drawer4', '4 ящика']]}
              value={type}
              onPick={(v) => setDrawerCount(id, v === 'drawer4' ? 4 : 3)}
            />
            {Array.from({ length: count }).map((_, i) => (
              <View key={i}>
                <Text style={[styles.chipLabel, { marginTop: SPACE.md }]}>ЯЩИК {i + 1}</Text>
                <ChipRow
                  options={[['closed', 'Закрытый'], ['open', 'Открытый'], ['organizer', 'Органайзер'], ['glass', 'Стекло'], ['mesh', 'Сетка']]}
                  value={drawerTypes[`${id}#${i}`] ?? 'closed'}
                  onPick={(v) => setDrawerType(id, i, v as any)}
                />
              </View>
            ))}
          </>
        ),
      });
    }

    if (hasSink) {
      sections.push({
        key: 'sink',
        icon: '🚰',
        label: 'МОЙКА',
        content: (
          <>
            <Text style={styles.chipLabel}>МОЙКА</Text>
            <ChipRow
              options={[['single', 'Одинарная'], ['double', 'Двойная'], ['one_half', 'Полуторная'], ['drainboard', 'С крылом']]}
              value={cabinetSink[id] ?? sinkTypeDefault}
              onPick={(v) => setSink(id, v as any)}
            />
            <Text style={[styles.chipLabel, { marginTop: SPACE.md }]}>КРАН · форма</Text>
            <ChipRow
              options={[['arch', 'Дуга'], ['straight', 'Прямой'], ['pull', 'Выдвижной'], ['twin', 'Двухвентильный'], ['spring', 'Пружина']]}
              value={cabinetFaucet[id] ?? globalFaucetStyle}
              onPick={(v) => setFaucetStyle(id, v as any)}
            />
            <Text style={[styles.chipLabel, { marginTop: SPACE.md }]}>КРАН · цвет</Text>
            <ChipRow
              options={[['chrome', 'Хром'], ['black', 'Чёрный'], ['gold', 'Золото']]}
              value={cabinetFaucetFinish[id] ?? globalFaucetFinish}
              onPick={(v) => setFaucetFinish(id, v as any)}
            />
          </>
        ),
      });
    }

    if (hasStove) {
      sections.push({
        key: 'stove',
        icon: '🔥',
        label: 'ПЛИТА',
        content: (
          <>
            <Text style={styles.chipLabel}>ПЛИТА</Text>
            <ChipRow
              options={[['induction', 'Индукция'], ['gas', 'Газ'], ['gas_glass', 'Газ на стекле']]}
              value={cabinetStove[id] ?? stoveTypeDefault}
              onPick={(v) => setStove(id, v as any)}
            />
            <Text style={[styles.chipLabel, { marginTop: SPACE.md }]}>КОНФОРКИ</Text>
            <ChipRow
              options={[['4', '4 зоны'], ['2', '2 зоны'], ['1', '1 (домино)']]}
              value={String(cabinetBurners[id] ?? 4)}
              onPick={(v) => setBurners(id, v === '1' ? 1 : v === '2' ? 2 : 4)}
            />
          </>
        ),
      });
    }
  }

  /* Header name for the flyout */
  const headerName = selectedWorktop
    ? 'СТОЛЕШНИЦА'
    : selectedUpperId
      ? 'ВЕРХНИЙ ШКАФ'
      : cab
        ? `${cabinetLabel(cab.type, lang)} · ${Math.round(cab.width * 1000)} ${t('unit_mm')}`
        : '';

  /* Auto-open the first section whenever the selection changes; clear on close */
  useEffect(() => {
    if (selKey) setActiveKey('color');
    else setActiveKey(null);
  }, [selKey]);

  /* Flyout entry animation, retriggered on section change */
  const flyAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!activeKey) return;
    flyAnim.setValue(0);
    Animated.timing(flyAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [activeKey, flyAnim]);

  if (!isOpen) return null;

  const active = sections.find((s) => s.key === activeKey);
  const closeSelection = () => {
    hapticTap();
    if (selectedWorktop) selectWorktop(false);
    else if (selectedUpperId) selectUpper(null);
    else selectCabinet(null);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* ── Flyout (opens to the left of the rail) ── */}
      {active && (
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.flyWrap,
            { bottom: bottomAnchor },
            {
              opacity: flyAnim,
              transform: [{ translateX: flyAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            },
          ]}
        >
          <View style={styles.flyCard}>
            <Text style={styles.flyName} numberOfLines={1}>{headerName}</Text>
            <Text style={styles.flySection}>{active.label}</Text>
            <View style={styles.divider} />
            <ScrollView
              style={styles.flyScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {active.content}
            </ScrollView>
          </View>
        </Animated.View>
      )}

      {/* ── Rail (right edge) ── */}
      <View style={[styles.railWrap, { bottom: bottomAnchor }]} pointerEvents="box-none">
        <View style={styles.railCard}>
          {sections.map((s) => {
            const on = s.key === activeKey;
            return (
              <Pressable
                key={s.key}
                onPress={() => { hapticTap(); setActiveKey((p) => (p === s.key ? null : s.key)); }}
                style={({ pressed }) => [styles.railItem, on && styles.railItemOn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.railIcon}>{s.icon}</Text>
                <Text style={[styles.railLabel, on && styles.railLabelOn]} numberOfLines={1}>{s.label}</Text>
              </Pressable>
            );
          })}
          <View style={styles.railDivider} />
          <Pressable
            onPress={closeSelection}
            hitSlop={8}
            style={({ pressed }) => [styles.railClose, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.railCloseTxt}>×</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** A wrap row of selectable chips. */
function ChipRow({
  options,
  value,
  onPick,
}: {
  options: [string, string][];
  value: string;
  onPick: (value: string) => void;
}) {
  return (
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
  );
}

const RAIL_W = 60;

const styles = StyleSheet.create({
  /* ── Rail ── */
  railWrap: {
    position: 'absolute',
    right: SPACE.sm,
    top: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  railCard: {
    width: RAIL_W,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    paddingVertical: SPACE.sm,
    alignItems: 'center',
    ...SHADOWS.xl,
  },
  railItem: {
    width: RAIL_W - 8,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.md,
    alignItems: 'center',
    marginVertical: 1,
  },
  railItemOn: { backgroundColor: COLORS.bgSoft },
  railIcon: { fontSize: 21, marginBottom: 2 },
  railLabel: { ...TYPE.sectionLabel, color: COLORS.inkMuted, fontSize: 8 },
  railLabelOn: { color: COLORS.ink },
  railDivider: {
    width: RAIL_W - 20,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.line,
    marginVertical: SPACE.xs,
  },
  railClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.bgSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  railCloseTxt: { fontSize: 22, color: COLORS.inkSoft, marginTop: -3 },

  /* ── Flyout ── */
  flyWrap: {
    position: 'absolute',
    right: RAIL_W + SPACE.sm + SPACE.sm,
    top: 0,
    width: '48%',
    justifyContent: 'flex-end',
  },
  flyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    padding: SPACE.lg,
    maxHeight: 380,
    ...SHADOWS.xl,
  },
  flyName: { ...TYPE.sectionLabel, color: COLORS.inkMuted, fontSize: 9 },
  flySection: { ...TYPE.sectionLabel, color: COLORS.ink, fontSize: 14, marginTop: 2 },
  flyScroll: {},

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.line, marginVertical: SPACE.md },

  /* ── Controls ── */
  chipLabel: { ...TYPE.sectionLabel, color: COLORS.inkMuted, fontSize: 9, marginBottom: 6 },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  worktopSwatch: {
    width: 48,
    height: 40,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  worktopSwatchActive: { borderWidth: 2, borderColor: COLORS.ink },
  widthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  widthBtn: {
    width: 52, height: 48, borderRadius: RADII.md,
    backgroundColor: COLORS.bgSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  widthSign: { fontSize: 24, color: COLORS.ink, fontWeight: '300' },
  widthValBox: {
    flex: 1, height: 48, borderRadius: RADII.md,
    backgroundColor: COLORS.bgSoft,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACE.xs,
  },
  widthVal:  { ...TYPE.wallPill, color: COLORS.ink, fontFamily: 'monospace' },
  widthUnit: { ...TYPE.body, color: COLORS.inkMuted, fontSize: 12 },
  chipRow: { flexDirection: 'row', gap: SPACE.xs, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 8,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgSoft,
  },
  chipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  chipTxt: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 12 },
  chipTxtActive: { color: '#fff' },
});
