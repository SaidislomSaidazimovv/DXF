/**
 * Mebelchi UI v2 — type definitions
 *
 * Drop this into /src/types/ui.ts (replaces v1 types).
 * Companion to: 00_CJM_V1.md, 10_UI_PRINCIPLES.md, HANDOVER_UI_V2.md
 *
 * Version: 2.0
 * Owner: Oppoq
 */

// ============================================================
// PHASE STATE
// ============================================================

export type Phase = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface PhaseCompletion {
  A: boolean;
  B: boolean;
  C: boolean;
  D: boolean;
  E: boolean;
  F: boolean;
  customerConfirmation?: CustomerConfirmation;
}

export interface CustomerConfirmation {
  timestamp: number;            // ms epoch
  screenshotPath: string;       // local file URI
  variantName: string;          // which variant was confirmed
}

// ============================================================
// PHASE A — Constraints
// ============================================================

export type ConstraintType =
  | 'window'
  | 'door'
  | 'gas_line'
  | 'drain_stack'
  | 'water_inlet'
  | 'outlet'
  | 'hood_vent';

export interface Constraint {
  id: string;
  type: ConstraintType;
  /** X position along the wall, in millimeters from the left corner */
  xMm: number;
  /** Width in millimeters; not used for point constraints (gas, drain, outlet, vent) */
  widthMm?: number;
  /** For doors: which side the door swings to (left/right) */
  swingSide?: 'left' | 'right';
  /** Optional notes from the mebelchi */
  notes?: string;
}

export type CeilingHeight = 2400 | 2500 | 2600 | 2700 | 3000;

// ============================================================
// MATERIALS
// ============================================================

export type MaterialId =
  | 'white_classic'
  | 'cashmere'
  | 'oak_light'
  | 'graphite'
  | 'walnut'
  | 'anthracite'
  | 'matte_white'        // for two-tone advisor — facade variant
  | 'standard_white';    // for two-tone advisor — carcass variant

export interface Material {
  id: MaterialId;
  name: string;
  facade: number;        // hex color
  top: number;           // default worktop hex color
  isDark: boolean;
  costPerSheet: number;  // soum per 2800×2070×16mm sheet — for cost engine
}

// ============================================================
// KROMKA (EDGE BANDING)
// ============================================================

export type KromkaThickness = 0.4 | 0.8 | 1.0 | 1.3 | 2.0;  // mm

export interface KromkaConfig {
  /** Default kromka for visible edges */
  visibleThickness: KromkaThickness;
  /** Default kromka for hidden edges */
  hiddenThickness: KromkaThickness;
  /** Color match strategy */
  colorStrategy: 'facade_match' | 'carcass_match' | 'contrast';
  /** Skip kromka on back edges (advisor save-money) */
  skipBackEdges: boolean;
}

/**
 * Per-edge kromka spec computed by the cut-list engine.
 * Not user-configurable in V1; derived from KromkaConfig per cabinet.
 */
export interface PanelEdgeKromka {
  panelId: string;
  edge: 'top' | 'bottom' | 'left' | 'right';
  thickness: KromkaThickness;
  color: number;  // hex
  isVisible: boolean;
}

// ============================================================
// CABINETS
// ============================================================

export type CabinetType =
  | 'base'
  | 'drawer3'
  | 'drawer4'
  | 'sink'
  | 'stove'
  | 'sink_stove'
  | 'tall'
  | 'fridge';

export type DoorStyle = 'flat' | 'shaker' | 'grooved';
export type HandleType = 'bar' | 'knob' | 'inset';
export type SinkType = 'single' | 'double' | 'none';
export type StoveType = 'induction' | 'gas' | 'none';
/** Faucet (kran) silhouette — a per-sink detail the master can swap. */
export type FaucetStyle = 'arch' | 'straight' | 'pull';

export interface Cabinet {
  id: string;
  type: CabinetType;
  width: number;         // meters
  /** Drawer-specific config; only set for drawer3/drawer4 types */
  drawerConfig?: DrawerConfig;
}

export interface DrawerConfig {
  count: 2 | 3 | 4;
  softClose: boolean;
  hasDeepBottom: boolean;        // bottom drawer is deeper than others
  heights: [number, number, number?] | [number, number, number, number]; // mm
}

// ============================================================
// AUXILIARY MATERIALS
// ============================================================

export type AuxMaterialKind =
  | 'back_panel'      // back wall of cabinet
  | 'shelf'           // internal shelves
  | 'drawer_bottom'   // drawer bottoms
  | 'internal_divider'; // partitions inside cabinets

export interface AuxMaterials {
  backPanel: 'hdf_3mm' | 'mdf_3mm' | 'ldsp_16mm';
  shelf: 'ldsp_16mm' | 'ldsp_18mm' | 'glass_4mm';
  drawerBottom: 'hdf_3mm' | 'mdf_3mm';
  internalDivider: 'ldsp_16mm';  // locked default in V1
}

// ============================================================
// HARDWARE CATALOG (12 SKUs for V1)
// ============================================================

export type HingeBrand = 'blum' | 'hettich' | 'boyard';
export type HingeOverlay = 'full' | 'half' | 'inset';
export type SlideBrand = 'blum' | 'hettich';
export type SlideLength = 450 | 500;  // mm

export interface HardwareSelection {
  hingeBrand: HingeBrand;
  hingeOverlay: HingeOverlay;
  slideBrand: SlideBrand;
  slideLength: SlideLength;
  // shelf supports are global per cabinet, not user-selectable in V1
}

export interface HingeSpec {
  brand: HingeBrand;
  overlay: HingeOverlay;
  /** Cup diameter in mm — Ø35 for nearly all */
  cupDiameter: number;
  /** Cup depth in mm — typically 13 for Blum CLIP */
  cupDepth: number;
  /** Distance from edge to cup center in mm — 5 for full overlay, 9 for half */
  cupEdgeOffset: number;
  /** Reference to the manufacturer datasheet model number */
  modelNumber: string;
}

// ============================================================
// CUSTOM HARDENING PANELS (non-negotiable)
// ============================================================

export interface HardeningPanel {
  id: string;
  /** Which cabinet this panel is attached to */
  cabinetId: string;
  /** Which face of the cabinet (back, left side, right side, bottom, top) */
  face: 'back' | 'left' | 'right' | 'bottom' | 'top';
  /** Rectangle in face-local 2D coordinates (mm) */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Material (default ldsp_16mm) */
  material: 'ldsp_16mm' | 'ldsp_18mm' | 'mdf_16mm';
  /** Joinery type */
  joint: 'screws' | 'clamex' | 'cam_dowel';
  /** Optional master's personal label */
  label?: string;
}

export interface HardeningPanelPreset {
  slot: 1 | 2 | 3;
  width: number;     // mm
  height: number;    // mm
  material: HardeningPanel['material'];
  joint: HardeningPanel['joint'];
  label: string;
}

// ============================================================
// STRUCTURAL BENCHMARK
// ============================================================

export type StructuralStatus = 'green' | 'amber' | 'red';

export interface CabinetStructuralCheck {
  cabinetId: string;
  status: StructuralStatus;
  reasons: string[];   // e.g. ["Shelf 1200mm exceeds 16mm deflection limit"]
}

// ============================================================
// VARIANTS
// ============================================================

export interface Variant {
  name: string;
  cabinets: Cabinet[];
  hasUppers: boolean;
  hasSideShelves: boolean;
}

// ============================================================
// VIEW MODES
// ============================================================

export type ViewMode = '3d' | '2d' | 'xray';

// ============================================================
// COST BREAKDOWN
// ============================================================

export interface CostLineItem {
  key: string;
  label: string;
  detail?: string;       // e.g. "3.2 листа", "94 м"
  amountSum: number;     // in soum
  isClickable: boolean;  // tap-to-expand
  subItems?: CostLineItem[];
}

export interface CostBreakdown {
  totalSum: number;
  sheetUtilization: number;  // 0–1
  sheetsUsed: number;        // e.g. 3.2
  lineItems: CostLineItem[];
}

// ============================================================
// SMART ADVISOR
// ============================================================

export type AdvisorRuleId =
  | 'two_tone_split'
  | 'skip_back_kromka'
  | 'thickness_downgrade';

export interface AdvisorTip {
  ruleId: AdvisorRuleId;
  title: string;
  description: string;
  savingsSum: number;
  /** Apply this tip — returns new partial state to merge */
  apply: () => Partial<UIStore>;
}

// ============================================================
// PRE-FLIGHT CHECKLIST (Phase F)
// ============================================================

export type ChecklistItemId =
  | 'all_panels_dimensioned'
  | 'all_hinges_drilled'
  | 'sheet_utilization_ok'
  | 'all_cabinets_passed_benchmark'
  | 'kromka_specified'
  | 'customer_confirmed';

export interface ChecklistItem {
  id: ChecklistItemId;
  label: string;
  passed: boolean;
  detail?: string;       // e.g. "24 мая 2026, 14:32" for confirmation timestamp
  blocker: boolean;      // if true and !passed, disables the export button
}

// ============================================================
// EXPORT ARTIFACTS (Phase F outputs)
// ============================================================

export type ExportFormat = 'dxf' | 'mpr' | 'cix' | 'csv' | 'pdf_cutting' | 'pdf_drilling' | 'pdf_kromka' | 'pdf_assembly' | 'pdf_pack';

export interface ExportArtifact {
  format: ExportFormat;
  filename: string;
  fileUri: string;       // local file URI
  sizeBytes: number;
  checksum: string;      // for provenance footer
}

// ============================================================
// PROJECT
// ============================================================

export interface ProjectSummary {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  wallLengthMm: number;
  totalPriceSum: number;
  thumbnailColor: MaterialId;
  currentPhase: Phase;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;

  // Phase A
  wallLengthMm: number;
  wallHeightMm: CeilingHeight;
  constraints: Constraint[];

  // Phase B
  variantIdx: number;
  variants: Variant[];
  phaseCompletion: PhaseCompletion;

  // Phase C
  globalMaterial: MaterialId;
  globalDoorStyle: DoorStyle;
  sinkType: SinkType;
  stoveType: StoveType;
  worktopOverride: number | null;
  cabinetMaterial: Record<string, MaterialId>;
  cabinetDoorStyle: Record<string, DoorStyle>;
  cabinetHandle: Record<string, HandleType>;
  auxMaterials: AuxMaterials;

  // Phase D
  cabinetHardware: Record<string, HardwareSelection>;
  hardeningPanels: HardeningPanel[];
  structuralChecks: Record<string, CabinetStructuralCheck>;

  // Phase E
  kromkaConfig: KromkaConfig;
  appliedAdvisorTips: AdvisorRuleId[];

  // Phase F
  exportArtifacts: ExportArtifact[];
}

// ============================================================
// UI STORE (Zustand) — full shape
// ============================================================

export interface UIStore {
  // ---- Setup / shop-level ----
  hasCompletedSetup: boolean;
  shopName: string;
  defaultSupplier: 'imkon' | 'egger_uz' | 'kronospan_uz';
  defaultThickness: 10 | 16 | 18;
  defaultHardware: HingeBrand;
  language: 'ru' | 'uz';

  // ---- Current project ----
  currentProjectId: string | null;
  currentPhase: Phase;
  recentProjects: ProjectSummary[];

  // ---- All project fields (mirrored from Project) ----
  project: Project | null;

  // ---- UI-only ephemeral state ----
  selectedCabinetId: string | null;
  viewMode: ViewMode;
  hardeningSketchMode: boolean;
  hardeningPresets: HardeningPanelPreset[];

  // ---- Actions: project lifecycle ----
  createNewProject: () => string;  // returns id, navigates to phase A
  loadProject: (id: string) => void;
  setPhase: (phase: Phase) => void;
  markPhaseComplete: (phase: Phase) => void;
  saveCustomerConfirmation: (screenshotUri: string) => void;

  // ---- Actions: Phase A ----
  setWallLength: (mm: number) => void;
  setWallHeight: (height: CeilingHeight) => void;
  addConstraint: (c: Omit<Constraint, 'id'>) => void;
  updateConstraint: (id: string, patch: Partial<Constraint>) => void;
  removeConstraint: (id: string) => void;

  // ---- Actions: Phase B ----
  regenerateVariants: () => void;
  setVariant: (idx: number) => void;
  cycleVariant: (direction: 1 | -1) => void;

  // ---- Actions: Phase C ----
  setGlobalMaterial: (m: MaterialId) => void;
  setCabinetMaterial: (cabId: string, m: MaterialId) => void;
  cycleDoorStyle: (cabId: string) => void;
  cycleHandle: (cabId: string) => void;
  cycleSink: () => void;
  cycleStove: () => void;
  cycleWorktop: () => void;
  selectCabinet: (id: string | null) => void;
  resizeCabinet: (cabId: string, deltaMm: number) => void;
  setViewMode: (m: ViewMode) => void;
  setAuxMaterial: (kind: AuxMaterialKind, value: string) => void;

  // ---- Actions: Phase D ----
  setCabinetHardware: (cabId: string, hw: Partial<HardwareSelection>) => void;
  enterHardeningSketchMode: () => void;
  exitHardeningSketchMode: () => void;
  addHardeningPanel: (p: Omit<HardeningPanel, 'id'>) => void;
  removeHardeningPanel: (id: string) => void;
  saveHardeningPreset: (slot: 1 | 2 | 3, preset: Omit<HardeningPanelPreset, 'slot'>) => void;
  loadHardeningPreset: (slot: 1 | 2 | 3) => void;

  // ---- Actions: Phase E ----
  setKromkaConfig: (config: Partial<KromkaConfig>) => void;
  applyAdvisorTip: (tipId: AdvisorRuleId) => void;
  dismissAdvisorTip: (tipId: AdvisorRuleId) => void;

  // ---- Actions: Phase F ----
  runPreflightChecklist: () => ChecklistItem[];
  exportAll: () => Promise<ExportArtifact[]>;
  shareViaTelegram: (artifacts: ExportArtifact[]) => Promise<void>;

  // ---- Settings ----
  completeSetup: (config: SetupConfig) => void;
  setLanguage: (lang: 'ru' | 'uz') => void;
}

export interface SetupConfig {
  shopName: string;
  defaultSupplier: 'imkon' | 'egger_uz' | 'kronospan_uz';
  defaultThickness: 10 | 16 | 18;
  defaultHardware: HingeBrand;
}

/* ── V1-compatibility aliases (used by setup wizard / store) ────────── */
export type Language = 'ru' | 'uz';
export type Thickness = 10 | 16 | 18;
export type HardwareBrand = HingeBrand;
export type SupplierId = 'imkon' | 'egger_uz' | 'kronospan_uz';

// ============================================================
// THREE.JS USERDATA TAGS
// ============================================================

export type MeshKind =
  | 'cabinet_body'
  | 'cabinet_door'
  | 'cabinet_handle'
  | 'plinth'
  | 'worktop'
  | 'sink'
  | 'stove'
  | 'shelf'
  | 'hardening_panel'
  | 'drill_mark'
  | 'hinge_indicator'
  | 'slide_indicator'
  | 'highlight'
  | 'floor'
  | 'wall'
  | 'face_target';  // for sketching mode hit-testing

export interface MeshUserData {
  type: MeshKind;
  cabId?: string;
  upper?: boolean;
  isDrawer?: boolean;
  doorIdx?: number;
  shelfIdx?: number;
  /** For face_target meshes used during hardening sketching */
  faceId?: HardeningPanel['face'];
  /** For drill_mark meshes — hardware reference */
  hardwareRef?: string;
}

// ============================================================
// CAMERA TARGETS
// ============================================================

export interface CameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  duration: number;
}

export const OVERVIEW_TARGET: CameraTarget = {
  position: [2.1, 1.55, 3.05],
  lookAt: [0, 0.65, -0.2],
  fov: 34,
  duration: 480,
};

export const PLAN_TARGET: CameraTarget = {
  position: [0.01, 4.2, 0.6],
  lookAt: [0, 0, 0.6],
  fov: 32,
  duration: 540,
};

export const HERO_TARGET: CameraTarget = {
  position: [2.0, 1.4, 3.0],
  lookAt: [0, 0.65, -0.2],
  fov: 34,
  duration: 800,
};

export const XRAY_TARGET: CameraTarget = {
  position: [1.8, 1.8, 2.8],
  lookAt: [0, 0.55, -0.2],
  fov: 34,
  duration: 540,
};

export function computeCabinetCameraTarget(
  worldPos: [number, number, number],
  cabinetWidth: number,
): CameraTarget {
  const [cx, cy, cz] = worldPos;
  const sideOffset = cx >= 0 ? 0.45 : -0.45;
  return {
    position: [
      cx * 0.5 + sideOffset,
      cy + 0.4,
      cz + 1.35 + cabinetWidth * 0.4,
    ],
    lookAt: [cx, cy + 0.04, cz],
    fov: 34,
    duration: 480,
  };
}

// ============================================================
// CONSTANTS
// ============================================================

export const GEOMETRY = {
  CABINET_HEIGHT: 0.82,
  CABINET_DEPTH: 0.56,
  PLINTH_HEIGHT: 0.10,
  UPPER_HEIGHT: 0.70,
  UPPER_DEPTH: 0.32,
  UPPER_Y_OFFSET: 1.45,
  WORKTOP_THICKNESS: 0.038,
  TALL_HEIGHT: 2.0,
} as const;

export const WALL_SIZES_MM = [1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600] as const;
export type WallSize = typeof WALL_SIZES_MM[number];

export const INTERACTION = {
  SWIPE_THRESHOLD_PX: 50,
  SWIPE_AXIS_RATIO: 1.4,
  TAP_MAX_DURATION_MS: 500,
  RESIZE_STEP_MM: 50,
  RESIZE_MIN_MM: 300,
  RESIZE_MAX_MM: 1200,
  WALL_SNAP_MM: 50,
  CONSTRAINT_SNAP_MM: 50,
} as const;

export const ANIM = {
  CAMERA_TWEEN_SELECT: 480,
  CAMERA_TWEEN_DESELECT: 480,
  CAMERA_TWEEN_VIEW_CHANGE: 540,
  PHASE_TRANSITION: 600,
  SELECTION_PILL_RISE: 280,
  DRAWER_SLIDE: 320,
  TOAST_VISIBLE: 1400,
  HERO_PARALLAX_LOOP: 8000,
  CHROME_FADE: 320,
  ADVISOR_CARD_DELAY: 1500,
  ADVISOR_CARD_SLIDE: 240,
  EXPORT_SPINNER: 600,
  EXPORT_CHECKMARK: 300,
  MATERIAL_REPAINT_BUDGET: 100,
  WIDTH_REBUILD_BUDGET: 300,
  VARIANT_REBUILD_BUDGET: 400,
  WALL_REGEN_BUDGET: 500,
} as const;

export const COLORS = {
  // Light / Phase B / Phase C
  bg: '#e8e3d7',
  bgSoft: '#f0ebde',
  bgCard: '#ffffff',
  bgCardTint: 'rgba(255, 255, 255, 0.88)',
  // Dark / Phase D
  bgEng: '#d4cfc2',
  bgEngCard: '#f5f1e6',
  // Phase F professional
  bgPro: '#fafaf7',
  // Ink
  ink: '#1c1c1a',
  inkSoft: '#4a4a48',
  inkMuted: '#7a7972',
  inkFaint: '#aaa8a0',
  // Accents
  line: 'rgba(28, 28, 26, 0.08)',
  lineSoft: 'rgba(28, 28, 26, 0.05)',
  warn: '#b85b1d',
  warnBg: 'rgba(184, 91, 29, 0.08)',
  good: '#2d7a4f',
  goodBg: 'rgba(45, 122, 79, 0.08)',
  // Constraint marker colors (Phase A)
  constraintWindow: '#d4a72c',
  constraintDoor: '#c97a3a',
  constraintGas: '#b03a3a',
  constraintDrain: '#2c6fb8',
  constraintOutlet: '#7a7972',
  constraintVent: '#7a4ab5',
} as const;

export const RADII = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
  engSharp: 6,    // Phase D uses sharper corners
} as const;

export const SHADOWS = {
  sm: { elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  md: { elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
  lg: { elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 30, shadowOffset: { width: 0, height: 8 } },
} as const;

// ============================================================
// HELPERS
// ============================================================

export function tagMesh(userData: MeshUserData): MeshUserData {
  return userData;
}

export function cabinetLabel(type: CabinetType, lang: 'ru' | 'uz' = 'ru'): string {
  const labels: Record<CabinetType, { ru: string; uz: string }> = {
    base:       { ru: 'ШКАФ',              uz: 'SHKAF' },
    drawer3:    { ru: 'ЯЩИКИ × 3',         uz: 'YASHIKLAR × 3' },
    drawer4:    { ru: 'ЯЩИКИ × 4',         uz: 'YASHIKLAR × 4' },
    sink:       { ru: 'МОЙКА',             uz: 'MOYKA' },
    stove:      { ru: 'ВАРОЧНАЯ',          uz: 'PLITA' },
    sink_stove: { ru: 'МОЙКА + ВАРОЧНАЯ',  uz: 'MOYKA + PLITA' },
    tall:       { ru: 'ПЕНАЛ',             uz: 'PENAL' },
    fridge:     { ru: 'ХОЛОДИЛЬНИК',       uz: 'MUZLATGICH' },
  };
  return labels[type][lang];
}

export function constraintLabel(type: ConstraintType, lang: 'ru' | 'uz' = 'ru'): string {
  const labels: Record<ConstraintType, { ru: string; uz: string }> = {
    window:       { ru: 'Окно',          uz: 'Deraza' },
    door:         { ru: 'Дверь',         uz: 'Eshik' },
    gas_line:     { ru: 'Газовая труба', uz: 'Gaz quvuri' },
    drain_stack:  { ru: 'Канализация',   uz: 'Kanalizatsiya' },
    water_inlet:  { ru: 'Водопровод',    uz: 'Suv quvuri' },
    outlet:       { ru: 'Розетка',       uz: 'Rozetka' },
    hood_vent:    { ru: 'Вентиляция',    uz: 'Ventilyatsiya' },
  };
  return labels[type][lang];
}

export function phaseLabel(phase: Phase, lang: 'ru' | 'uz' = 'ru'): string {
  const labels: Record<Phase, { ru: string; uz: string }> = {
    A: { ru: 'Замер',         uz: "O'lchov" },
    B: { ru: 'Планировка',    uz: 'Reja' },
    C: { ru: 'Настройка',     uz: 'Sozlash' },
    D: { ru: 'Инженерия',     uz: 'Muhandislik' },
    E: { ru: 'Расчёт',        uz: 'Hisob' },
    F: { ru: 'На ЧПУ',        uz: 'CNCga' },
  };
  return labels[phase][lang];
}

// ============================================================
// KROMKA MATH (used by cost + cut engines)
// ============================================================

/**
 * Returns the dimensional add per edge for a given kromka thickness.
 * The cut size = nominal − (sum of these deltas around the panel).
 */
export function kromkaDimensionDelta(thickness: KromkaThickness): number {
  return thickness;  // direct millimeter add per banded edge
}

/**
 * Returns the cost per linear meter for a given kromka thickness
 * (Tashkent ballpark, soum). Update from real supplier pricing.
 */
export function kromkaCostPerMeter(thickness: KromkaThickness): number {
  switch (thickness) {
    case 0.4: return 8000;
    case 0.8: return 12000;
    case 1.0: return 16000;
    case 1.3: return 24000;
    case 2.0: return 40000;
  }
}
