/**
 * Phase C — CONFIGURATION (Настройка).
 *
 * Same canvas as Phase B, but the customer-confirmation flow is replaced
 * with a "К инженерии →" CTA. This is where the mebelchi explores
 * materials, doors, handles, sink/stove placement — i.e. the SelectionPill
 * is the primary tool. The customer is no longer in the room.
 *
 * Exit: tap "К инженерии" → mark C complete + setPhase('D') + go to phaseD.
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router, useLocalSearchParams } from 'expo-router';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import type { AuxMaterials } from '@/types/ui';
import { cabinetLabel } from '@/types/ui';
import { PriceBlock } from '@/components/studio/PriceBlock';
import { ViewToggle } from '@/components/studio/ViewToggle';
import { VariantDots } from '@/components/studio/VariantDots';
import { AdjacencyWarning } from '@/components/studio/AdjacencyWarning';
import { StudioBottomBar } from '@/components/studio/StudioBottomBar';
import { Canvas3D } from '@/components/studio/scene/Canvas3D';
import { SelectionPill } from '@/components/studio/SelectionPill';
import { StyleBar } from '@/components/studio/StyleBar';
import { PhaseStepper } from '@/components/phase/PhaseStepper';
import { COLORS, SPACE, TYPE, RADII } from '@/lib/tokens';
import { mockPrice } from '@/lib/pricing';
import { useT } from '@/lib/i18n';
import { hapticTap } from '@/lib/haptics';

export default function PhaseC() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  const wallMm = useUI((s) => s.wallLengthMm);
  const variantIdx = useUI((s) => s.variantIdx);
  const variants = useUI((s) => s.variants);
  const variant = useUI(selectCurrentVariant);
  const viewMode = useUI((s) => s.viewMode);
  const globalMat = useUI((s) => s.globalMaterial);

  const auxMaterials = useUI((s) => s.auxMaterials);

  const cycleVariant = useUI((s) => s.cycleVariant);
  const setViewMode = useUI((s) => s.setViewMode);
  const saveCurrentProject = useUI((s) => s.saveCurrentProject);
  const markPhaseComplete = useUI((s) => s.markPhaseComplete);
  const setPhase = useUI((s) => s.setPhase);
  const setCabinetDrawerCount = useUI((s) => s.setCabinetDrawerCount);
  const setAuxMaterial = useUI((s) => s.setAuxMaterial);

  const [extraOpen, setExtraOpen] = useState(false);

  const swipePan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-50, 50])
        .runOnJS(true)
        .onEnd((e) => {
          const sel = useUI.getState().selectedCabinetId;
          if (sel !== null) return;
          if (e.translationX < -50) { hapticTap(); cycleVariant(1); }
          else if (e.translationX > 50) { hapticTap(); cycleVariant(-1); }
        }),
    [cycleVariant]
  );

  const t = useT();

  const price = useMemo(
    () => mockPrice(wallMm, variantIdx, globalMat),
    [wallMm, variantIdx, globalMat]
  );

  const hasAdjacencyWarning = useMemo(() => {
    if (!variant) return false;
    for (let i = 0; i < variant.cabinets.length - 1; i++) {
      const a = variant.cabinets[i].type;
      const b = variant.cabinets[i + 1].type;
      if ((a === 'sink' && b === 'stove') || (a === 'stove' && b === 'sink')) return true;
    }
    return false;
  }, [variant]);

  const onAdvance = () => {
    hapticTap();
    markPhaseComplete('C');
    setPhase('D');
    saveCurrentProject();
    router.replace(`/studio/${projectId}/phaseD`);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <PhaseStepper />

      <View style={styles.topRow}>
        <View>
          <Text style={styles.brand}>MEBELCHI</Text>
          <Text style={styles.tag}>{t('brand_tag_studio')} · НАСТРОЙКА</Text>
        </View>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </View>

      {/* Wall length is set in Phase A — no mm shown here, only price */}
      <View style={styles.chromeRowEnd}>
        <PriceBlock sum={price} />
      </View>

      <View style={styles.dotsRow}>
        <VariantDots count={variants.length} activeIdx={variantIdx} />
      </View>

      <View style={styles.warnRow}>
        <AdjacencyWarning visible={hasAdjacencyWarning} />
      </View>

      <StyleBar />

      <GestureDetector gesture={swipePan}>
        <View collapsable={false} style={{ flex: 1 }}>
          <Canvas3D />
        </View>
      </GestureDetector>

      <SelectionPill />

      <View style={styles.advanceRow}>
        <Pressable
          onPress={() => { hapticTap(); setExtraOpen((v) => !v); }}
          style={styles.extraBtn}
        >
          <Text style={styles.extraBtnTxt}>{extraOpen ? '▾' : '▸'} Доп. настройки</Text>
        </Pressable>
      </View>

      {extraOpen && (
        <View style={styles.extraPanel}>
          <Text style={styles.sectionLabel}>ЯЩИКИ · количество</Text>
          <ScrollView style={{ maxHeight: 120 }}>
            {(variant?.cabinets ?? [])
              .filter((c) => c.type === 'drawer3' || c.type === 'drawer4')
              .map((c) => (
                <View key={c.id} style={styles.rowItem}>
                  <Text style={styles.rowLabel}>{cabinetLabel(c.type)}</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {([2, 3, 4] as const).map((n) => {
                      const active = (c.type === 'drawer4' ? 4 : 3) === n;
                      return (
                        <Pressable
                          key={n}
                          onPress={() => { hapticTap(); setCabinetDrawerCount(c.id, n); }}
                          style={[styles.numChip, active && styles.numChipActive]}
                        >
                          <Text style={[styles.numChipTxt, active && styles.numChipTxtActive]}>
                            {n}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
          </ScrollView>

          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>ДОП. МАТЕРИАЛЫ</Text>
          <AuxRow
            label="Задняя стенка"
            value={auxMaterials.backPanel}
            options={['hdf_3mm', 'mdf_3mm', 'ldsp_16mm'] as const}
            onSelect={(v) => setAuxMaterial('backPanel', v as AuxMaterials['backPanel'])}
          />
          <AuxRow
            label="Полки"
            value={auxMaterials.shelf}
            options={['ldsp_16mm', 'ldsp_18mm', 'glass_4mm'] as const}
            onSelect={(v) => setAuxMaterial('shelf', v as AuxMaterials['shelf'])}
          />
          <AuxRow
            label="Дно ящика"
            value={auxMaterials.drawerBottom}
            options={['hdf_3mm', 'mdf_3mm'] as const}
            onSelect={(v) => setAuxMaterial('drawerBottom', v as AuxMaterials['drawerBottom'])}
          />
        </View>
      )}

      <StudioBottomBar
        variantIdx={variantIdx}
        variantCount={variants.length}
        onCycleVariant={() => { hapticTap(); cycleVariant(1); }}
        ctaLabel="К инженерии →"
        onCta={onAdvance}
      />
    </SafeAreaView>
  );
}

function AuxRow({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const active = o === value;
          return (
            <Pressable
              key={o}
              onPress={() => { hapticTap(); onSelect(o); }}
              style={[styles.numChip, active && styles.numChipActive]}
            >
              <Text style={[styles.numChipTxt, active && styles.numChipTxtActive]}>
                {o.replace('_', ' ')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xs,
    paddingBottom: SPACE.xs,
  },
  brand: { ...TYPE.brandLogo, color: COLORS.ink, fontSize: 13, letterSpacing: 1.5 },
  tag:   { ...TYPE.brandTag,  color: COLORS.inkFaint, marginTop: 1 },
  chromeRowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xs,
  },
  dotsRow: { paddingTop: SPACE.sm, paddingBottom: SPACE.xs },
  warnRow: { minHeight: 22, justifyContent: 'center' },
  advanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.xs,
  },
  extraBtn: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgCard,
  },
  extraBtnTxt: { ...TYPE.body, color: COLORS.inkSoft },
  extraPanel: {
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xs,
    paddingBottom: SPACE.sm,
    backgroundColor: COLORS.bgSoft,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  sectionLabel: { ...TYPE.sectionLabel, color: COLORS.inkMuted, marginBottom: 4 },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: { ...TYPE.body, color: COLORS.ink, flex: 1 },
  numChip: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgCard,
  },
  numChipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  numChipTxt: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 11 },
  numChipTxtActive: { color: '#fff' },
});
