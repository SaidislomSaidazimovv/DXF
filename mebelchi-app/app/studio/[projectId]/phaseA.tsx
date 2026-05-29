/**
 * Phase A — DISCOVERY & MEASUREMENT (Замер).
 *
 * Inputs:
 *   • wall length  (1200..3600mm)
 *   • ceiling height (2400..3000mm)
 *   • constraints (window, door, gas line, drain, water, outlet, hood vent)
 *     each pinned to a position along the wall via a draggable SVG marker.
 *
 * Exit criterion (HANDOVER §2.1):
 *   • wall + ceiling set
 *   • at least the obvious constraints captured (we don't enforce a count —
 *     the mebelchi may legitimately have an empty wall)
 *   • tap "Готово" → markPhaseComplete('A') + setPhase('B') + regenerate variants
 *
 * Layout: a horizontal "wall strip" with mm tick marks. Constraints drop
 * onto the strip from a horizontal palette below. Each constraint gets a
 * coloured pill on the strip; long-press to delete, pan to drag.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useUI } from '@/store/uiStore';
import { PhaseStepper } from '@/components/phase/PhaseStepper';
import { COLORS, SPACE, TYPE, RADII } from '@/lib/tokens';
import { hapticTap } from '@/lib/haptics';
import type {
  CeilingHeight,
  Constraint,
  ConstraintType,
} from '@/types/ui';
import { WALL_SIZES_MM, constraintLabel } from '@/types/ui';

const CEILING_OPTIONS: CeilingHeight[] = [2400, 2500, 2600, 2700, 3000];

interface PaletteEntry {
  type: ConstraintType;
  color: string;
  icon: string;
  defaultWidthMm?: number;
}

const PALETTE: PaletteEntry[] = [
  { type: 'window',      color: COLORS.constraintWindow, icon: '◫', defaultWidthMm: 900 },
  { type: 'door',        color: COLORS.constraintDoor,   icon: '⌐', defaultWidthMm: 800 },
  { type: 'gas_line',    color: COLORS.constraintGas,    icon: '◉' },
  { type: 'drain_stack', color: COLORS.constraintDrain,  icon: '↧' },
  { type: 'water_inlet', color: COLORS.constraintWater,  icon: '◇' },
  { type: 'outlet',      color: COLORS.constraintOutlet, icon: '⏛' },
  { type: 'hood_vent',   color: COLORS.constraintVent,   icon: '⬡' },
];

const STRIP_H = 96;
const STRIP_PAD = 16;
const MARKER_W = 28;

export default function PhaseA() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const wallMm = useUI((s) => s.wallLengthMm);
  const wallHeight = useUI((s) => s.wallHeightMm);
  const constraints = useUI((s) => s.constraints);
  const cycleWallLength = useUI((s) => s.cycleWallLength);
  const setWallLength = useUI((s) => s.setWallLength);
  const setWallHeight = useUI((s) => s.setWallHeight);
  const addConstraint = useUI((s) => s.addConstraint);
  const updateConstraint = useUI((s) => s.updateConstraint);
  const removeConstraint = useUI((s) => s.removeConstraint);
  const markPhaseComplete = useUI((s) => s.markPhaseComplete);
  const setPhase = useUI((s) => s.setPhase);
  const regenerateVariants = useUI((s) => s.regenerateVariants);

  const [stripW, setStripW] = useState(0);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [keypadValue, setKeypadValue] = useState('');
  const innerW = Math.max(0, stripW - STRIP_PAD * 2);
  const mmToPx = (mm: number) => (innerW * mm) / wallMm;
  const pxToMm = (px: number) => (px / Math.max(1, innerW)) * wallMm;

  /* Tick marks every 100mm minor, 500mm major */
  const ticks = useMemo(() => {
    const arr: { x: number; major: boolean; labelMm: number | null }[] = [];
    for (let mm = 0; mm <= wallMm; mm += 100) {
      arr.push({
        x: mmToPx(mm),
        major: mm % 500 === 0,
        labelMm: mm % 500 === 0 ? mm : null,
      });
    }
    return arr;
  }, [wallMm, innerW]);

  const openKeypad = () => {
    hapticTap();
    setKeypadValue(String(wallMm));
    setKeypadOpen(true);
  };

  const commitKeypad = () => {
    const raw = parseInt(keypadValue, 10);
    if (Number.isFinite(raw)) {
      /* Clamp 1200..6500, snap to 50mm */
      const clamped = Math.max(1200, Math.min(6500, raw));
      const snapped = Math.round(clamped / 50) * 50;
      setWallLength(snapped);
    }
    setKeypadOpen(false);
  };

  const dropFromPalette = (entry: PaletteEntry) => {
    hapticTap();
    addConstraint({
      type: entry.type,
      xMm: Math.round(wallMm / 2),
      widthMm: entry.defaultWidthMm,
      swingSide: entry.type === 'door' ? 'left' : undefined,
    });
  };

  const canAdvance = wallMm > 0 && wallHeight > 0;

  const onDone = () => {
    if (!canAdvance) return;
    hapticTap();
    regenerateVariants();
    markPhaseComplete('A');
    setPhase('B');
    router.replace(`/studio/${projectId}/phaseB`);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <PhaseStepper />

      <View style={styles.headerRow}>
        <Text style={styles.brand}>MEBELCHI</Text>
        <Text style={styles.tag}>ЗАМЕР</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        {/* Wall length */}
        <Text style={styles.sectionLabel}>ДЛИНА СТЕНЫ</Text>
        <Pressable
          style={styles.wallPill}
          onPress={() => { hapticTap(); cycleWallLength(); }}
          onLongPress={openKeypad}
        >
          <Text style={styles.wallPillTxt}>{wallMm} мм</Text>
          <Text style={styles.wallPillHint}>
            long-press · ввод
          </Text>
        </Pressable>

        {/* Ceiling height */}
        <Text style={[styles.sectionLabel, { marginTop: SPACE.lg }]}>ВЫСОТА ПОТОЛКА</Text>
        <View style={styles.ceilingRow}>
          {CEILING_OPTIONS.map((h) => {
            const active = h === wallHeight;
            return (
              <Pressable
                key={h}
                onPress={() => { hapticTap(); setWallHeight(h); }}
                style={[styles.ceilingChip, active && styles.ceilingChipActive]}
              >
                <Text style={[styles.ceilingTxt, active && styles.ceilingTxtActive]}>
                  {h}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Wall strip */}
        <Text style={[styles.sectionLabel, { marginTop: SPACE.lg }]}>
          СТЕНА — ОТМЕТЬТЕ ОГРАНИЧЕНИЯ
        </Text>
        <View
          style={styles.strip}
          onLayout={(e) => setStripW(e.nativeEvent.layout.width)}
        >
          <Svg width="100%" height={STRIP_H} style={StyleSheet.absoluteFill}>
            {/* Wall background */}
            <Rect
              x={STRIP_PAD}
              y={28}
              width={innerW}
              height={STRIP_H - 56}
              fill={COLORS.bgCard}
              stroke={COLORS.lineStrong}
              strokeWidth={1}
              rx={6}
            />
            {/* Floor line */}
            <Line
              x1={STRIP_PAD}
              y1={STRIP_H - 24}
              x2={STRIP_PAD + innerW}
              y2={STRIP_H - 24}
              stroke={COLORS.ink}
              strokeWidth={1.5}
            />
            {/* Ticks */}
            <G>
              {ticks.map((t, i) => (
                <G key={i}>
                  <Line
                    x1={STRIP_PAD + t.x}
                    y1={STRIP_H - 24}
                    x2={STRIP_PAD + t.x}
                    y2={STRIP_H - 24 + (t.major ? 8 : 4)}
                    stroke={COLORS.inkSoft}
                    strokeWidth={t.major ? 1 : 0.5}
                  />
                  {t.labelMm !== null && (
                    <SvgText
                      x={STRIP_PAD + t.x}
                      y={STRIP_H - 6}
                      fontSize={9}
                      fill={COLORS.inkMuted}
                      textAnchor="middle"
                    >
                      {t.labelMm}
                    </SvgText>
                  )}
                </G>
              ))}
            </G>
          </Svg>

          {/* Constraint markers — rendered as RN Views layered above SVG */}
          {constraints.map((c) => (
            <ConstraintMarker
              key={c.id}
              c={c}
              innerW={innerW}
              wallMm={wallMm}
              onMove={(newMm) => updateConstraint(c.id, { xMm: newMm })}
              onLongPress={() => { hapticTap(); removeConstraint(c.id); }}
              onTap={() => {
                /* Doors: cycle swing side. Other types: no-op (move via drag). */
                if (c.type !== 'door') return;
                hapticTap();
                updateConstraint(c.id, {
                  swingSide: c.swingSide === 'left' ? 'right' : 'left',
                });
              }}
            />
          ))}
        </View>

        {/* Palette */}
        <Text style={[styles.sectionLabel, { marginTop: SPACE.lg }]}>ДОБАВИТЬ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.paletteRow}>
            {PALETTE.map((p) => (
              <Pressable
                key={p.type}
                onPress={() => dropFromPalette(p)}
                style={[styles.paletteChip, { borderColor: p.color }]}
              >
                <Text style={[styles.paletteIcon, { color: p.color }]}>{p.icon}</Text>
                <Text style={styles.paletteLabel}>
                  {constraintLabel(p.type, 'ru')}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Constraint count summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTxt}>
            Отмечено ограничений: {constraints.length}
          </Text>
          <Text style={styles.summaryHint}>
            (долгое нажатие на маркер — удалить)
          </Text>
        </View>
      </ScrollView>

      {/* Done CTA */}
      <View style={styles.ctaRow}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backTxt}>← назад</Text>
        </Pressable>
        <Pressable
          onPress={onDone}
          disabled={!canAdvance}
          style={[styles.doneBtn, !canAdvance && styles.doneBtnDisabled]}
        >
          <Text style={styles.doneTxt}>Готово · к планировке →</Text>
        </Pressable>
      </View>

      {/* Numeric keypad for wall length */}
      <Modal
        transparent
        visible={keypadOpen}
        animationType="fade"
        onRequestClose={() => setKeypadOpen(false)}
      >
        <Pressable style={styles.keypadBackdrop} onPress={() => setKeypadOpen(false)}>
          <Pressable style={styles.keypadCard} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.sectionLabel}>ДЛИНА СТЕНЫ (мм)</Text>
            <TextInput
              style={styles.keypadInput}
              keyboardType="number-pad"
              autoFocus
              value={keypadValue}
              onChangeText={setKeypadValue}
              maxLength={4}
            />
            <Text style={styles.keypadHint}>
              диапазон 1200–6500, шаг 50
            </Text>
            <View style={styles.keypadRow}>
              <Pressable onPress={() => setKeypadOpen(false)} style={styles.keypadCancel}>
                <Text style={styles.keypadCancelTxt}>Отмена</Text>
              </Pressable>
              <Pressable onPress={commitKeypad} style={styles.keypadOk}>
                <Text style={styles.keypadOkTxt}>OK</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Marker — draggable pill anchored on the wall strip.
 */
function ConstraintMarker({
  c,
  innerW,
  wallMm,
  onMove,
  onLongPress,
  onTap,
}: {
  c: Constraint;
  innerW: number;
  wallMm: number;
  onMove: (mm: number) => void;
  onLongPress: () => void;
  onTap: () => void;
}) {
  const baseX = (innerW * c.xMm) / Math.max(1, wallMm);
  const offset = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      offset.value = e.translationX;
    })
    .onEnd(() => {
      const newPx = baseX + offset.value;
      const clamped = Math.max(0, Math.min(innerW, newPx));
      const newMm = Math.round((clamped / Math.max(1, innerW)) * wallMm / 50) * 50;
      offset.value = 0;
      runOnJS(onMove)(newMm);
    });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => runOnJS(onLongPress)());

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((_e, success) => { if (success) runOnJS(onTap)(); });

  const composed = Gesture.Exclusive(longPress, pan, tap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const color =
    c.type === 'window' ? COLORS.constraintWindow :
    c.type === 'door' ? COLORS.constraintDoor :
    c.type === 'gas_line' ? COLORS.constraintGas :
    c.type === 'drain_stack' ? COLORS.constraintDrain :
    c.type === 'water_inlet' ? COLORS.constraintWater :
    c.type === 'outlet' ? COLORS.constraintOutlet :
    COLORS.constraintVent;

  const wPx = c.widthMm ? Math.max(MARKER_W, (innerW * c.widthMm) / wallMm) : MARKER_W;

  const swingIcon = c.type === 'door'
    ? (c.swingSide === 'right' ? '⇆' : '⇄')
    : null;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        collapsable={false}
        style={[
          {
            position: 'absolute',
            left: STRIP_PAD + baseX - wPx / 2,
            top: 18,
            width: wPx,
            height: STRIP_H - 56,
            backgroundColor: color,
            borderRadius: 6,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.92,
          },
          animStyle,
        ]}
      >
        <Text style={styles.markerLabel} numberOfLines={1}>
          {swingIcon ? swingIcon + ' ' : ''}{c.xMm}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xs,
  },
  brand: { ...TYPE.brandLogo, color: COLORS.ink, fontSize: 13, letterSpacing: 1.5 },
  tag: { ...TYPE.brandTag, color: COLORS.inkFaint, letterSpacing: 1.6 },
  scroll: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xl },

  sectionLabel: {
    ...TYPE.sectionLabel,
    color: COLORS.inkMuted,
    marginTop: SPACE.md,
    marginBottom: SPACE.xs,
  },

  wallPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgCard,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  wallPillTxt: { ...TYPE.wallPill, color: COLORS.ink },
  wallPillHint: { ...TYPE.hint, color: COLORS.inkFaint },

  ceilingRow: { flexDirection: 'row', gap: SPACE.xs, flexWrap: 'wrap' },
  ceilingChip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgCard,
  },
  ceilingChipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  ceilingTxt: { ...TYPE.bodyMed, color: COLORS.inkSoft },
  ceilingTxtActive: { color: '#fff' },

  strip: {
    height: STRIP_H,
    backgroundColor: 'transparent',
    marginTop: SPACE.xs,
  },

  paletteRow: { flexDirection: 'row', gap: SPACE.xs, paddingVertical: SPACE.xs },
  paletteChip: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
    borderRadius: RADII.md,
    borderWidth: 1,
    backgroundColor: COLORS.bgCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paletteIcon: { fontSize: 16, lineHeight: 18 },
  paletteLabel: { ...TYPE.body, color: COLORS.ink },

  markerLabel: { color: '#fff', fontSize: 10, fontWeight: '600' },

  summary: {
    marginTop: SPACE.lg,
    paddingTop: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  summaryTxt: { ...TYPE.bodyMed, color: COLORS.ink },
  summaryHint: { ...TYPE.hint, color: COLORS.inkFaint, marginTop: 2 },

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.bgSoft,
  },
  backBtn: { paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs },
  backTxt: { ...TYPE.body, color: COLORS.inkSoft },
  doneBtn: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.ink,
  },
  doneBtnDisabled: { opacity: 0.4 },
  doneTxt: { ...TYPE.bodyMed, color: '#fff', letterSpacing: 0.3 },

  keypadBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
  },
  keypadCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    padding: SPACE.lg,
  },
  keypadInput: {
    fontSize: 36,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.ink,
    paddingVertical: SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  keypadHint: {
    ...TYPE.hint,
    color: COLORS.inkFaint,
    textAlign: 'center',
    marginTop: SPACE.xs,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACE.lg,
  },
  keypadCancel: {
    flex: 1,
    marginRight: 8,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    alignItems: 'center',
  },
  keypadCancelTxt: { ...TYPE.bodyMed, color: COLORS.inkSoft },
  keypadOk: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
  },
  keypadOkTxt: { ...TYPE.bodyMed, color: '#fff' },
});
