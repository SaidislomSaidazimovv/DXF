/**
 * Hardening sketch overlay (Phase D).
 *
 * When `hardeningSketchMode` is true, this overlay sits on top of the
 * 3D canvas and captures 2 taps to define a rectangle (face-local mm).
 * After the second tap a popover appears with Material + Joint + Label
 * inputs — per HANDOVER §6.3.
 *
 * V1 uses the 2-tap-corners approach (HANDOVER §12.2 — drag was the
 * default proposal, 2-tap is the negotiated alternative for V1 where
 * real raycasting against face-target meshes is deferred).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  GestureResponderEvent,
  TextInput,
} from 'react-native';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { COLORS, SPACE, TYPE, RADII } from '@/lib/tokens';
import { hapticTap } from '@/lib/haptics';
import type { HardeningPanel } from '@/types/ui';

interface Point { x: number; y: number; }

const FACE_W_MM = 600;
const FACE_H_MM = 820;

type MaterialOpt = HardeningPanel['material'];
type JointOpt    = HardeningPanel['joint'];

const MATERIALS: { value: MaterialOpt; label: string }[] = [
  { value: 'ldsp_16mm', label: 'ЛДСП 16мм' },
  { value: 'ldsp_18mm', label: 'ЛДСП 18мм' },
  { value: 'mdf_16mm',  label: 'МДФ 16мм'  },
];

const JOINTS: { value: JointOpt; label: string }[] = [
  { value: 'screws',    label: 'Шурупы'  },
  { value: 'clamex',    label: 'Clamex'  },
  { value: 'cam_dowel', label: 'Эксцентрик' },
];

export function HardeningSketchOverlay() {
  const sketchMode  = useUI((s) => s.hardeningSketchMode);
  const sketchFace  = useUI((s) => s.hardeningSketchFace);
  const sketchCabId = useUI((s) => s.hardeningSketchCabId);
  const variant     = useUI(selectCurrentVariant);
  const addPanel    = useUI((s) => s.addHardeningPanel);
  const exitSketch  = useUI((s) => s.exitHardeningSketchMode);

  const [a, setA] = useState<Point | null>(null);
  const [b, setB] = useState<Point | null>(null);
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  /* Popover fields — appear after second tap */
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [material, setMaterial] = useState<MaterialOpt>('ldsp_16mm');
  const [joint,    setJoint]    = useState<JointOpt>('screws');
  const [label,    setLabel]    = useState<string>('');

  if (!sketchMode || !sketchFace || !sketchCabId) return null;

  const cabinet = variant?.cabinets.find((c) => c.id === sketchCabId);

  const onPress = (e: GestureResponderEvent) => {
    if (popoverOpen) return;  // popover blocks further taps
    const { locationX, locationY } = e.nativeEvent;
    hapticTap();
    if (!a) {
      setA({ x: locationX, y: locationY });
      return;
    }
    if (!b) {
      setB({ x: locationX, y: locationY });
      /* Show popover for material/joint/label entry */
      setPopoverOpen(true);
      return;
    }
    /* Both already set → start a new rectangle */
    setA({ x: locationX, y: locationY });
    setB(null);
    setPopoverOpen(false);
  };

  const reset = () => {
    setA(null);
    setB(null);
    setPopoverOpen(false);
    setLabel('');
  };

  const computeMm = () => {
    if (!a || !b) return null;
    return {
      xMm: Math.round(Math.min(a.x, b.x) / Math.max(1, layout.w) * FACE_W_MM),
      yMm: Math.round(Math.min(a.y, b.y) / Math.max(1, layout.h) * FACE_H_MM),
      wMm: Math.round(Math.abs(b.x - a.x) / Math.max(1, layout.w) * FACE_W_MM),
      hMm: Math.round(Math.abs(b.y - a.y) / Math.max(1, layout.h) * FACE_H_MM),
    };
  };

  const save = () => {
    const dims = computeMm();
    if (!dims) return;
    if (dims.wMm < 40 || dims.hMm < 40) return;
    hapticTap();
    addPanel({
      cabinetId: sketchCabId,
      face: sketchFace,
      x: dims.xMm,
      y: dims.yMm,
      width:  dims.wMm,
      height: dims.hMm,
      material,
      joint,
      label: label.trim() || undefined,
    });
    reset();
  };

  /* Rectangle preview rect (in CSS coords) */
  const rect = a && b ? {
    left: Math.min(a.x, b.x),
    top:  Math.min(a.y, b.y),
    width:  Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  } : null;

  const dims = computeMm();

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        onLayout={(e) => setLayout({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        style={styles.tapSurface}
      >
        {/* Instruction toast */}
        {!popoverOpen && (
          <View style={styles.toast} pointerEvents="none">
            <Text style={styles.toastTxt}>
              {!a ? 'Тапните 1-й угол на грани' :
               !b ? 'Тапните 2-й угол прямоугольника' :
                    'Заполните параметры'}
            </Text>
            <Text style={styles.toastHint}>
              Грань: {sketchFace} · шкаф {cabinet?.id ?? sketchCabId}
            </Text>
          </View>
        )}

        {/* Corner markers */}
        {a && (
          <View style={[styles.corner, { left: a.x - 8, top: a.y - 8 }]} pointerEvents="none">
            <View style={styles.cornerDot} />
          </View>
        )}
        {b && (
          <View style={[styles.corner, { left: b.x - 8, top: b.y - 8 }]} pointerEvents="none">
            <View style={styles.cornerDot} />
          </View>
        )}

        {/* Rectangle preview */}
        {rect && (
          <View
            style={[styles.previewRect, rect]}
            pointerEvents="none"
          />
        )}
      </Pressable>

      {/* Popover — material/joint/label entry */}
      {popoverOpen && dims && (
        <View
          style={[
            styles.popover,
            {
              /* anchor popover near the rectangle bottom-right but clamp to screen */
              left: Math.min(layout.w - 280, (rect?.left ?? 0) + (rect?.width ?? 0) + 12),
              top:  Math.min(layout.h - 280, (rect?.top  ?? 0) + (rect?.height ?? 0) + 12),
            },
          ]}
        >
          <Text style={styles.popoverTitle}>
            Усилитель {dims.wMm}×{dims.hMm} мм
          </Text>

          <Text style={styles.popoverLabel}>МАТЕРИАЛ</Text>
          <View style={styles.popoverChips}>
            {MATERIALS.map((m) => (
              <Pressable
                key={m.value}
                onPress={() => { hapticTap(); setMaterial(m.value); }}
                style={[styles.popChip, material === m.value && styles.popChipActive]}
              >
                <Text style={[styles.popChipTxt, material === m.value && styles.popChipTxtActive]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.popoverLabel}>СОЕДИНЕНИЕ</Text>
          <View style={styles.popoverChips}>
            {JOINTS.map((j) => (
              <Pressable
                key={j.value}
                onPress={() => { hapticTap(); setJoint(j.value); }}
                style={[styles.popChip, joint === j.value && styles.popChipActive]}
              >
                <Text style={[styles.popChipTxt, joint === j.value && styles.popChipTxtActive]}>
                  {j.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.popoverLabel}>ЯРЛЫК</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="мой усилитель..."
            placeholderTextColor={COLORS.inkFaint}
            style={styles.popInput}
            maxLength={28}
          />

          <View style={styles.popActions}>
            <Pressable onPress={reset} style={styles.popCancel}>
              <Text style={styles.popCancelTxt}>Отмена</Text>
            </Pressable>
            <Pressable onPress={save} style={styles.popSave}>
              <Text style={styles.popSaveTxt}>Сохранить</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Exit sketch mode button (always visible) */}
      {!popoverOpen && (
        <View style={styles.actionBar}>
          <Pressable onPress={() => { hapticTap(); exitSketch(); }} style={styles.cancelBtn}>
            <Text style={styles.cancelTxt}>Выйти из эскиза</Text>
          </Pressable>
          {(a || b) && (
            <Pressable onPress={reset} style={styles.resetBtn}>
              <Text style={styles.resetTxt}>Сбросить точки</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tapSurface: {
    flex: 1,
    backgroundColor: 'rgba(184, 91, 29, 0.05)',
  },
  toast: {
    position: 'absolute',
    top: 80,
    left: SPACE.lg,
    right: SPACE.lg,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    backgroundColor: 'rgba(28,28,26,0.85)',
    borderRadius: RADII.engSharp,
  },
  toastTxt: { ...TYPE.bodyMed, color: '#fff' },
  toastHint: { ...TYPE.hint, color: '#ddd', marginTop: 2 },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.warn,
    borderWidth: 2,
    borderColor: '#fff',
  },
  previewRect: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.warn,
    backgroundColor: 'rgba(184, 91, 29, 0.18)',
    borderRadius: 4,
  },
  actionBar: {
    position: 'absolute',
    bottom: 16,
    left: SPACE.lg,
    right: SPACE.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACE.xs,
  },
  cancelBtn: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.engSharp,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
  },
  cancelTxt: { ...TYPE.bodyMed, color: COLORS.ink },
  resetBtn: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.engSharp,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
  },
  resetTxt: { ...TYPE.bodyMed, color: COLORS.inkSoft },

  /* Popover */
  popover: {
    position: 'absolute',
    width: 280,
    padding: SPACE.md,
    borderRadius: RADII.engSharp,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
  },
  popoverTitle: { ...TYPE.bodyMed, color: COLORS.ink, fontSize: 13 },
  popoverLabel: {
    ...TYPE.sectionLabel,
    color: COLORS.inkMuted,
    marginTop: SPACE.sm,
    fontSize: 9,
  },
  popoverChips: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  popChip: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.engSharp,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgSoft,
  },
  popChipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  popChipTxt: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 10 },
  popChipTxtActive: { color: '#fff' },
  popInput: {
    marginTop: 4,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 6,
    borderRadius: RADII.engSharp,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgSoft,
    color: COLORS.ink,
    fontSize: 12,
  },
  popActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACE.sm,
    gap: 6,
  },
  popCancel: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADII.engSharp,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    alignItems: 'center',
  },
  popCancelTxt: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 12 },
  popSave: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADII.engSharp,
    backgroundColor: COLORS.warn,
    alignItems: 'center',
  },
  popSaveTxt: { ...TYPE.bodyMed, color: '#fff', fontSize: 12 },
});
