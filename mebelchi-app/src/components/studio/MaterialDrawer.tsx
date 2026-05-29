/**
 * Material drawer — HANDOVER §3.6.
 *
 * Bottom sheet at 45% snap point with 6 palette cards in 3-column grid.
 * Tapping a card → updates global material, brief toast, auto-closes after 240ms.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useUI } from '@/store/uiStore';
import { PALETTE_MATERIALS, materialById } from '@/mocks/materials';
import { PaletteCard } from '@/components/shared/PaletteCard';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';
import { useT } from '@/lib/i18n';
import { hapticSwatch } from '@/lib/haptics';
import type { MaterialId } from '@/types/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MaterialDrawer({ isOpen, onClose }: Props) {
  /* The active material highlighted in the grid reflects the current focus:
     selected upper → its material; selected cabinet → its material; else global. */
  const globalMaterial = useUI((s) => s.globalMaterial);
  const selectedCabinetId = useUI((s) => s.selectedCabinetId);
  const selectedUpperId = useUI((s) => s.selectedUpperId);
  const cabinetMaterial = useUI((s) => s.cabinetMaterial);
  const upperMaterial = useUI((s) => s.upperMaterial);
  const setMaterialForSelection = useUI((s) => s.setMaterialForSelection);
  const activeMaterial = selectedUpperId
    ? (upperMaterial[selectedUpperId] ?? globalMaterial)
    : selectedCabinetId
      ? (cabinetMaterial[selectedCabinetId] ?? globalMaterial)
      : globalMaterial;
  const t = useT();
  const sheetRef = useRef<BottomSheet>(null);
  const [toastMat, setToastMat] = useState<MaterialId | null>(null);

  const snapPoints = useMemo(() => ['45%'], []);
  /* Measure the actual grid container width (NOT the window — on web the
     app sits inside a 390px phone frame, so useWindowDimensions would
     report the full browser width and blow the card size up). */
  const [gridW, setGridW] = useState(0);
  const cardW = gridW > 0 ? (gridW - SPACE.sm * 2) / 3 : 100;

  useEffect(() => {
    if (isOpen) sheetRef.current?.snapToIndex(0);
    else sheetRef.current?.close();
  }, [isOpen]);

  const onSheetChange = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

  const pick = useCallback(
    (id: MaterialId) => {
      hapticSwatch();
      setMaterialForSelection(id);
      setToastMat(id);
      setTimeout(() => {
        sheetRef.current?.close();
        setToastMat(null);
      }, 280);
    },
    [setMaterialForSelection]
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={onSheetChange}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>
          {selectedUpperId
            ? 'ЦВЕТ ВЕРХНЕГО ШКАФА'
            : selectedCabinetId
              ? 'ЦВЕТ ЭТОГО ШКАФА'
              : t('palette_title')}
        </Text>

        <View
          style={styles.grid}
          onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
        >
          {gridW > 0 && PALETTE_MATERIALS.map((m) => (
            <PaletteCard
              key={m.id}
              material={m}
              active={activeMaterial === m.id}
              onPress={() => pick(m.id)}
              width={cardW}
            />
          ))}
        </View>

        {toastMat && (
          <View style={styles.toast}>
            <Text style={styles.toastTxt}>{t('palette_toast')} {materialById(toastMat).name}</Text>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { backgroundColor: COLORS.line, width: 44 },
  content: {
    flex: 1,
    padding: SPACE.xl,
    paddingTop: SPACE.md,
  },
  title: {
    ...TYPE.sectionLabel,
    color: COLORS.inkMuted,
    marginBottom: SPACE.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  toast: {
    position: 'absolute',
    bottom: SPACE.xl,
    left: SPACE.xl, right: SPACE.xl,
    backgroundColor: COLORS.ink,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm + 2,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  toastTxt: { ...TYPE.toast, color: '#fff' },
});
