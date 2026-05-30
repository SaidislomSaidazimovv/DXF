/**
 * UI store — V2.
 *
 * Implements (pragmatically) the V2 contract from `UI_TYPES_V2.ts`. We keep
 * a FLAT shape for the live editor state so React components can subscribe
 * to thin slices via `useUI(s => s.fieldX)`. The `Project` interface in
 * UI_TYPES_V2 is the SERIALIZATION shape — assembled when we save and
 * disassembled when we load.
 *
 * Phase boundaries (per HANDOVER_UI_V2 §2): each phase has an exit
 * criterion. Forward navigation requires it; back nav warns.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AdvisorRuleId,
  AuxMaterials,
  CabinetType,
  CeilingHeight,
  Constraint,
  CustomerConfirmation,
  BurnerCount,
  DoorStyle,
  DrawerKind,
  UpperKind,
  FaucetFinish,
  FaucetStyle,
  HandleType,
  HardeningPanel,
  HardeningPanelPreset,
  HardwareSelection,
  HingeBrand,
  KromkaConfig,
  Language,
  MaterialId,
  Phase,
  PhaseCompletion,
  ProjectSummary,
  SetupConfig,
  SinkType,
  StoveType,
  Thickness,
  Variant,
  ViewMode,
} from '@/types/ui';
import { INTERACTION, WALL_SIZES_MM } from '@/types/ui';
import { generateVariants } from '@/mocks/variants';
import { SAMPLE_PROJECTS, generateProjectId } from '@/mocks/projects';
import { mockPrice } from '@/lib/pricing';

// ── Defaults ──────────────────────────────────────────────────
const DEFAULT_WALL = 1500;
const DEFAULT_CEILING: CeilingHeight = 2600;

const DEFAULT_KROMKA: KromkaConfig = {
  visibleThickness: 2.0,
  hiddenThickness: 0.4,
  colorStrategy: 'facade_match',
  skipBackEdges: false,
};

const DEFAULT_AUX: AuxMaterials = {
  backPanel: 'hdf_3mm',
  shelf: 'ldsp_16mm',
  drawerBottom: 'hdf_3mm',
  internalDivider: 'ldsp_16mm',
};

const DEFAULT_HARDWARE: HardwareSelection = {
  hingeBrand: 'hettich',
  hingeOverlay: 'full',
  slideBrand: 'hettich',
  slideLength: 500,
};

// ── Store interface (concrete, pragmatic) ─────────────────────
export interface UIState {
  // Shop-level
  hasCompletedSetup: boolean;
  shopName: string;
  defaultSupplier: 'imkon' | 'egger_uz' | 'kronospan_uz';
  defaultThickness: Thickness;
  defaultHardware: HingeBrand;
  language: Language;

  // Project pointer + phase
  currentProjectId: string | null;
  currentPhase: Phase;
  recentProjects: ProjectSummary[];
  phaseCompletion: PhaseCompletion;

  // Phase A — geometry + constraints
  wallLengthMm: number;
  wallHeightMm: CeilingHeight;
  constraints: Constraint[];

  // Phase B — variants + customer confirmation
  variantIdx: number;
  variants: Variant[];
  customerConfirmation?: CustomerConfirmation;

  // Phase C — configuration
  globalMaterial: MaterialId;
  globalDoorStyle: DoorStyle;
  sinkType: SinkType;            // default for cabinets without an override
  stoveType: StoveType;          // default for cabinets without an override
  worktopOverride: number | null;
  cabinetMaterial: Record<string, MaterialId>;
  cabinetDoorStyle: Record<string, DoorStyle>;
  cabinetHandle: Record<string, HandleType>;
  /** Per-cabinet fixture overrides — each sink/stove cabinet is independent. */
  cabinetSink: Record<string, SinkType>;
  cabinetStove: Record<string, StoveType>;
  cabinetFaucet: Record<string, FaucetStyle>;
  cabinetFaucetFinish: Record<string, FaucetFinish>;
  cabinetBurners: Record<string, BurnerCount>;
  /** Per-drawer presentation, keyed `${cabId}#${drawerIndex}`. */
  drawerTypes: Record<string, DrawerKind>;
  /** Per-upper overrides (keyed by the base cabinet id beneath the upper). */
  upperMaterial: Record<string, MaterialId>;
  upperHandle: Record<string, HandleType>;
  upperType: Record<string, UpperKind>;
  auxMaterials: AuxMaterials;

  // Phase D — engineering
  cabinetHardware: Record<string, HardwareSelection>;
  hardeningPanels: HardeningPanel[];
  hardeningSketchMode: boolean;
  hardeningPresets: HardeningPanelPreset[];
  /** which face is currently armed for sketching */
  hardeningSketchFace: HardeningPanel['face'] | null;
  /** which cabinet is currently armed for sketching */
  hardeningSketchCabId: string | null;

  // Phase E — kromka + advisor
  kromkaConfig: KromkaConfig;
  appliedAdvisorTips: AdvisorRuleId[];
  dismissedAdvisorTips: AdvisorRuleId[];

  // UI ephemeral
  selectedCabinetId: string | null;
  selectedUpperId: string | null;
  /** Which fixture of the selected cabinet the camera is zoomed onto. */
  selectedDetail: 'faucet' | 'stove' | 'sink' | null;
  /** Worktop (countertop) is the focused element. */
  selectedWorktop: boolean;
  viewMode: ViewMode;
  heroMode: boolean;

  // ── Actions: project lifecycle ───────────────────────────
  createNewProject: () => string;
  loadProject: (id: string) => void;
  setPhase: (phase: Phase) => void;
  markPhaseComplete: (phase: Phase) => void;
  saveCustomerConfirmation: (variantName: string) => void;
  clearCustomerConfirmation: () => void;
  saveCurrentProject: () => void;

  // ── Actions: Phase A ─────────────────────────────────────
  setWallLength: (mm: number) => void;
  cycleWallLength: () => void;
  setWallHeight: (h: CeilingHeight) => void;
  addConstraint: (c: Omit<Constraint, 'id'>) => void;
  updateConstraint: (id: string, patch: Partial<Constraint>) => void;
  removeConstraint: (id: string) => void;
  regenerateVariants: () => void;

  // ── Actions: Phase B/C ───────────────────────────────────
  setVariant: (idx: number) => void;
  cycleVariant: (direction: 1 | -1) => void;
  setGlobalMaterial: (m: MaterialId) => void;
  setCabinetMaterial: (cabId: string, m: MaterialId) => void;
  /** Context-aware material setter: targets the selected upper, else the
      selected cabinet, else the global material. Used by the material drawer. */
  setMaterialForSelection: (m: MaterialId) => void;
  selectWorktop: (v: boolean) => void;
  setWorktopColor: (color: number) => void;
  /* Direct setters — used by the explicit chip controls in the selection pill. */
  setCabinetDoorStyle: (cabId: string, v: DoorStyle) => void;
  setCabinetHandle: (cabId: string, v: HandleType) => void;
  setCabinetSink: (cabId: string, v: SinkType) => void;
  setCabinetStove: (cabId: string, v: StoveType) => void;
  setCabinetFaucetStyle: (cabId: string, v: FaucetStyle) => void;
  setCabinetFaucetFinish: (cabId: string, v: FaucetFinish) => void;
  setCabinetBurners: (cabId: string, v: BurnerCount) => void;
  setDrawerType: (cabId: string, index: number, v: DrawerKind) => void;
  selectCabinet: (id: string | null) => void;
  selectUpper: (id: string | null) => void;
  /** Select a cabinet AND zoom to one of its fixtures. */
  focusDetail: (cabId: string, detail: 'faucet' | 'stove' | 'sink') => void;
  setUpperMaterial: (cabId: string, m: MaterialId) => void;
  setUpperHandle: (cabId: string, v: HandleType) => void;
  setUpperType: (cabId: string, v: UpperKind) => void;
  resizeCabinet: (cabId: string, deltaMm: number) => void;
  setCabinetDrawerCount: (cabId: string, count: 2 | 3 | 4) => void;
  /** Convert a carcass cabinet between doors ('base') and drawers ('drawer3'). */
  setCabinetType: (cabId: string, type: CabinetType) => void;
  setViewMode: (m: ViewMode) => void;
  setHeroMode: (v: boolean) => void;
  setAuxMaterial: <K extends keyof AuxMaterials>(kind: K, value: AuxMaterials[K]) => void;

  // ── Actions: Phase D ─────────────────────────────────────
  setCabinetHardware: (cabId: string, hw: Partial<HardwareSelection>) => void;
  enterHardeningSketchMode: (cabId: string, face: HardeningPanel['face']) => void;
  exitHardeningSketchMode: () => void;
  addHardeningPanel: (p: Omit<HardeningPanel, 'id'>) => void;
  removeHardeningPanel: (id: string) => void;
  saveHardeningPreset: (slot: 1 | 2 | 3, preset: Omit<HardeningPanelPreset, 'slot'>) => void;
  loadHardeningPreset: (slot: 1 | 2 | 3) => HardeningPanelPreset | null;

  // ── Actions: Phase E ─────────────────────────────────────
  setKromkaConfig: (config: Partial<KromkaConfig>) => void;
  applyAdvisorTip: (tipId: AdvisorRuleId) => void;
  dismissAdvisorTip: (tipId: AdvisorRuleId) => void;

  // ── Settings ─────────────────────────────────────────────
  completeSetup: (config: SetupConfig) => void;
  setLanguage: (lang: Language) => void;
}

const initialPhaseCompletion: PhaseCompletion = {
  A: false, B: false, C: false, D: false, E: false, F: false,
};

// ── Store ──────────────────────────────────────────────────────
export const useUI = create<UIState>()(persist((set, get) => ({
  // Shop
  hasCompletedSetup: false,
  shopName: 'Мебельный цех',
  defaultSupplier: 'imkon',
  defaultThickness: 16,
  defaultHardware: 'hettich',
  language: 'ru',

  // Project pointer + phase
  currentProjectId: null,
  currentPhase: 'A',
  recentProjects: SAMPLE_PROJECTS,
  phaseCompletion: { ...initialPhaseCompletion },

  // Phase A
  wallLengthMm: DEFAULT_WALL,
  wallHeightMm: DEFAULT_CEILING,
  constraints: [],

  // Phase B
  variantIdx: 0,
  variants: generateVariants(DEFAULT_WALL, []),
  customerConfirmation: undefined,

  // Phase C
  globalMaterial: 'white_classic',
  globalDoorStyle: 'flat',
  sinkType: 'single',
  stoveType: 'induction',
  worktopOverride: null,
  cabinetMaterial: {},
  cabinetDoorStyle: {},
  cabinetHandle: {},
  cabinetSink: {},
  cabinetStove: {},
  cabinetFaucet: {},
  cabinetFaucetFinish: {},
  cabinetBurners: {},
  drawerTypes: {},
  upperMaterial: {},
  upperHandle: {},
  upperType: {},
  auxMaterials: { ...DEFAULT_AUX },

  // Phase D
  cabinetHardware: {},
  hardeningPanels: [],
  hardeningSketchMode: false,
  hardeningPresets: [],
  hardeningSketchFace: null,
  hardeningSketchCabId: null,

  // Phase E
  kromkaConfig: { ...DEFAULT_KROMKA },
  appliedAdvisorTips: [],
  dismissedAdvisorTips: [],

  // UI
  selectedCabinetId: null,
  selectedUpperId: null,
  selectedDetail: null,
  selectedWorktop: false,
  viewMode: '3d',
  heroMode: false,

  // ── Project lifecycle ────────────────────────────────────
  createNewProject: () => {
    const id = generateProjectId();
    set({
      currentProjectId: id,
      currentPhase: 'A',
      phaseCompletion: { ...initialPhaseCompletion },
      wallLengthMm: DEFAULT_WALL,
      wallHeightMm: DEFAULT_CEILING,
      constraints: [],
      variantIdx: 0,
      variants: generateVariants(DEFAULT_WALL, []),
      customerConfirmation: undefined,
      globalMaterial: 'white_classic',
      globalDoorStyle: 'flat',
      sinkType: 'single',
      stoveType: 'induction',
      worktopOverride: null,
      cabinetMaterial: {},
      cabinetDoorStyle: {},
      cabinetHandle: {},
      cabinetSink: {},
      cabinetStove: {},
      cabinetFaucet: {},
      cabinetFaucetFinish: {},
      cabinetBurners: {},
      drawerTypes: {},
      upperMaterial: {},
      upperHandle: {},
      upperType: {},
      auxMaterials: { ...DEFAULT_AUX },
      cabinetHardware: {},
      hardeningPanels: [],
      hardeningPresets: get().hardeningPresets, // presets are shop-level, persist
      kromkaConfig: { ...DEFAULT_KROMKA },
      appliedAdvisorTips: [],
      dismissedAdvisorTips: [],
      selectedCabinetId: null,
      selectedUpperId: null,
      selectedDetail: null,
      selectedWorktop: false,
      viewMode: '3d',
      heroMode: false,
    });
    return id;
  },

  loadProject: (id) => {
    /* In V2 this would deserialize from SQLite. For now: just set the id. */
    set({ currentProjectId: id });
  },

  setPhase: (phase) => set({ currentPhase: phase }),

  markPhaseComplete: (phase) =>
    set((s) => ({ phaseCompletion: { ...s.phaseCompletion, [phase]: true } })),

  saveCustomerConfirmation: (variantName) => {
    /* Synchronous part: stamp timestamp + variant immediately so the UI
       updates without waiting on the GPU readback. */
    const ts = Date.now();
    const cc: CustomerConfirmation = {
      timestamp: ts,
      screenshotPath: '/pending/confirmations/' + ts + '.png',
      variantName,
    };
    set((s) => ({
      customerConfirmation: cc,
      phaseCompletion: { ...s.phaseCompletion, B: true, customerConfirmation: cc },
    }));

    /* Async: take a real screenshot via expo-gl and patch the path in.
       We import lazily so node tooling (typecheck) doesn't choke on the
       expo-gl native module when web-bundling. */
    import('@/lib/screenshot').then(async ({ captureSceneScreenshot }) => {
      try {
        const realPath = await captureSceneScreenshot();
        const cur = get().customerConfirmation;
        /* Only patch if the confirmation we just saved is still current
           (user may have cleared/replaced it in the interim). */
        if (cur && cur.timestamp === ts) {
          const patched: CustomerConfirmation = { ...cur, screenshotPath: realPath };
          set((s) => ({
            customerConfirmation: patched,
            phaseCompletion: { ...s.phaseCompletion, customerConfirmation: patched },
          }));
        }
      } catch {/* keep pending path */}
    });
  },

  clearCustomerConfirmation: () =>
    set((s) => ({
      customerConfirmation: undefined,
      phaseCompletion: { ...s.phaseCompletion, B: false, customerConfirmation: undefined },
    })),

  saveCurrentProject: () => {
    const s = get();
    if (!s.currentProjectId) return;
    const summary: ProjectSummary = {
      id: s.currentProjectId,
      name: 'Кухня ' + s.wallLengthMm + ' мм',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      wallLengthMm: s.wallLengthMm,
      totalPriceSum: mockPrice(s.wallLengthMm, s.variantIdx, s.globalMaterial),
      thumbnailColor: s.globalMaterial,
      currentPhase: s.currentPhase,
    };
    const existing = s.recentProjects.findIndex((p) => p.id === summary.id);
    const next = [...s.recentProjects];
    if (existing >= 0) next[existing] = { ...next[existing], ...summary };
    else next.unshift(summary);
    set({ recentProjects: next.slice(0, 6) });
  },

  // ── Phase A ──────────────────────────────────────────────
  setWallLength: (mm) => {
    set({
      wallLengthMm: mm,
      variants: generateVariants(mm, get().constraints),
      variantIdx: 0,
      cabinetMaterial: {},
      cabinetDoorStyle: {},
      cabinetHandle: {},
      cabinetSink: {},
      cabinetStove: {},
      cabinetFaucet: {},
      cabinetFaucetFinish: {},
      cabinetBurners: {},
      drawerTypes: {},
      upperMaterial: {},
      upperHandle: {},
      upperType: {},
      cabinetHardware: {},
      hardeningPanels: [],
      selectedCabinetId: null,
      selectedUpperId: null,
      selectedDetail: null,
      selectedWorktop: false,
    });
  },

  cycleWallLength: () => {
    const cur = get().wallLengthMm;
    const i = WALL_SIZES_MM.indexOf(cur as (typeof WALL_SIZES_MM)[number]);
    const next = WALL_SIZES_MM[(i + 1) % WALL_SIZES_MM.length];
    get().setWallLength(next);
  },

  setWallHeight: (h) => set({ wallHeightMm: h }),

  addConstraint: (c) =>
    set((s) => ({
      constraints: [
        ...s.constraints,
        { ...c, id: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) },
      ],
    })),

  updateConstraint: (id, patch) =>
    set((s) => ({
      constraints: s.constraints.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  removeConstraint: (id) =>
    set((s) => ({ constraints: s.constraints.filter((c) => c.id !== id) })),

  regenerateVariants: () => {
    const s = get();
    set({ variants: generateVariants(s.wallLengthMm, s.constraints), variantIdx: 0 });
  },

  // ── Phase B/C ────────────────────────────────────────────
  setVariant: (idx) => {
    set({
      variantIdx: idx,
      cabinetMaterial: {},
      cabinetDoorStyle: {},
      cabinetHandle: {},
      cabinetSink: {},
      cabinetStove: {},
      cabinetFaucet: {},
      cabinetFaucetFinish: {},
      cabinetBurners: {},
      drawerTypes: {},
      upperMaterial: {},
      upperHandle: {},
      upperType: {},
      cabinetHardware: {},
      hardeningPanels: [],
      selectedCabinetId: null,
      selectedUpperId: null,
      selectedDetail: null,
      selectedWorktop: false,
    });
  },

  cycleVariant: (direction) => {
    const { variantIdx, variants } = get();
    if (variants.length === 0) return;
    const n = variants.length;
    get().setVariant((variantIdx + direction + n) % n);
  },

  setGlobalMaterial: (m) => set({ globalMaterial: m }),

  setCabinetMaterial: (cabId, m) =>
    set((s) => ({ cabinetMaterial: { ...s.cabinetMaterial, [cabId]: m } })),

  /* Context-aware: upper selected → that upper; cabinet selected → that
     cabinet; nothing selected → global default. Lets the bottom "material"
     button target whatever the master is currently focused on. */
  setMaterialForSelection: (m) =>
    set((s) => {
      if (s.selectedUpperId) {
        return { upperMaterial: { ...s.upperMaterial, [s.selectedUpperId]: m } };
      }
      if (s.selectedCabinetId) {
        return { cabinetMaterial: { ...s.cabinetMaterial, [s.selectedCabinetId]: m } };
      }
      return { globalMaterial: m };
    }),

  /* Direct per-cabinet setters (explicit chip controls) */
  setCabinetDoorStyle: (cabId, v) =>
    set((s) => ({ cabinetDoorStyle: { ...s.cabinetDoorStyle, [cabId]: v } })),
  setCabinetHandle: (cabId, v) =>
    set((s) => ({ cabinetHandle: { ...s.cabinetHandle, [cabId]: v } })),
  setCabinetSink: (cabId, v) =>
    set((s) => ({ cabinetSink: { ...s.cabinetSink, [cabId]: v } })),
  setCabinetStove: (cabId, v) =>
    set((s) => ({ cabinetStove: { ...s.cabinetStove, [cabId]: v } })),
  setCabinetFaucetStyle: (cabId, v) =>
    set((s) => ({ cabinetFaucet: { ...s.cabinetFaucet, [cabId]: v } })),
  setCabinetFaucetFinish: (cabId, v) =>
    set((s) => ({ cabinetFaucetFinish: { ...s.cabinetFaucetFinish, [cabId]: v } })),
  setCabinetBurners: (cabId, v) =>
    set((s) => ({ cabinetBurners: { ...s.cabinetBurners, [cabId]: v } })),
  setDrawerType: (cabId, index, v) =>
    set((s) => ({ drawerTypes: { ...s.drawerTypes, [`${cabId}#${index}`]: v } })),

  selectCabinet: (id) => {
    /* During the "show customer" ceremony (heroMode turntable), nothing is
       selectable — a stray tap shouldn't highlight anything. Deselecting
       (id === null) is always allowed. Selecting a cabinet clears any
       upper/worktop selection (focus is mutually exclusive). */
    if (id !== null && get().heroMode) return;
    set({ selectedCabinetId: id, selectedUpperId: null, selectedDetail: null, selectedWorktop: false });
  },

  selectUpper: (id) => {
    if (id !== null && get().heroMode) return;
    set({ selectedUpperId: id, selectedCabinetId: null, selectedDetail: null, selectedWorktop: false });
  },

  focusDetail: (cabId, detail) => {
    if (get().heroMode) return;
    set({ selectedCabinetId: cabId, selectedUpperId: null, selectedDetail: detail, selectedWorktop: false });
  },

  selectWorktop: (v) => {
    if (v && get().heroMode) return;
    set({ selectedWorktop: v, selectedCabinetId: null, selectedUpperId: null, selectedDetail: null });
  },

  setWorktopColor: (color) => set({ worktopOverride: color }),

  setUpperMaterial: (cabId, m) =>
    set((s) => ({ upperMaterial: { ...s.upperMaterial, [cabId]: m } })),

  setUpperHandle: (cabId, v) =>
    set((s) => ({ upperHandle: { ...s.upperHandle, [cabId]: v } })),

  setUpperType: (cabId, v) =>
    set((s) => ({ upperType: { ...s.upperType, [cabId]: v } })),

  resizeCabinet: (cabId, deltaMm) =>
    set((s) => {
      const v = s.variants[s.variantIdx];
      if (!v) return s;
      const i = v.cabinets.findIndex((c) => c.id === cabId);
      if (i < 0) return s;
      const curMm = v.cabinets[i].width * 1000;
      const nextMm = Math.max(
        INTERACTION.RESIZE_MIN_MM,
        Math.min(INTERACTION.RESIZE_MAX_MM, curMm + deltaMm)
      );
      const updated: Variant = {
        ...v,
        cabinets: v.cabinets.map((c, idx) =>
          idx === i ? { ...c, width: nextMm / 1000 } : c
        ),
      };
      return {
        variants: s.variants.map((vv, vi) => (vi === s.variantIdx ? updated : vv)),
      };
    }),

  setCabinetDrawerCount: (cabId, count) =>
    set((s) => {
      const v = s.variants[s.variantIdx];
      if (!v) return s;
      const newType = count === 2 ? 'drawer3' : count === 3 ? 'drawer3' : 'drawer4';
      const updated: Variant = {
        ...v,
        cabinets: v.cabinets.map((c) =>
          c.id === cabId
            ? { ...c, type: newType as Variant['cabinets'][number]['type'] }
            : c
        ),
      };
      return {
        variants: s.variants.map((vv, vi) => (vi === s.variantIdx ? updated : vv)),
      };
    }),

  /* Convert a carcass cabinet's type (doors ↔ drawers) from the pill. */
  setCabinetType: (cabId, type) =>
    set((s) => {
      const v = s.variants[s.variantIdx];
      if (!v) return s;
      const updated: Variant = {
        ...v,
        cabinets: v.cabinets.map((c) => (c.id === cabId ? { ...c, type } : c)),
      };
      return {
        variants: s.variants.map((vv, vi) => (vi === s.variantIdx ? updated : vv)),
      };
    }),

  setViewMode: (m) => set({ viewMode: m }),
  setHeroMode: (v) => set({ heroMode: v }),

  setAuxMaterial: (kind, value) =>
    set((s) => ({ auxMaterials: { ...s.auxMaterials, [kind]: value } })),

  // ── Phase D ──────────────────────────────────────────────
  setCabinetHardware: (cabId, hw) =>
    set((s) => ({
      cabinetHardware: {
        ...s.cabinetHardware,
        [cabId]: { ...DEFAULT_HARDWARE, ...s.cabinetHardware[cabId], ...hw },
      },
    })),

  enterHardeningSketchMode: (cabId, face) =>
    set({ hardeningSketchMode: true, hardeningSketchCabId: cabId, hardeningSketchFace: face }),

  exitHardeningSketchMode: () =>
    set({ hardeningSketchMode: false, hardeningSketchCabId: null, hardeningSketchFace: null }),

  addHardeningPanel: (p) =>
    set((s) => ({
      hardeningPanels: [
        ...s.hardeningPanels,
        { ...p, id: 'h_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) },
      ],
      hardeningSketchMode: false,
      hardeningSketchCabId: null,
      hardeningSketchFace: null,
    })),

  removeHardeningPanel: (id) =>
    set((s) => ({ hardeningPanels: s.hardeningPanels.filter((h) => h.id !== id) })),

  saveHardeningPreset: (slot, preset) =>
    set((s) => {
      const next = s.hardeningPresets.filter((p) => p.slot !== slot);
      next.push({ ...preset, slot });
      next.sort((a, b) => a.slot - b.slot);
      return { hardeningPresets: next };
    }),

  loadHardeningPreset: (slot) => {
    return get().hardeningPresets.find((p) => p.slot === slot) ?? null;
  },

  // ── Phase E ──────────────────────────────────────────────
  setKromkaConfig: (config) =>
    set((s) => ({ kromkaConfig: { ...s.kromkaConfig, ...config } })),

  applyAdvisorTip: (tipId) =>
    set((s) => {
      if (s.appliedAdvisorTips.includes(tipId)) return s;
      const updates: Partial<UIState> = {
        appliedAdvisorTips: [...s.appliedAdvisorTips, tipId],
      };
      /* Apply real side-effects per rule */
      if (tipId === 'two_tone_split') {
        updates.globalMaterial = 'matte_white';
        updates.cabinetMaterial = Object.fromEntries(
          (s.variants[s.variantIdx]?.cabinets ?? []).map((c, i) =>
            [c.id, i % 2 === 0 ? 'matte_white' : 'standard_white' as MaterialId]
          )
        );
      } else if (tipId === 'skip_back_kromka') {
        updates.kromkaConfig = { ...s.kromkaConfig, skipBackEdges: true };
      } else if (tipId === 'thickness_downgrade') {
        updates.defaultThickness = 16;
      }
      return updates as UIState;
    }),

  dismissAdvisorTip: (tipId) =>
    set((s) => ({
      dismissedAdvisorTips: s.dismissedAdvisorTips.includes(tipId)
        ? s.dismissedAdvisorTips
        : [...s.dismissedAdvisorTips, tipId],
    })),

  // ── Settings ─────────────────────────────────────────────
  completeSetup: (cfg) =>
    set({
      shopName: cfg.shopName,
      defaultSupplier: cfg.defaultSupplier,
      defaultThickness: cfg.defaultThickness,
      defaultHardware: cfg.defaultHardware,
      hasCompletedSetup: true,
    }),

  setLanguage: (lang) => set({ language: lang }),
}), {
  name: 'mebelchi-ui-v2',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (s) => ({
    hasCompletedSetup: s.hasCompletedSetup,
    shopName: s.shopName,
    defaultSupplier: s.defaultSupplier,
    defaultThickness: s.defaultThickness,
    defaultHardware: s.defaultHardware,
    language: s.language,
    recentProjects: s.recentProjects,
    globalMaterial: s.globalMaterial,
    hardeningPresets: s.hardeningPresets,
  }),
}));

// ── Selectors ──────────────────────────────────────────────────
export const selectCurrentVariant = (s: UIState): Variant | undefined =>
  s.variants[s.variantIdx];

export const selectIsSelected = (cabId: string) => (s: UIState): boolean =>
  s.selectedCabinetId === cabId;

export const selectEffectiveMaterial = (cabId: string) => (s: UIState): MaterialId =>
  s.cabinetMaterial[cabId] ?? s.globalMaterial;

export const selectEffectiveHardware = (cabId: string) => (s: UIState): HardwareSelection =>
  s.cabinetHardware[cabId] ?? DEFAULT_HARDWARE;

/** Project completion fraction (0-1) — drives Home thumbnail progress badge. */
export const selectPhaseProgress = (s: UIState): number => {
  const phases: Phase[] = ['A', 'B', 'C', 'D', 'E', 'F'];
  const done = phases.filter((p) => s.phaseCompletion[p]).length;
  return done / phases.length;
};
