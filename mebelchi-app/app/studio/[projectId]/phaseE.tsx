/**
 * Phase E — COST & OPTIMIZATION (Расчёт).
 *
 * Computed line-item breakdown:
 *   • LDSP sheets used (utilization %)
 *   • Kromka linear meters by thickness
 *   • Hardware count (hinges, slides)
 *   • Hardening panels surcharge
 *
 * Smart Advisor: surfaces 0..3 rule-driven tips that the master can
 * one-tap apply (e.g. two-tone split, skip back kromka). Each tip shows
 * estimated savings.
 *
 * Exit: tap "Передать на ЧПУ" → mark E complete + go to phaseF.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { PhaseStepper } from '@/components/phase/PhaseStepper';
import { COLORS, SPACE, TYPE, RADII } from '@/lib/tokens';
import { hapticTap } from '@/lib/haptics';
import { materialById } from '@/mocks/materials';
import type { AdvisorRuleId, KromkaThickness } from '@/types/ui';
import { kromkaCostPerMeter } from '@/types/ui';

const KROMKA_VISIBLE_OPTIONS: KromkaThickness[] = [0.4, 0.8, 1.0, 1.3, 2.0];

function fmt(sum: number): string {
  return sum.toLocaleString('ru-RU') + ' сум';
}

export default function PhaseE() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const variant = useUI(selectCurrentVariant);
  const globalMaterial = useUI((s) => s.globalMaterial);
  const cabinetMaterial = useUI((s) => s.cabinetMaterial);
  const cabinetHardware = useUI((s) => s.cabinetHardware);
  const hardeningPanels = useUI((s) => s.hardeningPanels);
  const kromka = useUI((s) => s.kromkaConfig);
  const applied = useUI((s) => s.appliedAdvisorTips);
  const dismissed = useUI((s) => s.dismissedAdvisorTips);

  const setKromkaConfig = useUI((s) => s.setKromkaConfig);
  const applyAdvisorTip = useUI((s) => s.applyAdvisorTip);
  const dismissAdvisorTip = useUI((s) => s.dismissAdvisorTip);
  const markPhaseComplete = useUI((s) => s.markPhaseComplete);
  const setPhase = useUI((s) => s.setPhase);
  const saveProject = useUI((s) => s.saveCurrentProject);

  const breakdown = useMemo(() => {
    const cabinets = variant?.cabinets ?? [];

    /* Sheets: very rough — 1 sheet per 1.6m of cabinet width */
    const totalWidthM = cabinets.reduce((s, c) => s + c.width, 0);
    const sheetsUsed = +(totalWidthM / 1.6).toFixed(1);
    const mat = materialById(globalMaterial);
    const sheetsCost = Math.ceil(sheetsUsed) * mat.costPerSheet;

    /* Kromka: rough — perimeter ≈ 4 × (W + H) per cabinet (visible only) */
    const kromkaMeters = cabinets.reduce(
      (s, c) => s + 2 * (c.width + 0.82),
      0
    );
    const kromkaCost = Math.round(
      kromkaMeters * kromkaCostPerMeter(kromka.visibleThickness)
    );

    /* Hardware: 1 pair hinges per door, 1 slide per drawer */
    const hingePairs = cabinets.filter(
      (c) => c.type === 'base' || c.type === 'sink' || c.type === 'stove' || c.type === 'sink_stove' || c.type === 'tall' || c.type === 'fridge'
    ).length;
    const slidePairs = cabinets.reduce(
      (s, c) => s + (c.type === 'drawer3' ? 3 : c.type === 'drawer4' ? 4 : 0),
      0
    );
    const hingeCost = hingePairs * 2 * 18_000;
    const slideCost = slidePairs * 95_000;

    /* Hardening surcharge: 25k per panel */
    const hardeningCost = hardeningPanels.length * 25_000;

    /* Worktop — postformed 38mm chipboard. 1 lin.m. ≈ 320k soum. */
    const worktopMeters = +totalWidthM.toFixed(2);
    const worktopCost   = Math.round(worktopMeters * 320_000);

    /* Sink — single 850k / double 1_150k. 0 if no sink-bearing cabinet. */
    const hasSinkInVariant = cabinets.some(
      (c) => c.type === 'sink' || c.type === 'sink_stove'
    );
    const sinkCost = !hasSinkInVariant
      ? 0
      : (useUI.getState().sinkType === 'double' ? 1_150_000 : 850_000);

    /* Stove — induction 1.8M / gas 1.4M / none 0. */
    const hasStoveInVariant = cabinets.some(
      (c) => c.type === 'stove' || c.type === 'sink_stove'
    );
    const stoveTypeNow = useUI.getState().stoveType;
    const stoveCost = !hasStoveInVariant
      ? 0
      : stoveTypeNow === 'gas'
        ? 1_400_000
        : stoveTypeNow === 'induction'
          ? 1_800_000
          : 0;

    /* Aux materials — back panel + shelves + drawer bottoms. */
    const auxCost = Math.round(totalWidthM * 180_000);

    /* Shop labour — calibrated so kitchen totals match HANDOVER ballpark. */
    const labourCost = Math.round(
      (sheetsCost + kromkaCost + hingeCost + slideCost + hardeningCost) * 0.34
    );

    const total =
      sheetsCost + kromkaCost + hingeCost + slideCost + hardeningCost +
      worktopCost + sinkCost + stoveCost + auxCost + labourCost;

    return {
      sheetsUsed,
      sheetUtilization: Math.min(1, sheetsUsed / Math.ceil(sheetsUsed || 1)),
      sheetsCost,
      kromkaMeters: +kromkaMeters.toFixed(1),
      kromkaCost,
      hingePairs,
      hingeCost,
      slidePairs,
      slideCost,
      hardeningCount: hardeningPanels.length,
      hardeningCost,
      worktopMeters,
      worktopCost,
      hasSinkInVariant,
      sinkCost,
      hasStoveInVariant,
      stoveCost,
      stoveTypeNow,
      auxCost,
      labourCost,
      total,
    };
  }, [variant, globalMaterial, cabinetMaterial, cabinetHardware, hardeningPanels, kromka]);

  /* Advisor tips — surface ones not yet applied or dismissed */
  const tips = useMemo(() => {
    const possible: { id: AdvisorRuleId; title: string; desc: string; savings: number }[] = [];

    if (!applied.includes('two_tone_split') && !dismissed.includes('two_tone_split')) {
      possible.push({
        id: 'two_tone_split',
        title: 'Двухцветная разбивка',
        desc: 'Использовать стандарт-белый для корпусов, матовый — для фасадов.',
        savings: Math.round(breakdown.sheetsCost * 0.12),
      });
    }
    if (!applied.includes('skip_back_kromka') && !dismissed.includes('skip_back_kromka')) {
      possible.push({
        id: 'skip_back_kromka',
        title: 'Без кромки на задней стенке',
        desc: 'Задняя стенка не видна — кромку можно пропустить.',
        savings: Math.round(breakdown.kromkaCost * 0.18),
      });
    }
    if (!applied.includes('thickness_downgrade') && !dismissed.includes('thickness_downgrade')) {
      possible.push({
        id: 'thickness_downgrade',
        title: 'ЛДСП 16мм вместо 18мм',
        desc: 'Без потери прочности для ваших шкафов.',
        savings: Math.round(breakdown.sheetsCost * 0.08),
      });
    }
    return possible;
  }, [applied, dismissed, breakdown]);

  const onAdvance = () => {
    hapticTap();
    markPhaseComplete('E');
    setPhase('F');
    saveProject();
    router.replace(`/studio/${projectId}/phaseF`);
  };

  /* Advisor slide-in — HANDOVER §7 says "card slides in from below after
     1.5s on Phase E load". Single Animated.Value drives translateY+opacity. */
  const advisorAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (tips.length === 0) return;
    advisorAnim.setValue(0);
    Animated.timing(advisorAnim, {
      toValue: 1,
      duration: 240,
      delay: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tips.length, advisorAnim]);
  const advisorStyle = {
    opacity: advisorAnim,
    transform: [
      {
        translateY: advisorAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [28, 0],
        }),
      },
    ],
  };

  const cycleVisibleKromka = () => {
    hapticTap();
    const i = KROMKA_VISIBLE_OPTIONS.indexOf(kromka.visibleThickness);
    const next = KROMKA_VISIBLE_OPTIONS[(i + 1) % KROMKA_VISIBLE_OPTIONS.length];
    setKromkaConfig({ visibleThickness: next });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <PhaseStepper />

      <View style={styles.headerRow}>
        <Text style={styles.brand}>MEBELCHI</Text>
        <Text style={styles.tag}>РАСЧЁТ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Total banner */}
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>ИТОГО</Text>
          <Text style={styles.totalValue}>{fmt(breakdown.total)}</Text>
          <Text style={styles.totalHint}>
            {breakdown.sheetsUsed} листов · {breakdown.kromkaMeters} м кромки
          </Text>
        </View>

        {/* Smart advisor — surface BEFORE breakdown so it's noticed.
            Slides up + fades in 1.5s after Phase E loads (HANDOVER §7). */}
        {tips.length > 0 && (
          <Animated.View style={advisorStyle}>
            <Text style={styles.sectionLabel}>УМНЫЙ СОВЕТНИК</Text>
            {tips.map((tip) => (
              <View key={tip.id} style={styles.tipCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDesc}>{tip.desc}</Text>
                  <Text style={styles.tipSavings}>экономия ≈ {fmt(tip.savings)}</Text>
                </View>
                <View style={{ gap: 6 }}>
                  <Pressable
                    onPress={() => { hapticTap(); applyAdvisorTip(tip.id); }}
                    style={styles.tipApply}
                  >
                    <Text style={styles.tipApplyTxt}>Применить</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { hapticTap(); dismissAdvisorTip(tip.id); }}
                    hitSlop={6}
                  >
                    <Text style={styles.tipDismiss}>скрыть</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Kromka control */}
        <Text style={styles.sectionLabel}>КРОМКА</Text>
        <Pressable onPress={cycleVisibleKromka} style={styles.kromkaPill}>
          <Text style={styles.kromkaTxt}>
            Видимая: {kromka.visibleThickness} мм
          </Text>
        </Pressable>
        <View style={{ height: 6 }} />
        <Pressable
          onPress={() => {
            hapticTap();
            setKromkaConfig({ skipBackEdges: !kromka.skipBackEdges });
          }}
          style={[
            styles.toggleRow,
            kromka.skipBackEdges && styles.toggleRowActive,
          ]}
        >
          <Text style={styles.toggleTxt}>
            {kromka.skipBackEdges ? '☑' : '☐'} пропуск задней кромки
          </Text>
        </Pressable>

        {/* Breakdown */}
        <Text style={styles.sectionLabel}>ДЕТАЛИЗАЦИЯ</Text>
        <LineRow
          label="ЛДСП листы"
          detail={`${breakdown.sheetsUsed} л · ${materialById(globalMaterial).name}`}
          sum={breakdown.sheetsCost}
          subItems={[
            { label: 'Корпуса', sum: Math.round(breakdown.sheetsCost * 0.6) },
            { label: 'Фасады',  sum: Math.round(breakdown.sheetsCost * 0.4) },
          ]}
        />
        <LineRow
          label="Кромка"
          detail={`${breakdown.kromkaMeters} м · ${kromka.visibleThickness}мм`}
          sum={breakdown.kromkaCost}
          subItems={[
            { label: 'Видимые рёбра', sum: Math.round(breakdown.kromkaCost * 0.7) },
            { label: 'Скрытые рёбра', sum: Math.round(breakdown.kromkaCost * 0.3) },
          ]}
        />
        <LineRow
          label="Петли"
          detail={`${breakdown.hingePairs} пар · ${cabinetHardware[variant?.cabinets[0]?.id ?? ''] ?.hingeBrand ?? 'hettich'}`}
          sum={breakdown.hingeCost}
          subItems={[
            { label: 'Петля (1 шт.)', sum: 18_000 },
            { label: 'Сверловка', sum: Math.round(breakdown.hingeCost * 0.08) },
          ]}
        />
        <LineRow
          label="Направляющие"
          detail={`${breakdown.slidePairs} пар`}
          sum={breakdown.slideCost}
          subItems={[
            { label: 'Направляющая (1 пара)', sum: 95_000 },
          ]}
        />
        {breakdown.hardeningCount > 0 && (
          <LineRow
            label="Усиление"
            detail={`${breakdown.hardeningCount} панелей`}
            sum={breakdown.hardeningCost}
            subItems={hardeningPanels.map((p) => ({
              label: `${p.label ?? 'Усилитель'} · ${p.width}×${p.height} (${p.material})`,
              sum: 25_000,
            }))}
          />
        )}
        <LineRow
          label="Столешница"
          detail={`${breakdown.worktopMeters} м · постформинг 38мм`}
          sum={breakdown.worktopCost}
          subItems={[
            { label: 'Постформинг 38мм (1 м)', sum: 280_000 },
            { label: 'Торцевая планка',         sum: 40_000 },
          ]}
        />
        {breakdown.hasSinkInVariant && (
          <LineRow
            label="Мойка + смеситель"
            detail={
              useUI.getState().sinkType === 'double'
                ? 'двойная нержавейка'
                : 'одинарная нержавейка'
            }
            sum={breakdown.sinkCost}
            subItems={[
              { label: 'Мойка из нержавейки', sum: Math.round(breakdown.sinkCost * 0.65) },
              { label: 'Смеситель',           sum: Math.round(breakdown.sinkCost * 0.35) },
            ]}
          />
        )}
        {breakdown.hasStoveInVariant && (
          <LineRow
            label={breakdown.stoveTypeNow === 'gas' ? 'Плита газовая' : 'Плита индукционная'}
            detail={breakdown.stoveTypeNow === 'gas' ? '4 конфорки · газ' : '4 зоны · сенсорная'}
            sum={breakdown.stoveCost}
          />
        )}
        <LineRow
          label="Доп. материалы"
          detail="задняя стенка · полки · дно ящиков"
          sum={breakdown.auxCost}
          subItems={[
            { label: 'Задняя стенка HDF 3мм', sum: Math.round(breakdown.auxCost * 0.35) },
            { label: 'Полки ЛДСП',            sum: Math.round(breakdown.auxCost * 0.45) },
            { label: 'Дно ящиков',            sum: Math.round(breakdown.auxCost * 0.20) },
          ]}
        />
        <LineRow
          label="Работа цеха"
          detail="распил · кромление · сборка"
          sum={breakdown.labourCost}
          subItems={[
            { label: 'Распил листа',  sum: Math.round(breakdown.labourCost * 0.30) },
            { label: 'Кромление',     sum: Math.round(breakdown.labourCost * 0.20) },
            { label: 'Сверловка',     sum: Math.round(breakdown.labourCost * 0.15) },
            { label: 'Сборка корпусов', sum: Math.round(breakdown.labourCost * 0.35) },
          ]}
        />

        <View style={styles.utilCard}>
          <Text style={styles.utilLabel}>УТИЛИЗАЦИЯ ЛИСТА</Text>
          <View style={styles.utilBar}>
            <View
              style={[
                styles.utilFill,
                { width: `${Math.round(breakdown.sheetUtilization * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.utilTxt}>
            {Math.round(breakdown.sheetUtilization * 100)}% использовано
          </Text>
        </View>
      </ScrollView>

      <View style={styles.ctaRow}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backTxt}>← назад</Text>
        </Pressable>
        <Pressable onPress={onAdvance} style={styles.doneBtn}>
          <Text style={styles.doneTxt}>К чертежам →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function LineRow({
  label,
  detail,
  sum,
  subItems,
}: {
  label: string;
  detail: string;
  sum: number;
  subItems?: { label: string; sum: number }[];
}) {
  const [open, setOpen] = useState(false);
  const expandable = !!subItems && subItems.length > 0;
  return (
    <View>
      <Pressable
        disabled={!expandable}
        onPress={() => { if (expandable) { hapticTap(); setOpen((v) => !v); } }}
        style={styles.lineRow}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.lineLabel}>
            {expandable ? (open ? '▾ ' : '▸ ') : ''}{label}
          </Text>
          <Text style={styles.lineDetail}>{detail}</Text>
        </View>
        <Text style={styles.lineSum}>{fmt(sum)}</Text>
      </Pressable>
      {open && subItems?.map((sub, i) => (
        <View key={i} style={styles.subRow}>
          <Text style={styles.subLabel}>{sub.label}</Text>
          <Text style={styles.subSum}>{fmt(sub.sum)}</Text>
        </View>
      ))}
    </View>
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
  scroll: { padding: SPACE.lg, paddingBottom: SPACE.xl },

  totalBanner: {
    padding: SPACE.lg,
    borderRadius: RADII.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    alignItems: 'center',
  },
  totalLabel: { ...TYPE.sectionLabel, color: COLORS.inkMuted },
  totalValue: { ...TYPE.heroPrice, color: COLORS.ink, marginTop: 4 },
  totalHint: { ...TYPE.hint, color: COLORS.inkFaint, marginTop: 4 },

  sectionLabel: {
    ...TYPE.sectionLabel,
    color: COLORS.inkMuted,
    marginTop: SPACE.lg,
    marginBottom: SPACE.xs,
  },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.goodBg,
    borderWidth: 1,
    borderColor: COLORS.good,
    marginBottom: SPACE.xs,
  },
  tipTitle: { ...TYPE.bodyMed, color: COLORS.ink },
  tipDesc: { ...TYPE.body, color: COLORS.inkSoft, marginTop: 2 },
  tipSavings: { ...TYPE.bodyMed, color: COLORS.good, marginTop: 4, fontSize: 12 },
  tipApply: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.good,
  },
  tipApplyTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  tipDismiss: { ...TYPE.hint, color: COLORS.inkMuted, textAlign: 'center' },

  kromkaPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.bgCard,
  },
  kromkaTxt: { ...TYPE.bodyMed, color: COLORS.ink },
  toggleRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  toggleRowActive: { borderColor: COLORS.good, backgroundColor: COLORS.goodBg },
  toggleTxt: { ...TYPE.body, color: COLORS.inkSoft },

  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  lineLabel: { ...TYPE.bodyMed, color: COLORS.ink },
  lineDetail: { ...TYPE.hint, color: COLORS.inkFaint },
  lineSum: { ...TYPE.price, color: COLORS.ink, fontSize: 14 },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: SPACE.lg,
    paddingVertical: 4,
    backgroundColor: COLORS.bgSoft,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  subLabel: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 11 },
  subSum: { ...TYPE.price, color: COLORS.inkSoft, fontSize: 12 },

  utilCard: {
    marginTop: SPACE.lg,
    padding: SPACE.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  utilLabel: { ...TYPE.sectionLabel, color: COLORS.inkMuted },
  utilBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.line,
    marginVertical: SPACE.xs,
    overflow: 'hidden',
  },
  utilFill: { height: '100%', backgroundColor: COLORS.good },
  utilTxt: { ...TYPE.body, color: COLORS.inkSoft },

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
  doneTxt: { ...TYPE.bodyMed, color: '#fff', letterSpacing: 0.3 },
});
