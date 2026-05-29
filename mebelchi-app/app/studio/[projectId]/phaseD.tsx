/**
 * Phase D — ENGINEERING (Инженерия).
 *
 * Visual theme shifts: bg → bgEng (darker workshop tone), sharp corners.
 * Adds an "X-ray" view toggle (alongside 3D / 2D) so the mebelchi sees
 * the carcass + drill marks. Hardware overrides surface via a panel that
 * lists each cabinet with its current hinge/slide brand.
 *
 * Hardening Sketch Mode (HANDOVER §4.4): the killer feature. When armed,
 * the canvas turns into a sketch surface for adding custom reinforcement
 * panels onto a chosen face of the selected cabinet. Presets (slots 1-3)
 * let the master save their go-to designs.
 *
 * Exit: tap "К расчёту" → mark D complete + go to phaseE.
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { Canvas3D } from '@/components/studio/scene/Canvas3D';
import { HardeningSketchOverlay } from '@/components/studio/HardeningSketchOverlay';
import { PhaseStepper } from '@/components/phase/PhaseStepper';
import { COLORS, SPACE, TYPE, RADII } from '@/lib/tokens';
import { hapticTap } from '@/lib/haptics';
import type {
  HingeBrand,
  HingeOverlay,
  SlideBrand,
  SlideLength,
  HardeningPanel,
} from '@/types/ui';
import { cabinetLabel } from '@/types/ui';

const HINGES: HingeBrand[] = ['blum', 'hettich', 'boyard'];
const OVERLAYS: HingeOverlay[] = ['full', 'half', 'inset'];
const SLIDES: SlideBrand[] = ['blum', 'hettich'];
const SLIDE_LENGTHS: SlideLength[] = [450, 500];
const FACES: HardeningPanel['face'][] = ['back', 'left', 'right', 'bottom', 'top'];

const OVERLAY_LABEL: Record<HingeOverlay, string> = {
  full:  'Полный',
  half:  'Полу',
  inset: 'Накладной',
};

export default function PhaseD() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  const variant = useUI(selectCurrentVariant);
  const cabinetHardware = useUI((s) => s.cabinetHardware);
  const hardeningPanels = useUI((s) => s.hardeningPanels);
  const sketchMode = useUI((s) => s.hardeningSketchMode);
  const sketchCabId = useUI((s) => s.hardeningSketchCabId);
  const sketchFace = useUI((s) => s.hardeningSketchFace);
  const viewMode = useUI((s) => s.viewMode);
  const presets = useUI((s) => s.hardeningPresets);

  const setViewMode = useUI((s) => s.setViewMode);
  const setCabinetHardware = useUI((s) => s.setCabinetHardware);
  const enterSketch = useUI((s) => s.enterHardeningSketchMode);
  const exitSketch = useUI((s) => s.exitHardeningSketchMode);
  const addPanel = useUI((s) => s.addHardeningPanel);
  const removePanel = useUI((s) => s.removeHardeningPanel);
  const savePreset = useUI((s) => s.saveHardeningPreset);
  const loadPreset = useUI((s) => s.loadHardeningPreset);
  const markPhaseComplete = useUI((s) => s.markPhaseComplete);
  const setPhase = useUI((s) => s.setPhase);
  const saveProject = useUI((s) => s.saveCurrentProject);

  const [pendingPresetSlot, setPendingPresetSlot] = useState<1 | 2 | 3 | null>(null);

  const [panelOpen, setPanelOpen] = useState<'hardware' | 'hardening' | null>(null);

  const onAdvance = () => {
    hapticTap();
    markPhaseComplete('D');
    setPhase('E');
    saveProject();
    router.replace(`/studio/${projectId}/phaseE`);
  };

  const onArmFace = (cabId: string, face: HardeningPanel['face']) => {
    hapticTap();
    enterSketch(cabId, face);
  };

  const onDropMockPanel = () => {
    if (!sketchCabId || !sketchFace) return;
    hapticTap();
    /* If a preset slot is armed, drop with preset dims; otherwise default. */
    const preset = pendingPresetSlot ? loadPreset(pendingPresetSlot) : null;
    addPanel({
      cabinetId: sketchCabId,
      face: sketchFace,
      x: 50,
      y: 50,
      width:  preset?.width  ?? 400,
      height: preset?.height ?? 200,
      material: preset?.material ?? 'ldsp_16mm',
      joint:    preset?.joint    ?? 'screws',
      label:    preset?.label,
    });
    setPendingPresetSlot(null);
  };

  /* Save the most-recently-added panel as a preset in slot 1/2/3. */
  const onSaveAsPreset = (slot: 1 | 2 | 3) => {
    const last = hardeningPanels[hardeningPanels.length - 1];
    if (!last) return;
    hapticTap();
    savePreset(slot, {
      width:  last.width,
      height: last.height,
      material: last.material,
      joint:    last.joint,
      label:    last.label ?? `Пресет ${slot}`,
    });
  };

  /* Arm a preset slot — next sketch will use these dims. */
  const onArmPreset = (slot: 1 | 2 | 3) => {
    if (!loadPreset(slot)) return;
    hapticTap();
    setPendingPresetSlot(slot);
  };

  const cabinets = variant?.cabinets ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <PhaseStepper />

      <View style={styles.topRow}>
        <View>
          <Text style={styles.brand}>MEBELCHI</Text>
          <Text style={styles.tag}>ИНЖЕНЕРИЯ</Text>
        </View>
        <View style={styles.viewToggle}>
          {(['3d', 'xray', '2d'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => { hapticTap(); setViewMode(m); }}
              style={[styles.viewBtn, viewMode === m && styles.viewBtnActive]}
            >
              <Text
                style={[
                  styles.viewBtnTxt,
                  viewMode === m && styles.viewBtnTxtActive,
                ]}
              >
                {m === '3d' ? '3D' : m === 'xray' ? 'X-RAY' : '2D'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Canvas3D />
        {/* Real sketch overlay — captures 2 taps to define rectangle */}
        <HardeningSketchOverlay />
      </View>

      {/* Bottom tools */}
      <View style={styles.toolsRow}>
        <Pressable
          onPress={() => setPanelOpen(panelOpen === 'hardware' ? null : 'hardware')}
          style={[styles.tool, panelOpen === 'hardware' && styles.toolActive]}
        >
          <Text style={styles.toolTxt}>Фурнитура · {cabinets.length}</Text>
        </Pressable>
        <Pressable
          onPress={() => setPanelOpen(panelOpen === 'hardening' ? null : 'hardening')}
          style={[styles.tool, panelOpen === 'hardening' && styles.toolActive]}
        >
          <Text style={styles.toolTxt}>Усиление · {hardeningPanels.length}</Text>
        </Pressable>
        <Pressable onPress={onAdvance} style={styles.advance}>
          <Text style={styles.advanceTxt}>К расчёту →</Text>
        </Pressable>
      </View>

      {/* Hardware panel — per cabinet: hinge brand + overlay, slide brand + length */}
      {panelOpen === 'hardware' && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>ФУРНИТУРА · по шкафам</Text>
          <ScrollView style={{ maxHeight: 280 }}>
            {cabinets.map((c) => {
              const hw = cabinetHardware[c.id];
              const hingeBrand = hw?.hingeBrand ?? 'hettich';
              const overlay    = hw?.hingeOverlay ?? 'full';
              const slideBrand = hw?.slideBrand ?? 'hettich';
              const slideLen   = hw?.slideLength ?? 500;
              const isDrawerCab = c.type === 'drawer3' || c.type === 'drawer4';
              return (
                <View key={c.id} style={styles.cabBlock}>
                  <Text style={styles.cabName}>{cabinetLabel(c.type)}</Text>

                  {/* Hinges — brand + overlay */}
                  <View style={styles.subHeader}>
                    <Text style={styles.subHeaderTxt}>ПЕТЛИ</Text>
                  </View>
                  <View style={styles.chipRow}>
                    {HINGES.map((b) => (
                      <Pressable
                        key={b}
                        onPress={() => { hapticTap(); setCabinetHardware(c.id, { hingeBrand: b }); }}
                        style={[styles.miniChip, hingeBrand === b && styles.miniChipActive]}
                      >
                        <Text style={[styles.miniChipTxt, hingeBrand === b && styles.miniChipTxtActive]}>
                          {b}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.chipRow}>
                    {OVERLAYS.map((o) => (
                      <Pressable
                        key={o}
                        onPress={() => { hapticTap(); setCabinetHardware(c.id, { hingeOverlay: o }); }}
                        style={[styles.miniChip, overlay === o && styles.miniChipActive]}
                      >
                        <Text style={[styles.miniChipTxt, overlay === o && styles.miniChipTxtActive]}>
                          {OVERLAY_LABEL[o]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Slides — only for drawer cabinets */}
                  {isDrawerCab && (
                    <>
                      <View style={styles.subHeader}>
                        <Text style={styles.subHeaderTxt}>НАПРАВЛЯЮЩИЕ</Text>
                      </View>
                      <View style={styles.chipRow}>
                        {SLIDES.map((b) => (
                          <Pressable
                            key={b}
                            onPress={() => { hapticTap(); setCabinetHardware(c.id, { slideBrand: b }); }}
                            style={[styles.miniChip, slideBrand === b && styles.miniChipActive]}
                          >
                            <Text style={[styles.miniChipTxt, slideBrand === b && styles.miniChipTxtActive]}>
                              {b}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <View style={styles.chipRow}>
                        {SLIDE_LENGTHS.map((l) => (
                          <Pressable
                            key={l}
                            onPress={() => { hapticTap(); setCabinetHardware(c.id, { slideLength: l }); }}
                            style={[styles.miniChip, slideLen === l && styles.miniChipActive]}
                          >
                            <Text style={[styles.miniChipTxt, slideLen === l && styles.miniChipTxtActive]}>
                              {l}мм
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Hardening panel */}
      {panelOpen === 'hardening' && (
        <View style={styles.panel}>
          <View style={styles.presetRow}>
            <Text style={styles.panelTitle}>ПРЕСЕТЫ МАСТЕРА</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {([1, 2, 3] as const).map((slot) => {
                const p = presets.find((pr) => pr.slot === slot);
                const armed = pendingPresetSlot === slot;
                return (
                  <Pressable
                    key={slot}
                    onPress={() => p ? onArmPreset(slot) : onSaveAsPreset(slot)}
                    onLongPress={() => onSaveAsPreset(slot)}
                    style={[
                      styles.presetChip,
                      p && styles.presetChipFilled,
                      armed && styles.presetChipArmed,
                    ]}
                  >
                    <Text style={[styles.presetTxt, p && { color: '#fff' }]}>
                      {p ? `${slot} · ${p.width}×${p.height}` : `+ ${slot}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {pendingPresetSlot && (
            <Text style={styles.presetHint}>
              Пресет {pendingPresetSlot} активен — выберите грань для эскиза
            </Text>
          )}

          <Text style={[styles.panelTitle, { marginTop: SPACE.sm }]}>УСИЛЕНИЕ · custom panels</Text>
          <ScrollView style={{ maxHeight: 220 }}>
            {cabinets.map((c) => (
              <View key={c.id} style={styles.cabRow}>
                <Text style={styles.cabName}>{cabinetLabel(c.type)}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.faceBtns}>
                    {FACES.map((f) => (
                      <Pressable
                        key={f}
                        onPress={() => onArmFace(c.id, f)}
                        style={styles.faceChip}
                      >
                        <Text style={styles.faceChipTxt}>{f}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}
            {hardeningPanels.length > 0 && (
              <>
                <Text style={[styles.panelTitle, { marginTop: SPACE.md }]}>УСТАНОВЛЕНО</Text>
                {hardeningPanels.map((p) => (
                  <View key={p.id} style={styles.installedRow}>
                    <Text style={styles.installedTxt}>
                      {p.cabinetId} · {p.face} · {p.width}×{p.height}мм · {p.material}
                    </Text>
                    <Pressable onPress={() => removePanel(p.id)} hitSlop={6}>
                      <Text style={styles.removeTxt}>удалить</Text>
                    </Pressable>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgEng },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xs,
    paddingBottom: SPACE.xs,
  },
  brand: { ...TYPE.brandLogo, color: COLORS.ink, fontSize: 13, letterSpacing: 1.5 },
  tag:   { ...TYPE.brandTag,  color: COLORS.inkFaint, marginTop: 1, letterSpacing: 1.6 },
  viewToggle: { flexDirection: 'row', gap: 4 },
  viewBtn: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
    borderRadius: RADII.engSharp,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgEngCard,
  },
  viewBtnActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  viewBtnTxt: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 11, letterSpacing: 1 },
  viewBtnTxtActive: { color: '#fff' },

  sketchRibbon: {
    position: 'absolute',
    top: 80,
    left: SPACE.lg,
    right: SPACE.lg,
    backgroundColor: COLORS.warnBg,
    borderColor: COLORS.warn,
    borderWidth: 1,
    borderRadius: RADII.engSharp,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sketchTxt: { ...TYPE.bodyMed, color: COLORS.warn },
  sketchAdd: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.engSharp,
    backgroundColor: COLORS.warn,
  },
  sketchAddTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  sketchClose: { paddingHorizontal: SPACE.xs, paddingVertical: 4 },
  sketchCloseTxt: { color: COLORS.warn, fontSize: 14 },

  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    gap: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.bgEng,
  },
  tool: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.engSharp,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgEngCard,
  },
  toolActive: { borderColor: COLORS.ink },
  toolTxt: { ...TYPE.bodyMed, color: COLORS.ink },
  advance: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.engSharp,
    backgroundColor: COLORS.ink,
    marginLeft: 'auto',
  },
  advanceTxt: { ...TYPE.bodyMed, color: '#fff' },

  panel: {
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.md,
    backgroundColor: COLORS.bgEngCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineStrong,
  },
  panelTitle: { ...TYPE.sectionLabel, color: COLORS.inkMuted, marginBottom: SPACE.xs },
  cabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.xs,
    gap: SPACE.sm,
  },
  cabName: { ...TYPE.body, color: COLORS.ink, width: 130 },
  cabBtns: { flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'flex-end' },
  cabChip: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.engSharp,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cabChipTxt: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 11 },
  cabBlock: {
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  subHeader: { marginTop: SPACE.xs },
  subHeaderTxt: {
    ...TYPE.sectionLabel,
    color: COLORS.inkMuted,
    fontSize: 9,
  },
  chipRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 },
  miniChip: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
    borderRadius: RADII.engSharp,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgCard,
  },
  miniChipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  miniChipTxt: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 10 },
  miniChipTxtActive: { color: '#fff' },

  faceBtns: { flexDirection: 'row', gap: 4 },
  faceChip: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.engSharp,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: 'transparent',
  },
  faceChipTxt: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 11 },

  installedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACE.xs,
  },
  presetChip: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.engSharp,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: 'transparent',
    minWidth: 40,
    alignItems: 'center',
  },
  presetChipFilled: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  presetChipArmed: { borderColor: COLORS.warn, borderWidth: 2 },
  presetTxt: { ...TYPE.body, fontSize: 10, color: COLORS.inkSoft },
  presetHint: { ...TYPE.hint, color: COLORS.warn, marginBottom: SPACE.xs },
  installedTxt: { ...TYPE.body, color: COLORS.ink, flex: 1, fontSize: 11 },
  removeTxt: { ...TYPE.body, color: COLORS.warn, fontSize: 11 },
});
