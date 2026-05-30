/**
 * Style presets — one tap sets the WHOLE kitchen's look (material + door
 * style + handle + worktop colour + faucet shape/finish), and clears any
 * per-cabinet overrides so the style applies uniformly. The master picks a
 * vibe; fine-tuning per element is still available afterwards.
 */
import type {
  MaterialId, DoorStyle, HandleType, FaucetStyle, FaucetFinish,
} from '@/types/ui';

export interface StylePreset {
  id: string;
  name: string;
  material: MaterialId;
  doorStyle: DoorStyle;
  handle: HandleType;
  worktop: number;        // hex worktop colour
  faucetStyle: FaucetStyle;
  faucetFinish: FaucetFinish;
  swatch: number;         // representative chip colour (hex)
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'scandi', name: 'Скандинавский',
    material: 'white_classic', doorStyle: 'flat', handle: 'bar',
    worktop: 0xdfd9c8, faucetStyle: 'arch', faucetFinish: 'chrome', swatch: 0xf6f3ea,
  },
  {
    id: 'modern_dark', name: 'Современный тёмный',
    material: 'anthracite', doorStyle: 'flat', handle: 'inset',
    worktop: 0x1f1f1d, faucetStyle: 'straight', faucetFinish: 'black', swatch: 0x2e2e30,
  },
  {
    id: 'classic', name: 'Классика',
    material: 'cream', doorStyle: 'shaker', handle: 'knob',
    worktop: 0xe8e4da, faucetStyle: 'arch', faucetFinish: 'chrome', swatch: 0xefe7d2,
  },
  {
    id: 'warm_wood', name: 'Тёплое дерево',
    material: 'oak_light', doorStyle: 'flat', handle: 'bar',
    worktop: 0x5a4a32, faucetStyle: 'arch', faucetFinish: 'chrome', swatch: 0xc4a575,
  },
  {
    id: 'loft', name: 'Лофт',
    material: 'graphite', doorStyle: 'glass', handle: 'bar',
    worktop: 0x8e8a83, faucetStyle: 'straight', faucetFinish: 'black', swatch: 0x55565a,
  },
  {
    id: 'sage', name: 'Зелёный шалфей',
    material: 'sage_green', doorStyle: 'shaker', handle: 'knob',
    worktop: 0xdfd9c8, faucetStyle: 'arch', faucetFinish: 'gold', swatch: 0x8b9479,
  },
  {
    id: 'navy_gold', name: 'Синий + золото',
    material: 'navy', doorStyle: 'shaker', handle: 'bar',
    worktop: 0xe8e4da, faucetStyle: 'pull', faucetFinish: 'gold', swatch: 0x2f3b52,
  },
  {
    id: 'pure_white', name: 'Белая матовая',
    material: 'snow_white', doorStyle: 'flat', handle: 'inset',
    worktop: 0xe8e4da, faucetStyle: 'pull', faucetFinish: 'chrome', swatch: 0xfbfbf8,
  },
];
