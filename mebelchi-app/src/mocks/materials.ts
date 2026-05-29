/**
 * Material palette — V2 (8 entries: 6 user-pickable + 2 advisor-only).
 * `costPerSheet` is per 2800×2070×16mm sheet, soum (Tashkent ballpark).
 */
import type { Material, MaterialId } from '@/types/ui';

export const MATERIALS: readonly Material[] = [
  { id: 'white_classic', name: 'Белая классика', facade: 0xf6f3ea, top: 0xdfd9c8, isDark: false, costPerSheet: 512_500 },
  { id: 'cashmere',      name: 'Кашемир',        facade: 0xddd0b6, top: 0xc5b88f, isDark: false, costPerSheet: 580_000 },
  { id: 'oak_light',     name: 'Дуб светлый',    facade: 0xc4a575, top: 0x2c2c2a, isDark: false, costPerSheet: 650_000 },
  { id: 'graphite',      name: 'Серый камень',   facade: 0x8e8a83, top: 0x1f1f1d, isDark: false, costPerSheet: 620_000 },
  { id: 'walnut',        name: 'Орех тёмный',    facade: 0x6b4528, top: 0x1a1a18, isDark: true,  costPerSheet: 780_000 },
  { id: 'anthracite',    name: 'Антрацит',       facade: 0x2e2e30, top: 0x1a1a18, isDark: true,  costPerSheet: 700_000 },
  /* Advisor-only (two-tone split) — not in the user-pickable palette */
  { id: 'matte_white',   name: 'Матовый белый',  facade: 0xf6f4ee, top: 0xdfd9c8, isDark: false, costPerSheet: 540_000 },
  { id: 'standard_white',name: 'Стандарт белый', facade: 0xf2eee3, top: 0xdfd9c8, isDark: false, costPerSheet: 430_000 },
] as const;

/** Visible palette in the material drawer (excludes advisor-only entries). */
export const PALETTE_MATERIALS = MATERIALS.filter(
  (m) => m.id !== 'matte_white' && m.id !== 'standard_white'
);

export function materialById(id: MaterialId): Material {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];
}
