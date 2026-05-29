# Mebelchi — UI v1

Mobile UI shell built per `HANDOVER_UI_V1.md` and `10_UI_PRINCIPLES.md`.

Expo SDK 54 · React Native 0.81 · TypeScript 5.9 strict · three.js + R3F · Zustand · expo-router.

This sprint is **UI only**, wired to mock data. The real DXF / drilling / hardware
engines live in the parent project and will be wired in later sprints.

---

## Setup

```bash
cd mebelchi-app
npm install            # or yarn / pnpm
npx expo install --fix # aligns Expo-aware package versions to SDK 54
```

If `npm install` fails on a specific package (e.g. SDK version mismatch),
`npx expo install --fix` should resolve it.

### Run on device

```bash
npx expo start         # opens dev menu — scan QR with Expo Go app
npx expo start --android
npx expo start --ios
```

> Expo Go on the device is the fastest path. For native modules not in
> Expo Go (none in this sprint), an EAS development build is needed.

### Typecheck

```bash
npm run typecheck
```

---

## Project structure

```
mebelchi-app/
├── app/                          # expo-router file-based routes
│   ├── _layout.tsx               # root: providers, gesture root, status bar
│   ├── index.tsx                 # Splash (800ms → /home or /setup)
│   ├── home.tsx                  # Home: recent projects + new kitchen CTA
│   ├── setup.tsx                 # Setup wizard (one-time)
│   ├── settings.tsx              # Settings (shop, language, version)
│   └── studio/[projectId]/
│       ├── index.tsx             # Studio editor (the 80% — stub for Day 2-7)
│       └── lock.tsx              # Lock screen / quote
│
└── src/
    ├── types/ui.ts               # canonical UI types (port of UI_TYPES.ts)
    ├── store/uiStore.ts          # Zustand store — full UIStore impl
    ├── mocks/
    │   ├── materials.ts          # 6 facade materials
    │   ├── projects.ts           # 3 sample projects
    │   └── variants.ts           # variant generator (stub — port from
    │                             #   mebelchi_studio.html in Day 3)
    ├── lib/
    │   ├── tokens/               # design tokens (colors, type, shadows, ...)
    │   └── pricing.ts            # mock price formula
    └── components/
        ├── shared/Pill.tsx
        ├── home/                 # ProjectCard, NewKitchenButton
        ├── setup/                # WizardField, WizardChoice
        └── studio/               # WallPill, PriceBlock, ViewToggle,
                                  #   VariantDots, AdjacencyWarning,
                                  #   StudioBottomBar, Canvas3DPlaceholder
```

---

## What works (Day 1 — this commit)

- ✅ Navigation: Splash → Setup (first run) → Home → Studio → Lock
- ✅ Setup wizard saves to store (shop name, supplier, thickness, hardware brand)
- ✅ Home shows 3 mock projects + "Новая кухня"
- ✅ Studio chrome: wall pill (cycles 1200–3000mm), price block (live), 3D/2D toggle
- ✅ Variant dots + variant counter cycle
- ✅ Adjacency warning (sink-next-to-stove detection)
- ✅ Bottom bar: material button stub, save → Lock, variant counter
- ✅ Lock: hero parallax, breakdown (ЛДСП / Фурнитура / Кромка / Работа),
  use bar, share buttons
- ✅ Language toggle in Settings (RU/UZ)
- ✅ Design tokens fully wired (colors, type, shadows, radii, spacing)
- ✅ Zustand store with all actions per UI_TYPES.ts

## What's stubbed (Day 2-7)

| Day | Work |
|-----|------|
| 2 | R3F Canvas wrapper, floor + walls + camera, single cabinet rendering |
| 3 | Full kitchen rendering: all cabinet types, worktop, uppers, sink, stove, shelves |
| 4 | Raycaster hit priority, selection state, NFS camera tween, selection pill |
| 5 | Material drawer (bottom sheet), per-cabinet overrides, variant cycling polish |
| 6 | 3D/2D toggle camera animation, grid overlay, lock hero shot |
| 7 | Haptics, toasts, IBM Plex fonts, perf testing on real Android |

The current `Canvas3DPlaceholder.tsx` is intentionally a styled stub that
already responds to store changes (wall, variant, material) — replace it
with the real R3F Canvas in Day 2.

---

## Adding IBM Plex fonts (Day 7)

```bash
npm i @expo-google-fonts/ibm-plex-sans @expo-google-fonts/ibm-plex-mono
```

In `app/_layout.tsx`, use `useFonts`:

```ts
import {
  useFonts,
  IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';

const [loaded] = useFonts({
  IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold,
  IBMPlexMono_400Regular, IBMPlexMono_500Medium,
});
if (!loaded) return null;
```

Then in `src/lib/tokens/typography.ts` set `FONTS`:

```ts
sans:         'IBMPlexSans_400Regular',
sansMedium:   'IBMPlexSans_500Medium',
sansSemibold: 'IBMPlexSans_600SemiBold',
mono:         'IBMPlexMono_400Regular',
monoMedium:   'IBMPlexMono_500Medium',
```

---

## Reference

- `../files (3)/HANDOVER_UI_V1.md` — full sprint brief
- `../files (3)/10_UI_PRINCIPLES.md` — locked UI design contract
- `../files (3)/UI_TYPES.ts` — canonical types (already ported to `src/types/ui.ts`)
- `../files (3)/mebelchi_studio.html` — boss's reference prototype (visual benchmark)
- `../-s 0.1 Stack.md` — tech stack summary
