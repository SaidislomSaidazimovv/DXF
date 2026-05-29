/**
 * Phase F — MANUFACTURE HANDOFF (На ЧПУ).
 *
 * Pre-flight checklist (HANDOVER §6):
 *   • all_panels_dimensioned       (blocker)
 *   • all_hinges_drilled           (blocker)
 *   • sheet_utilization_ok         (warning if <70%)
 *   • all_cabinets_passed_benchmark
 *   • kromka_specified             (blocker)
 *   • customer_confirmed           (blocker — links back to Phase B confirmation)
 *
 * Export ceremony:
 *   tap "Сформировать ЧПУ" → spinner (600ms) → checkmark (300ms)
 *   → list 5 mock artifacts (DXF, MPR, CSV cut-list, PDF drilling, PDF kromka)
 *
 * Visual theme: bgPro — near-white, clean.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { PhaseStepper } from '@/components/phase/PhaseStepper';
import { COLORS, SPACE, TYPE, RADII } from '@/lib/tokens';
import { hapticTap } from '@/lib/haptics';
import type { ChecklistItem } from '@/types/ui';

interface MockArtifact {
  filename: string;
  format: string;
  size: string;
  thumb: string;   // emoji used as a visual placeholder for the PDF preview
}

/**
 * HANDOVER §F.3: "ГОТОВО · 3 ФАЙЛА СГЕНЕРИРОВАНЫ" — the 3 machine files
 * that go to the CNC. Plus "+ 5 PDF документов для оператора и сборщика".
 */
const MACHINE_FILES: MockArtifact[] = [
  { filename: 'kitchen.dxf', format: 'DXF — раскрой плит',    size: '184 КБ', thumb: '▦' },
  { filename: 'kitchen.mpr', format: 'MPR — сверловка Homag',  size: '92 КБ',  thumb: '⏛' },
  { filename: 'kitchen.cix', format: 'CIX — программа Biesse', size: '76 КБ',  thumb: '◫' },
];

const PDF_DOCS: MockArtifact[] = [
  { filename: 'cutting_plan.pdf',       format: 'Карта раскроя',         size: '420 КБ', thumb: '⠿' },
  { filename: 'drilling_spec.pdf',      format: 'Спецификация сверловки', size: '188 КБ', thumb: '⏛' },
  { filename: 'kromka_worksheet.pdf',   format: 'Лист кромления',         size: '156 КБ', thumb: '═' },
  { filename: 'assembly_guide.pdf',     format: 'Инструкция сборки',      size: '512 КБ', thumb: '☐' },
  { filename: 'pack_list.pdf',          format: 'Лист упаковки',          size: '94 КБ',  thumb: '☱' },
];

const ALL_ARTIFACTS: MockArtifact[] = [...MACHINE_FILES, ...PDF_DOCS];

export default function PhaseF() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const variant = useUI(selectCurrentVariant);
  const confirmation = useUI((s) => s.customerConfirmation);
  const cabinetHardware = useUI((s) => s.cabinetHardware);
  const kromka = useUI((s) => s.kromkaConfig);
  const markPhaseComplete = useUI((s) => s.markPhaseComplete);
  const saveProject = useUI((s) => s.saveCurrentProject);

  const checklist: ChecklistItem[] = useMemo(() => {
    const cabinets = variant?.cabinets ?? [];
    const totalWidthM = cabinets.reduce((s, c) => s + c.width, 0);
    const sheetsCeil = Math.ceil(totalWidthM / 1.6);
    const utilization = sheetsCeil > 0 ? totalWidthM / 1.6 / sheetsCeil : 1;

    return [
      {
        id: 'all_panels_dimensioned',
        label: 'Все панели обмерены',
        passed: cabinets.length > 0,
        detail: cabinets.length + ' шкафов · ' + (cabinets.length * 5) + ' панелей',
        blocker: true,
      },
      {
        id: 'all_hinges_drilled',
        label: 'Сверловка петель просчитана',
        passed: cabinets.length > 0,
        detail: 'Ø35мм cup · 5мм от края',
        blocker: true,
      },
      {
        id: 'sheet_utilization_ok',
        label: 'Утилизация листа OK (≥70%)',
        passed: utilization >= 0.7,
        detail: Math.round(utilization * 100) + '%',
        blocker: false,
      },
      {
        id: 'all_cabinets_passed_benchmark',
        label: 'Шкафы прошли проверку прочности',
        passed: true,
        detail: 'все зелёные',
        blocker: false,
      },
      {
        id: 'kromka_specified',
        label: 'Кромка указана',
        passed: kromka.visibleThickness > 0,
        detail: 'видимая ' + kromka.visibleThickness + 'мм',
        blocker: true,
      },
      {
        id: 'customer_confirmed',
        label: 'Согласовано с заказчиком',
        passed: !!confirmation,
        detail: confirmation
          ? new Date(confirmation.timestamp).toLocaleString('ru-RU')
          : 'нет подтверждения',
        blocker: true,
      },
    ];
  }, [variant, cabinetHardware, kromka, confirmation]);

  const blockersPassed = checklist.every((c) => !c.blocker || c.passed);
  const allPassed = checklist.every((c) => c.passed);

  const [stage, setStage] = useState<'idle' | 'spinning' | 'done'>('idle');

  const onExport = () => {
    if (!blockersPassed || stage !== 'idle') return;
    hapticTap();
    setStage('spinning');
    setTimeout(() => {
      setStage('done');
      markPhaseComplete('F');
      saveProject();
    }, 600);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <PhaseStepper />

      <View style={styles.headerRow}>
        <Text style={styles.brand}>MEBELCHI</Text>
        <Text style={styles.tag}>НА ЧПУ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>ПРОВЕРКА ПЕРЕД ЧПУ</Text>

        {checklist.map((c) => (
          <View
            key={c.id}
            style={[
              styles.checkRow,
              !c.passed && c.blocker && styles.checkRowFail,
              !c.passed && !c.blocker && styles.checkRowWarn,
            ]}
          >
            <Text
              style={[
                styles.checkIcon,
                c.passed ? { color: COLORS.good } : c.blocker ? { color: COLORS.warn } : { color: COLORS.inkMuted },
              ]}
            >
              {c.passed ? '✓' : c.blocker ? '✕' : '!'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkLabel}>{c.label}</Text>
              {c.detail && <Text style={styles.checkDetail}>{c.detail}</Text>}
            </View>
            {c.blocker && !c.passed && (
              <Text style={styles.blockerTag}>блокирует</Text>
            )}
          </View>
        ))}

        {/* PDF preview strip — what will be generated */}
        {stage !== 'done' && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: SPACE.lg }]}>
              ПРЕВЬЮ · {PDF_DOCS.length} PDF
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.thumbRow}>
                {PDF_DOCS.map((a) => (
                  <Pressable
                    key={a.filename}
                    onPress={() => Alert.alert(a.filename, `${a.format}\n\nПревью будет показан после экспорта.`)}
                    style={styles.thumbCard}
                  >
                    <Text style={styles.thumbIcon}>{a.thumb}</Text>
                    <Text style={styles.thumbName} numberOfLines={1}>{a.filename}</Text>
                    <Text style={styles.thumbFmt} numberOfLines={1}>{a.format}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* Export section */}
        {stage === 'done' ? (
          <View style={styles.exported}>
            <Text style={styles.doneCheck}>✓</Text>
            <Text style={styles.doneTitle}>ГОТОВО · 3 файла сгенерированы</Text>
            <Text style={styles.doneHint}>для ЧПУ-станка</Text>
            {MACHINE_FILES.map((a) => (
              <View key={a.filename} style={styles.artifactRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.artifactName}>{a.filename}</Text>
                  <Text style={styles.artifactFmt}>{a.format}</Text>
                </View>
                <Text style={styles.artifactSize}>{a.size}</Text>
              </View>
            ))}

            {/* PDF docs row */}
            <Text style={[styles.doneHint, { marginTop: SPACE.md }]}>
              + {PDF_DOCS.length} PDF документов для оператора и сборщика
            </Text>
            {PDF_DOCS.map((a) => (
              <View key={a.filename} style={styles.artifactRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.artifactName}>{a.filename}</Text>
                  <Text style={styles.artifactFmt}>{a.format}</Text>
                </View>
                <Text style={styles.artifactSize}>{a.size}</Text>
              </View>
            ))}

            {/* Provenance footer (HANDOVER §F.3) */}
            <Text style={styles.provenance}>
              Сгенерировано Mebelchi v1.0 · сборка 0526{'\n'}
              checksum: 7a3f9b21
            </Text>

            {/* Share buttons */}
            <View style={styles.shareRow}>
              <Pressable
                onPress={() => Alert.alert('Telegram', 'Файлы будут отправлены через @mebelchi_bot (mock).')}
                style={[styles.shareBtn, styles.shareTelegram]}
              >
                <Text style={styles.shareTxt}>Поделиться через Telegram</Text>
              </Pressable>
              <Pressable
                onPress={() => Alert.alert('Сохранение', 'Файлы сохранены в /Mebelchi/exports/ (mock).')}
                style={[styles.shareBtn, styles.shareFolder]}
              >
                <Text style={[styles.shareTxt, { color: COLORS.ink }]}>Сохранить в папку</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.replace('/home')}
              style={styles.homeBtn}
            >
              <Text style={styles.homeBtnTxt}>На главную</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ paddingTop: SPACE.lg }}>
            {!blockersPassed && (
              <Text style={styles.blockerNotice}>
                Устраните блокеры выше, чтобы продолжить
              </Text>
            )}
            <Pressable
              onPress={onExport}
              disabled={!blockersPassed || stage === 'spinning'}
              style={[
                styles.exportBtn,
                (!blockersPassed || stage === 'spinning') && styles.exportBtnDisabled,
              ]}
            >
              <Text style={styles.exportBtnTxt}>
                {stage === 'spinning' ? 'Формирование...' : 'Сформировать файлы для ЧПУ'}
              </Text>
            </Pressable>
            {!allPassed && blockersPassed && (
              <Text style={styles.warnNotice}>
                Есть предупреждения, но можно продолжить
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPro },
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

  sectionLabel: { ...TYPE.sectionLabel, color: COLORS.inkMuted, marginBottom: SPACE.sm },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: SPACE.xs,
  },
  checkRowFail: { borderColor: COLORS.warn, backgroundColor: COLORS.warnBg },
  checkRowWarn: { borderColor: COLORS.inkMuted },
  checkIcon: { fontSize: 18, fontWeight: '700', width: 22, textAlign: 'center' },
  checkLabel: { ...TYPE.bodyMed, color: COLORS.ink },
  checkDetail: { ...TYPE.hint, color: COLORS.inkFaint, marginTop: 2 },
  blockerTag: { ...TYPE.hint, color: COLORS.warn, fontStyle: 'normal' },

  exportBtn: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
  },
  exportBtnDisabled: { opacity: 0.4 },
  exportBtnTxt: { ...TYPE.bodyMed, color: '#fff', letterSpacing: 0.5 },

  blockerNotice: { ...TYPE.body, color: COLORS.warn, textAlign: 'center', marginBottom: SPACE.sm },
  warnNotice:    { ...TYPE.hint, color: COLORS.inkMuted, textAlign: 'center', marginTop: SPACE.sm },

  exported: {
    marginTop: SPACE.lg,
    padding: SPACE.lg,
    borderRadius: RADII.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.good,
    alignItems: 'stretch',
  },
  doneCheck: { fontSize: 48, color: COLORS.good, textAlign: 'center' },
  doneTitle: { ...TYPE.bodyMed, color: COLORS.ink, fontSize: 18, textAlign: 'center', marginTop: 4 },
  doneHint: { ...TYPE.hint, color: COLORS.inkMuted, textAlign: 'center', marginBottom: SPACE.md },
  artifactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  artifactName: { ...TYPE.bodyMed, color: COLORS.ink },
  artifactFmt: { ...TYPE.hint, color: COLORS.inkFaint, marginTop: 1 },
  artifactSize: { ...TYPE.body, color: COLORS.inkMuted, fontSize: 11 },

  homeBtn: {
    marginTop: SPACE.lg,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.ink,
    alignSelf: 'center',
  },
  homeBtnTxt: { ...TYPE.bodyMed, color: COLORS.ink },

  thumbRow: { flexDirection: 'row', gap: SPACE.xs, paddingVertical: SPACE.xs },
  thumbCard: {
    width: 110,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
  },
  thumbIcon: { fontSize: 28, color: COLORS.inkSoft, marginBottom: 6 },
  thumbName: {
    ...TYPE.body,
    fontSize: 10,
    color: COLORS.ink,
    textAlign: 'center',
  },
  thumbFmt: {
    ...TYPE.hint,
    color: COLORS.inkFaint,
    textAlign: 'center',
    fontSize: 9,
  },

  provenance: {
    ...TYPE.hint,
    color: COLORS.inkFaint,
    textAlign: 'center',
    marginTop: SPACE.md,
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 14,
  },
  shareRow: {
    marginTop: SPACE.lg,
    gap: SPACE.xs,
  },
  shareBtn: {
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADII.pill,
    alignItems: 'center',
  },
  shareTelegram: { backgroundColor: '#229ED9' },
  shareFolder: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
  },
  shareTxt: { ...TYPE.bodyMed, color: '#fff', letterSpacing: 0.3 },
});
