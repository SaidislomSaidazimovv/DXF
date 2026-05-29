# Mebelchi UI v2 — Handover to Saidislom

**Supersedes:** `HANDOVER_UI_V1.md` (delete the prior version)
**Companion docs:** `00_CJM_V1.md` (the sacred pipeline), `10_UI_PRINCIPLES.md`, `UI_TYPES_V2.ts`
**Owner:** Oppoq
**Status:** Greenlit. Build directly against this.
**Timeline:** 3 weeks (15 working days)

---

## What changed since v1

The v1 handover assumed a 1-phase product (the layout editor). Field research and analysis of Bazis modules + industrial cabinet manufacturing pipeline + IKEA workflow surfaced a 6-phase product. Phases A, D, E, F barely existed in v1. The studio prototype Oppoq tested only covered Phase B + half of Phase C.

V2 covers the whole pipeline, with most of Phase D/E/F real and the rest mocked credibly. The demo we showed investors was the entry. This is the product.

---

## 0. What this is, what this isn't

**This is** the full V1 UI shell wired to mock data for Phases A through F. The user can walk from "new project" through to "send to CNC" with every screen feeling real. Some logic is mocked (variant generator, nesting algorithm, structural benchmark, smart material advisor) but the screens, gestures, animations, and outputs all exist and feel finished.

**This is not:**
- A rewrite of the export engine (DXF/MPR/CIX) — that exists in your codebase already
- Cloud sync, accounts, multi-user
- Real LiDAR or AR measurement
- Real nesting algorithm (V1 uses a stubbed approximation that matches your existing engine's outputs for the demo kitchens)

**Hard rule:** the UI shell is finished BEFORE any of the real engines get integrated. Phase F Step 25 (DXF export) calls into your existing engine on day 14; before day 14 it returns a hardcoded mock DXF file. This separation matters because Oppoq signs off on visual feel before logic is attached.

---

## 1. Tech stack — confirmed, no changes

Existing stack from the May 2026 summary. Nothing new to install.

| Layer | Tool |
|---|---|
| Platform | Expo SDK 54 + RN 0.81 |
| Language | TypeScript 5.9 strict |
| 3D | three.js 0.184 + @react-three/fiber 9 + expo-gl 16 |
| State | Zustand 5 |
| Bottom sheets | @gorhom/bottom-sheet 5 |
| Gestures | react-native-gesture-handler 2 |
| Animation | react-native-reanimated 4 |
| 2D / SVG | react-native-svg 15 |
| Persistence | expo-sqlite 16 (UI store) |
| PDF generation | expo-print (already available in SDK 54) |
| Haptics | expo-haptics |
| Routing | expo-router 6 |

---

## 2. Routes and screens

```
/                                  splash → redirect
/home                              recent projects + new kitchen
/setup                             first-launch wizard
/settings                          shop config (gear from home)

/studio/[id]/phaseA                Discovery + measurement + constraints
/studio/[id]/phaseB                Layout (the variant swipe + confirm)
/studio/[id]/phaseC                Configuration (current studio editor)
/studio/[id]/phaseD                Engineering (X-ray view, hardening panels)
/studio/[id]/phaseE                Cost + advisor
/studio/[id]/phaseF                Lock + handoff
```

Each phase is its own route so the URL is a save point. Going back is `router.back()`. Going forward requires the phase's exit criterion (e.g., Phase B requires customer-confirmation; Phase F requires all 6 checklist items green).

**Phase transitions are visual events.** Background warms (Phase B beige) or cools (Phase D darker beige with grey accents). Chrome density increases as phases progress. The user feels they're moving from "showing the customer" to "doing the engineering" without being told.

---

## 3. Phase A — Discovery & Measurement

**Estimated build time:** 2 days

### Screen A.1 — Wall geometry

Same as existing prototype — wall pill, but enhanced with:
- Numeric override (tap the number → keypad → enter any value 1200–6500mm, rounds to nearest 50mm on commit)
- Wall height field (default 2600mm, choices 2400/2500/2600/2700/3000)

### Screen A.2 — Constraints capture

After wall is set, show a top-down wall strip (2D SVG, full-width, ~120px tall). Draggable markers for:

- **Window** (yellow): X position + width, snaps to 50mm grid
- **Door** (orange): X position + width + swing side (icon flips)
- **Gas line** (red): X position only, single point
- **Drain stack** (blue): X position only
- **Outlets** (gray): up to 4, X positions
- **Hood vent** (purple): X position, only if there will be uppers above

Marker palette at bottom: drag a marker onto the wall to add. Tap a marker to delete. Tap-and-hold to edit dimensions in a small popover.

**Default state:** no markers. Mebelchi adds what exists on this wall. Most kitchens have 0–2 markers per wall.

**Exit criterion:** "Готово" button is always active. Constraint markers are optional. If absent, the variant generator falls back to "no constraints" rules.

### Backing data
- `constraints: Constraint[]` in the UI store (see `UI_TYPES_V2.ts`)
- Constraints persist with the project to SQLite

---

## 4. Phase B — Layout

**Estimated build time:** 3 days (mostly already exists in current studio prototype)

This is the current `mebelchi_studio.html` aesthetic ported to real RN/R3F. Keep everything from the prototype:
- Wall pill at top
- Price block at top-right
- Variant dots
- 3D / 2D toggle
- Bottom: material button + save + variant counter
- Selection pill on cabinet tap
- Horizontal swipe to cycle variants
- 6-palette drawer

### What's NEW in Phase B for v2

**The customer confirmation checkpoint** (Step 6 of CJM):

After the user has played with variants, a third button appears in the bottom bar (left of "Сохранить"): **"Показать клиенту"**. Tapping it:

1. UI chrome fades to 0 over 320ms
2. Camera does a slow parallax (8-second loop, 2.0/1.4/3.0 → 2.4/1.55/3.2 → back) — Live Home 3D style
3. A single tappable "← Закрыть" pill appears top-left after 1s
4. A second pill appears bottom-center after 3s: **"Клиент согласен — продолжить"** (primary, large)

When the customer says "yes" verbally and the mebelchi taps the green button:
- A screenshot is captured to project storage with timestamp
- Phase B is marked complete in the project state
- Auto-navigates to `/studio/[id]/phaseC`

If the mebelchi taps "← Закрыть" — returns to editing.

**This is the screenshot Oppoq needs for audit trail when customer later disputes.**

---

## 5. Phase C — Configuration

**Estimated build time:** 2 days (mostly inherits Phase B's UI)

Phase C is Phase B's editor with extra controls unlocked. The user can now:

- Cycle door style (existing)
- Cycle handle (existing)
- Cycle sink type (existing)
- Cycle stove type (existing)
- Change worktop material (existing)
- Set per-cabinet material override (existing — the "Figma fill-color" moment)
- **NEW: Edit drawer count for drawer cabinets** (V1.5 — ship with defaults invisible)
- **NEW: Auxiliary materials selector** (one screen at end of Phase C — V1.5)

### Phase C exit

Bottom bar's "Сохранить" button changes label to **"К инженерии →"**. Tapping it navigates to Phase D.

No formal checkpoint — Phase C is fluid editing. The user goes back to B (with confirmation prompt) or forward to D freely.

---

## 6. Phase D — Engineering (the killing feature)

**Estimated build time:** 4 days. This is the hardest phase. Don't underestimate.

### The aesthetic shift

Background darkens slightly. Bottom bar background becomes near-black with light text. Selection pill uses sharper corners (radius 8px instead of 18px). Typography shifts to more monospace for measurements. The user feels he's in the workshop now.

### Screen D.1 — X-ray view (default for Phase D)

Same 3D scene as Phase C, but:
- Facade opacity drops to 35%
- Carcass interior structure renders (sides, top, bottom, back, shelves)
- Drilling marks render as small red dots on side panels (32mm system)
- Hinge positions render as small green discs
- Drawer slides render as gray rails

Toggle button top-right: **"РЕНТГЕН"** / **"ВИД"** — switches between X-ray and solid.

### Screen D.2 — Hardware override (inside selection pill)

When a cabinet is selected in Phase D, the selection pill expands with a new section:

**ФУРНИТУРА**

- Hinge brand: Blum / Hettich / Boyard (3 chips)
- Hinge overlay: Полный / Полу / Накладной (3 chips)
- Drawer slide brand: Blum / Hettich (if drawer cabinet)
- Drawer slide length: 450mm / 500mm

Changing any of these updates drill positions in the X-ray view immediately. Use the existing hardware catalog from your codebase — V1 exposes only 12 SKUs (per CJM Step 16).

### Screen D.3 — Custom hardening panels (the non-negotiable)

Floating button top-right (below the X-ray toggle): **"+ Усилитель"**.

Tapping it enters sketching mode:
- All cabinets dim to 50% opacity
- A small instruction toast: "Tap on a cabinet face, then drag to sketch rectangle"
- The user taps a cabinet face → that face highlights
- The user drags from corner to corner → a rectangle preview appears
- On release, a small popover appears at the rectangle:
  - Material (default ЛДСП 16mm, dropdown to override)
  - Joint type (default screws, choices: clamex / cam / screws)
  - Label (text input, default empty — for the master's personal naming)
  - Save / Cancel
- On save: rectangle becomes a real hardening panel mesh, dimensions added to cut list

**Personal presets:** below the "+ Усилитель" button, three small slots labeled 1/2/3. Long-press on a saved hardening panel → save it as a preset (replaces slot 1/2/3 in order). Tap a preset slot → loads that preset's dimensions and material into the next sketch.

This single feature is what makes serious mebelchi switch from Bazis. Build it carefully.

### Screen D.4 — Structural benchmark (V1.5, ship green-stub)

For V1: every cabinet gets a small green dot in its top-right corner indicating "passed." No actual physics runs. The dot is purely visual placeholder.

For V1.5: real beam deflection math runs continuously. Red dots appear on cabinets with sagging risk. Tap a red dot → tooltip explains ("Shelf 1200mm too wide for 16mm material at 30kg load — add center support").

V1 ships the visual + a "Все шкафы прошли проверку" status line in the bottom info area. V1.5 makes it real.

### Phase D exit

Bottom bar primary button changes to **"К расчёту →"** — navigates to Phase E.

---

## 7. Phase E — Cost & Optimization

**Estimated build time:** 2 days

### Screen E.1 — Real-time breakdown

Replaces the simple price pill at top-right with a fuller cost panel taking the upper third of the screen:

```
СТОИМОСТЬ КОМПЛЕКТА
12 480 000 сум

  ЛДСП 16мм                  3.2 листа · 1 216 000
  Кромка ПВХ 2мм             94 м · 1 880 000
  Кромка ПВХ 0.4мм           62 м · 248 000
  Фурнитура Hettich          1 420 000
  Усилители                  3 шт · 380 000
  Мойка + смеситель          850 000
  Плита индукционная         1 800 000
  Работа цеха                4 686 000

ЛИСТ ИСПОЛЬЗОВАН НА 87%
```

Each line is tappable to expand into a sub-breakdown.

The 3D scene shrinks into the lower two-thirds, still interactive.

### Screen E.2 — Smart material advisor

Yellow card slides in from below after 1.5s on Phase E load. Single advice (the highest-impact one):

```
💡 СОВЕТ
Сделайте фасады в матовом белом, а корпус — в стандартном.
Экономия 340 000 сум на одной кухне.

[ Применить ]    [ × ]
```

If user taps "Применить", the global material splits: facade material → "matte_white", carcass material → "standard_white". The breakdown updates. Toast: "Сэкономлено 340 000 сум".

If user dismisses, card disappears with 240ms slide-out.

V1 ships with 3 advice rules (per CJM Step 22):
1. Two-tone split (facade vs carcass)
2. Skip 2mm kromka on hidden back edges
3. Use 16mm instead of 18mm for cabinets under 800mm

### Phase E exit

Bottom bar primary button: **"К чертежам →"** — navigates to Phase F.

---

## 8. Phase F — Manufacture Handoff (the ceremony)

**Estimated build time:** 2 days

### The aesthetic shift again

Background becomes near-white. Typography becomes more rectilinear (Plex Mono prominent). Less rounded UI. This is the professional moment.

### Screen F.1 — Pre-flight checklist

Top of screen: large header **"ПРОВЕРКА ПЕРЕД ЧПУ"**

Below: 6 items, each with state circle (green ✓ / red ✗) and label:

```
✓ Все панели имеют размеры
✓ Все петли имеют точки сверления
✓ Использование листа 87% (минимум 75%)
✓ Все шкафы прошли benchmark
✓ Кромка указана для всех видимых краёв
✓ Клиент согласовал внешний вид (24 мая 2026, 14:32)
```

If any item is red, the export button below is disabled with greyed-out style.

Below the checklist: thumbnail strip of the 5 PDFs that will be generated (cutting plan, drilling spec, edge banding worksheet, assembly instructions, pack list). Each thumbnail is tappable for preview.

### Screen F.2 — The export ceremony

Bottom: a large dark button **"ОТПРАВИТЬ НА ЧПУ"**.

When tapped:
1. Button shows spinner + "проверка..." for ~600ms (artificial — feels professional)
2. Spinner replaces with white checkmark, button becomes green for 300ms
3. Page transitions to F.3

### Screen F.3 — Готово

Clean centered layout:

```
                ✓

      ГОТОВО · 3 ФАЙЛА СГЕНЕРИРОВАНЫ

         kitchen_2400.dxf
         kitchen_2400.mpr
         kitchen_2400.cix

  + 5 PDF документов
  для оператора и сборщика

  [ Поделиться через Telegram ]
  [ Сохранить в папку ]
```

Below in small text:
```
Сгенерировано Mebelchi v1.0 · сборка 0526
checksum: 7a3f9b21
```

This is the provenance/professional-trust footer per CJM Step 28.

### Phase F backend wiring

This is where Saidislom's existing export engine attaches. The UI calls the engine on day 14. Until then, the buttons return hardcoded mock files (Saidislom has 3 sample DXF files from prior testing — use those).

---

## 9. Other screens (kept brief)

### Splash, Home, Setup, Settings

Unchanged from `HANDOVER_UI_V1.md` v1 spec. Build these on day 1 of the sprint — they're warm-up.

---

## 10. Acceptance criteria — Oppoq signs off when all pass

**Phase A**
- [ ] Wall length input accepts 1200–6500mm with 50mm snap on commit
- [ ] Constraints can be added, dragged, deleted on the 2D wall strip
- [ ] State persists to SQLite across app restart

**Phase B**
- [ ] Camera tween 480ms ± 30ms (unchanged from v1)
- [ ] Per-cabinet material swap < 100ms (unchanged)
- [ ] Customer confirmation creates a screenshot with timestamp
- [ ] After confirmation, Phase B is marked complete in project state
- [ ] Going back from Phase C → B clears the confirmation (with prompt)

**Phase C**
- [ ] All Phase B interactions still work
- [ ] Bottom bar button label is "К инженерии →"

**Phase D**
- [ ] X-ray toggle works, facade opacity drops to 35%, drill marks visible
- [ ] Hardware brand/model changes update drill marks in real-time
- [ ] Custom hardening panel sketching mode works: tap face → drag rectangle → save
- [ ] 3 personal preset slots save/load correctly
- [ ] Green status dot on every cabinet (V1.5 makes it real)

**Phase E**
- [ ] Cost breakdown shows all 8+ line items
- [ ] Each line tappable for sub-breakdown
- [ ] Smart advisor card appears after 1.5s
- [ ] Tapping "Применить" actually updates the global state and breakdown

**Phase F**
- [ ] Pre-flight checklist computes correctly (all 6 items)
- [ ] Export button disabled if any item red
- [ ] Export button triggers 600ms spinner + checkmark animation
- [ ] F.3 screen shows mock file list and provenance footer

**Global**
- [ ] Cold start < 2s on mid-range Android
- [ ] No phase-skipping (Phase D requires Phase B confirmation)
- [ ] Going backward warns user with confirmation prompt
- [ ] All Russian text renders correctly
- [ ] Demo runs end-to-end (Phase A through F) in < 8 minutes

---

## 11. Timeline (15 working days)

| Day | Work |
|---|---|
| 1 | Splash, Home, Setup, Settings, Zustand store v2, design tokens |
| 2–3 | Phase A: wall geometry, constraints capture UI, SVG wall strip |
| 4–6 | Phase B: port existing studio prototype to real RN/R3F, customer confirmation flow |
| 7 | Phase C: inherits Phase B, adds drawer count + aux material defaults |
| 8–11 | Phase D: X-ray view, hardware override in selection pill, custom hardening panels (the hard part) |
| 12 | Phase E: cost breakdown panel, smart advisor card |
| 13–14 | Phase F: pre-flight checklist, export ceremony, F.3 готово screen, wire to existing export engine |
| 15 | Polish, haptics, real device testing, demo rehearsal |

Buffer is in Phase D (allocated 4 days; if you need 5, take from Day 15 polish).

---

## 12. What Saidislom can push back on

Five questions are negotiable. Anything else: build to spec.

1. Phase D camera: should orbit be allowed in X-ray mode, or stay locked NFS-style? (Default: stay locked.)
2. Custom hardening panel sketch input: 2-tap corners vs drag? (Default: drag.)
3. Smart advisor: 1 card at a time or stack of cards? (Default: 1 at a time, highest-impact.)
4. Pre-flight checklist: hard-block on red, or soft-warn? (Default: hard-block.)
5. F.3 готово screen: stays open until user navigates, or auto-redirects to home after N seconds? (Default: stays.)

---

## 13. Demo script for investors

The 90-second demo from v1 is now insufficient. The new demo is **8 minutes** and walks through all 6 phases. Saidislom rehearses with Oppoq before any meeting.

**Setup:** new project, mock customer "ул. Чиланзар 14, кв. 23".

1. **Phase A** (30s): wall 2400mm, drop a window marker at 800–1400mm, gas line marker at 1800mm. "Это окно и газовая труба. Софт будет учитывать их при размещении."
2. **Phase B** (90s): show variants generated respecting constraints. Sink is NOT in the window. Stove IS near the gas line. Swipe through 4 variants. Pick variant 2. Tap "Показать клиенту" — chrome fades, parallax starts. "Видите — это уже как настоящая 3D-визуализация для клиента." Tap "Клиент согласен".
3. **Phase C** (90s): show per-cabinet material override. Make a two-tone walnut + white kitchen in two taps. Change worktop. Tap stove → cycle to gas. "Один шкаф меняет цвет, остальные не трогаем."
4. **Phase D** (120s): "А теперь — то, что делает Базис, но мы делаем проще." Toggle X-ray. Tap a door → change hinge to Blum → drill points move. Add a custom hardening panel: tap rear face of sink cabinet → drag rectangle → save. "Это уникально. Каждый мастер добавит свои усилители."
5. **Phase E** (60s): show breakdown. Tap "ЛДСП 16мм" → expand. Show smart advisor card. Tap "Применить" → price drops 340K. "Это деньги, которые мастер кладёт в карман или передаёт клиенту."
6. **Phase F** (90s): pre-flight checklist (all 6 green). Tap "ОТПРАВИТЬ НА ЧПУ". Spinner. Checkmark. Готово screen with 3 file names. "В Базисе на это уходит 4 часа. У нас — 8 минут."

That's the demo. **Practice it. Keep it tight. The Phase F moment is the close.**

---

## 14. The point, restated

Mebelchi v1 is a 6-phase pipeline that takes a Tashkent mebelchi from "customer just called" to "DXF on the CNC" in under 30 minutes total work time, with output quality equal to Bazis at 1/200th of the licensing cost.

This is not a kitchen designer. It's a workshop automation tool. Every screen serves a step in the manufacturing pipeline.

Build the shell first, attach the engine second. Don't conflate them.

— Oppoq
