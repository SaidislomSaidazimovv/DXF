/**
 * Material palette — Tashkent LDSP ballpark.
 * `costPerSheet` is per 2800×2070×16mm sheet, soum.
 *
 * The first block is the user-pickable palette (PALETTE_MATERIALS). The two
 * advisor entries at the end ('matte_white', 'standard_white') are used only
 * by the smart-advisor two-tone split and are excluded from the picker.
 */
import type { Material, MaterialId } from '@/types/ui';

export const MATERIALS: readonly Material[] = [
  /* ── Whites / creams ─────────────────────────────── */
  { id: 'white_classic', name: 'Белая классика', facade: 0xf6f3ea, top: 0xdfd9c8, isDark: false, costPerSheet: 512_500 },
  { id: 'snow_white',    name: 'Белоснежный',    facade: 0xfbfbf8, top: 0xe6e2d6, isDark: false, costPerSheet: 530_000 },
  { id: 'cream',         name: 'Кремовый',       facade: 0xefe7d2, top: 0xd8cdb0, isDark: false, costPerSheet: 545_000 },
  { id: 'vanilla',       name: 'Ваниль',         facade: 0xeadfbf, top: 0xcdbf98, isDark: false, costPerSheet: 548_000 },
  { id: 'cashmere',      name: 'Кашемир',        facade: 0xddd0b6, top: 0xc5b88f, isDark: false, costPerSheet: 580_000 },
  { id: 'sand',          name: 'Песочный',       facade: 0xd8c7a0, top: 0xbfae84, isDark: false, costPerSheet: 560_000 },
  { id: 'beige_warm',    name: 'Тёплый беж',     facade: 0xcbb78f, top: 0xae9a70, isDark: false, costPerSheet: 565_000 },

  /* ── Woods ───────────────────────────────────────── */
  { id: 'oak_light',     name: 'Дуб светлый',    facade: 0xc4a575, top: 0x2c2c2a, isDark: false, costPerSheet: 650_000 },
  { id: 'oak_sonoma',    name: 'Дуб сонома',     facade: 0xcdb487, top: 0x3a352c, isDark: false, costPerSheet: 660_000 },
  { id: 'oak_amber',     name: 'Дуб янтарь',     facade: 0xb98c4e, top: 0x2a2520, isDark: false, costPerSheet: 670_000 },
  { id: 'walnut',        name: 'Орех тёмный',    facade: 0x6b4528, top: 0x1a1a18, isDark: true,  costPerSheet: 780_000 },
  { id: 'wenge',         name: 'Венге',          facade: 0x4a3526, top: 0x161412, isDark: true,  costPerSheet: 760_000 },
  { id: 'cherry',        name: 'Вишня',          facade: 0x7a4234, top: 0x21130f, isDark: true,  costPerSheet: 700_000 },

  /* ── Greys / stone ───────────────────────────────── */
  { id: 'stone_grey',    name: 'Серый камень',   facade: 0x8e8a83, top: 0x1f1f1d, isDark: false, costPerSheet: 620_000 },
  { id: 'dust_grey',     name: 'Пыльно-серый',   facade: 0xa9a59c, top: 0x33312d, isDark: false, costPerSheet: 600_000 },
  { id: 'graphite',      name: 'Графит',         facade: 0x55565a, top: 0x1c1c1d, isDark: true,  costPerSheet: 640_000 },
  { id: 'anthracite',    name: 'Антрацит',       facade: 0x2e2e30, top: 0x1a1a18, isDark: true,  costPerSheet: 700_000 },
  { id: 'black_matte',   name: 'Чёрный матовый', facade: 0x1c1c1e, top: 0x0e0e0f, isDark: true,  costPerSheet: 720_000 },

  /* ── Colours ─────────────────────────────────────── */
  { id: 'sage_green',    name: 'Зелёный шалфей',  facade: 0x8b9479, top: 0x2a2c24, isDark: false, costPerSheet: 660_000 },
  { id: 'olive',         name: 'Олива',          facade: 0x6f7350, top: 0x222318, isDark: true,  costPerSheet: 660_000 },
  { id: 'navy',          name: 'Тёмно-синий',    facade: 0x2f3b52, top: 0x14181f, isDark: true,  costPerSheet: 690_000 },
  { id: 'dusty_blue',    name: 'Пыльно-голубой', facade: 0x6d8190, top: 0x222a2f, isDark: false, costPerSheet: 670_000 },
  { id: 'terracotta',    name: 'Терракота',      facade: 0xa9633f, top: 0x2a1812, isDark: false, costPerSheet: 680_000 },

  /* ── Advisor-only (two-tone split) — NOT in the picker ── */
  { id: 'matte_white',   name: 'Матовый белый',  facade: 0xf6f4ee, top: 0xdfd9c8, isDark: false, costPerSheet: 540_000 },
  { id: 'standard_white',name: 'Стандарт белый', facade: 0xf2eee3, top: 0xdfd9c8, isDark: false, costPerSheet: 430_000 },
] as const;

const ADVISOR_ONLY = new Set<MaterialId>(['matte_white', 'standard_white']);

/** Visible palette in the pickers (excludes advisor-only entries) — 23 colours. */
export const PALETTE_MATERIALS = MATERIALS.filter((m) => !ADVISOR_ONLY.has(m.id));

export function materialById(id: MaterialId): Material {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];
}

/** Worktop (countertop) surface colours the master can pick. */
export const WORKTOP_COLORS: { value: number; label: string }[] = [
  { value: 0xdfd9c8, label: 'Светлая' },
  { value: 0xe8e4da, label: 'Белый мрамор' },
  { value: 0xc5b88f, label: 'Песок' },
  { value: 0x5a4a32, label: 'Дерево' },
  { value: 0x8e8a83, label: 'Серый камень' },
  { value: 0x2c2c2a, label: 'Тёмная' },
  { value: 0x1f1f1d, label: 'Чёрная' },
];
