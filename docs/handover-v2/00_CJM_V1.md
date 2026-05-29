# 00 — Mebelchi Customer Journey Map v1.0

**Version:** 1.0
**Status:** SACRED — supersedes all prior CJM fragments. Modification protocol matches `06_CONVENTIONS.md`.
**Owner:** Oppoq
**Reviewers:** Saidislom, brother, Romchi CTO mentor
**Date:** May 2026

---

## What this document is

The master pipeline from "customer calls the mebelchi" to "drilled panels loaded on the truck." 30 steps grouped into 6 phases. Every feature in Mebelchi V1 maps to a step in this document. Any feature that doesn't map to a step here is out of scope.

Companion documents that depend on this one:
- `06_CONVENTIONS.md` — data conventions (kerf, thickness defaults, sheet sizes)
- `10_UI_PRINCIPLES.md` — gesture vocabulary, NFS camera, atomic verbs
- `HANDOVER_UI_V2.md` — the build brief for Saidislom
- `UI_TYPES_V2.ts` — TypeScript contracts

---

## The 6 phases at a glance

| Phase | Name | Duration | Who | Mood |
|---|---|---|---|---|
| A | Discovery & Measurement | 0–60 min | Mebelchi at site | Investigative |
| B | Layout | 5–15 min | Mebelchi + customer | Playful |
| C | Configuration | 15–45 min | Mebelchi (customer may watch) | Decisive |
| D | Engineering | 10–30 min | Mebelchi alone | Technical |
| E | Cost & Optimization | 5 min | Mebelchi alone | Financial |
| F | Manufacture Handoff | 2 min + days of downstream | Mebelchi + workshop | Ceremonious |

**Hard rule:** the UI must enforce phase boundaries. A user in Phase B cannot see Phase D controls. The user moves forward by completing a phase, not by switching tabs. Going back is allowed but costs a confirmation prompt for Phase B → A and Phase D → B.

---

## Grading legend

- 🔴 **Vital for V1.** Cannot ship without it.
- 🟡 **High-value, V1 if budget allows.** Otherwise V1.5.
- ⚪ **Nice, V2 or later.** Document it now, don't build it now.

---

## PHASE A — Discovery & Measurement

The mebelchi arrives at the customer's apartment, measures the kitchen, captures constraints. Today this happens on paper. V1 doesn't ship a full AR room scanner but DOES need the constraint capture step.

### Step 1 — Site measurement 🟡 V1.5

The mebelchi enters validated dimensions manually. V1 ships with the wall-pill input from prior prototypes. V1.5 adds a guided measurement helper (3 photos + tap-along-wall).

**V1 scope:** single rectangular wall, length 1200–6500mm, height 2400/2500/2600/2700/3000mm.
**Out of scope:** L-shape, U-shape, non-rectangular rooms (V2).
**Out of scope:** AR scanning, LiDAR (V3+).

### Step 2 — Constraints capture 🔴 V1

The room has features that constrain layout: window positions, door positions and swing direction, ceiling height, gas pipe location, water inlet, drain stack, electrical outlets, ventilation duct. Every Tashkent kitchen has at least 4 of these.

**V1 scope:** the user enters a simplified constraint set as a one-time step at project creation:
- Window position (X distance from left corner) + width
- Door position + swing side + width
- Gas line position (X distance from corner)
- Drain stack position
- Ceiling height (default 2600mm)
- Has ventilation hood vent: yes/no
- Floor levelness: assumed flat (V2 adds slope compensation)
- Wall plumbness: assumed plumb (V2 adds error tolerance)

**UI:** after wall length is set, a wizard-like screen shows a top-down wall strip with draggable markers for each constraint. Default values pre-populated to "no window, no door, no gas line on this wall." Mebelchi adjusts; defaults stay if irrelevant.

**Hard rule:** layout templates in Phase B must respect Phase A constraints. Sink cannot snap to a position where there's no drain stack within 800mm. Stove cannot land where there's no gas line within 1500mm. The constraints engine drives the variant generator.

---

## PHASE B — Layout

The customer is in the room. The mebelchi shows variants. The customer picks. This is the playful phase.

### Step 3 — Wall geometry 🔴 V1

Already in the prototype. Tappable wall pill cycles 1200–3000mm in 300mm steps, plus a numeric input for non-standard sizes.

### Step 4 — Anchor placement 🟡 V1.5

The sink/stove/fridge anchor positions are derived automatically from Phase A constraints in V1. The user does not manually drag anchors in V1. V1.5 adds manual override drag.

**V1 default behavior:** the variant generator places sink within reach of drain stack, stove within reach of gas line, fridge in a corner if wall ≥ 2400mm.

### Step 5 — Template swipe 🔴 V1

Already in the prototype. Multiple generated layouts per wall+constraint combination. Swipe to cycle. Dots indicator.

**V1 scope:** 3–5 variants per layout. Generator produces them deterministically from wall length + constraint set.

### Step 6 — Customer confirmation checkpoint 🔴 V1

After the customer is happy with a variant, the mebelchi taps "Показать клиенту целиком" — UI chrome fades, camera does the hero parallax, the customer says "да хорошо" verbally, the mebelchi taps "Клиент согласен" — app moves to Phase C.

**Vital because:** locks the layout psychologically. Mebelchi can now do 30 minutes of engineering work without fear of customer restart. If customer later says "I want a different layout," mebelchi has the timestamp + screenshot proof of agreement.

**V1 scope:** screenshot saved to project. No customer signature in V1 (V2 adds touch signature).

**UI:** big primary button "Показать клиенту" at the end of Phase B. Tapping enters preview mode. Below it: "Клиент согласен — продолжить" button (active only after preview mode entered).

---

## PHASE C — Configuration

The layout is locked. The mebelchi (alone or with customer present) configures each cabinet. This is the longest phase by time.

### Step 7 — Per-cabinet type swap 🔴 V1

Already in the prototype. Tap a cabinet → it cycles through types (door / drawer / open shelf / sink / stove). Constrained by Phase A — a sink cabinet cannot move out of drain-stack range.

### Step 8 — Per-cabinet width adjustment 🔴 V1

Already in the prototype. Selection pill with −/+ buttons, 50mm steps, neighbors reflow.

### Step 9 — Drawer interior design 🟡 V1.5

For drawer-type cabinets, the user picks: 2 drawers / 3 drawers / 4 drawers, soft-close yes/no, deep drawer at bottom yes/no. V1 ships with defaults (3 drawers, soft-close on, deep bottom). V1.5 adds the configuration UI.

**V1 default:** 3-drawer stack, Hettich soft-close runners, top drawer 150mm deep, middle 200mm, bottom 300mm.

### Step 10 — Door style 🔴 V1

Already in the prototype. Tap on selected cabinet's door → cycles flat / shaker / grooved.

### Step 11 — Handle selection 🔴 V1

Already in the prototype. Tap on selected cabinet's handle → cycles bar / knob / inset.

### Step 12 — Appliance integration 🟡 V1.5

The dishwasher / fridge / oven / microwave / hood. Each has a model size (45cm or 60cm dishwasher; 600 or 800mm oven; 600 or 900mm hood). V1 ships with default sizes; V1.5 adds the chooser.

**V1 default:** 60cm dishwasher, 600mm oven under stove, 600mm hood above stove, 600mm fridge column (if column exists).

### Step 13 — Global material palette 🔴 V1

Already in the prototype. Bottom drawer with 6 palettes.

### Step 14 — Per-cabinet material override 🔴 V1

Already in the prototype. The "Figma fill-color" moment. Two-tone kitchen in two taps.

### Step 15 — Auxiliary material selection 🟡 V1.5

Back panel material (default ХДФ 3mm), shelf material (default ЛДСП 16mm matching carcass), drawer bottom material (default ХДФ 3mm), internal divider material (default ЛДСП 16mm).

**V1 ships defaults invisible.** V1.5 exposes a single screen in Phase C end where each can be overridden.

---

## PHASE D — Engineering

The killing feature. Bazis has 20 years of accessories library; Mebelchi ships 10–30 popular ones with manufacturer-correct drilling. This phase is where mebelchi forgets he was using a "simple app" and starts seeing what's underneath.

### Step 16 — Hardware selection (hinges, slides, supports) 🔴 V1

Per-cabinet hardware override. Default is shop-level (set in setup wizard: Blum / Hettich / Boyard). User can tap a door → see hinge options → pick a specific model. Drilling marks update in the X-ray view instantly.

**V1 catalog scope:** 12 fittings.
- 3 hinge brands × 2 overlay types (full / half) = 6 SKUs
- 2 drawer slide brands × 2 lengths (450 / 500mm) = 4 SKUs
- 2 shelf support styles = 2 SKUs

This is enough to cover 90% of Tashkent kitchens. V2 expands to 30–50.

### Step 17 — Custom hardening panels 🔴 V1

**Non-negotiable.** Every Tashkent master has signature reinforcements. The app must let him add custom panels (drawn as rectangles in X-ray view) with material spec and joint type.

**V1 scope:**
- Tap "+ Усилитель" in X-ray view → enters sketching mode
- Tap two corners on any cabinet face → rectangle becomes hardening panel
- Material default ЛДСП 16mm (overridable)
- Joint default screws (overridable to clamex / cam)
- Save 3 of his signature panels as personal presets

### Step 18 — Edge banding (kromka) configuration 🔴 V1

**Critical feature you flagged.** The user does not configure kromka per edge in V1 — that's overwhelming. Instead, the app applies smart defaults that the user can override per cabinet at the palette level.

**V1 smart default rule:**
- All visible-facing edges (front-of-base-cabinet top + side-panel front edge + bottom of upper cabinet + facade perimeter): 2mm PVC kromka matching facade color
- All hidden edges (back, top of base where worktop covers, bottom of base where plinth covers, all internal): 0.4mm PVC matching carcass color

**V1 override:** the material drawer has a small "Кромка" subsection with two toggles:
- "Видимая кромка": 2mm / 1mm / 0.8mm (default 2mm)
- "Цвет кромки": "под фасад" / "под корпус" / "контраст" (default "под фасад")

**Dimensional math:** every panel cut size = nominal − sum of kromka deltas per edge. Encoded in `06_CONVENTIONS.md`. Automatic.

**Cost math:** total kromka cost = sum of (edge length × per-meter rate per thickness). Displayed in real-time price ticker. **The save-money moment** appears here: "Если задние стороны не кромить — экономия 47 000 сум." One tap accepts.

### Step 19 — Structural benchmark 🟡 V1.5

Auto-check that runs continuously in Phase D. Red highlights on cabinets that fail deflection check (shelf > 800mm without center support, full-extension drawer > 600mm without Blum-grade runners, cabinet wider than 1000mm without back brace).

**V1 ships green-on-everything** (no actual physics, just visual indicator). V1.5 adds real beam-deflection math from the r4 research.

### Step 20 — Auxiliary CNC operations 🔴 V1

Grooves for back panel insertion (8mm deep, 4mm from rear edge), drill patterns for confirmats (7mm holes for cam-and-dowel joinery), shelf-pin hole columns (5mm holes at 32mm spacing).

**V1 ships full automatic generation from cabinet geometry.** User never sees this step explicitly — it's invisible computation. The X-ray view in Step 17 shows the resulting drill marks. User can override individual drill positions in V1.5 (currently they're locked).

---

## PHASE E — Cost & Optimization

The money phase. Real-time numbers, save-money advisor.

### Step 21 — Real-time sheet utilization 🔴 V1

Live indicator showing "ЛДСП: 3.2 листа · использование 87%". Updates on every change. Tap to expand → see the nesting diagram.

**V1 scope:** the nesting algorithm runs server-side or in a WebWorker (don't block UI thread). Cache aggressively; only recompute when geometry changes.

### Step 22 — Smart material advisor 🔴 V1

Yellow card that appears at end of Phase D / start of Phase E: "Сэкономьте 340 000 сум — фасады в матовом белом, корпус в обычном". One-tap accept.

**V1 advice rules** (3 only):
1. Two-tone (cheap carcass + expensive facade) when current is single expensive material
2. Skip kromka on hidden back edges
3. Use 16mm instead of 18mm if cabinets are <800mm wide (most are)

V1.5 expands to 10+ rules.

### Step 23 — Quote generation 🔴 V1

Itemized customer-facing PDF:
- Layout + 3D render (hero shot from Phase B Step 6)
- Total price as headline
- Line items: ЛДСП / кромка / фурнитура / appliances / работа / доставка / установка / margin
- Validity period (default 14 days)
- Mebelchi contact card

**V1 scope:** PDF generated client-side, shared via Telegram/WhatsApp/Save-to-files.

---

## PHASE F — Manufacture Handoff

The CNC moment. Every interaction must build confidence. The user is about to risk a 50,000 сум sheet on a 30M сум machine.

### Step 24 — Pre-flight checklist 🔴 V1

Auto-runs before "Отправить на ЧПУ" activates. Each item shows green/red:

- ☑ Все панели имеют размеры (no missing dimensions)
- ☑ Все петли имеют точки сверления (every hinge has drill pattern)
- ☑ Использование листа ≥ 75% (nesting efficiency floor)
- ☑ Все шкафы прошли benchmark (no red structural warnings)
- ☑ Кромка указана для всех видимых краев
- ☑ Клиент согласовал внешний вид (Phase B Step 6 confirmation exists)

If any item is red, the export button is disabled with a tooltip explaining why.

### Step 25 — DXF / MPR / CIX export 🔴 V1

Already in the existing codebase. The UI calls into Saidislom's existing export engine. No new logic in V1.

### Step 26 — Cutting plan PDF 🔴 V1

For the saw operator who doesn't use the app. Shows nesting diagram with every cut labeled, panel dimensions, sheet origin marks. One sheet per page.

### Step 27 — Drilling spec PDF 🔴 V1

For the CNC operator. Per-panel drill diagram with hole positions, depths, diameters. Hardware brand referenced ("Blum CLIP top BLUMOTION, Ø35×13mm cup").

### Step 28 — Edge banding worksheet PDF 🔴 V1

For the kromka operator. Lists every panel with which edges get which thickness/color kromka. Visual diagram per panel.

### Step 29 — Assembly instruction PDF 🟡 V1.5

For the assembler at the workshop. Step-by-step assembly order, hardware count per step, fastener position diagrams.

**V1 ships a simplified version:** one-page "Сборка" sheet with bullet-list assembly order (carcass first, doors last). V1.5 generates the per-step diagrams.

### Step 30 — Pack list + delivery manifest 🟡 V1.5

What goes into which box, what tools the installer needs, what the customer should prepare.

**V1 ships a simple "Список упаковки" with cabinet count + total weight estimate.** V1.5 generates the full manifest.

---

## What's out of scope for V1 (documented now, don't build)

These exist in the full pipeline but are explicitly deferred:

| # | Feature | Defer to |
|---|---|---|
| - | AR room scanner / LiDAR | V3+ |
| - | L-shape, U-shape, non-rectangular rooms | V2 |
| - | Customer touch signature on Phase B confirmation | V2 |
| - | Full drawer interior config UI | V1.5 |
| - | Appliance model chooser | V1.5 |
| - | Auxiliary material override UI | V1.5 |
| - | Real structural physics benchmark | V1.5 |
| - | Manual drill position override | V1.5 |
| - | Expanded hardware catalog (30+ SKUs) | V2 |
| - | Order management / contracts / invoicing | V2 |
| - | Inventory / warehouse | V3 |
| - | Pricelist manager for supplier updates | V3 |
| - | Showroom / interior visualization renders | V2 |
| - | V-Ray photorealistic rendering | V2 |
| - | Multi-user collaboration | V3 |
| - | Cloud sync | V2 |
| - | Customer-facing self-serve mode (without mebelchi) | V3 |

---

## Modification protocol

This document is sacred. To change anything:

1. Telegram message: "Предлагаю изменить 00_CJM_V1.md, шаг N: [причина]"
2. Explicit "да" from Oppoq + at least one other (Saidislom or brother)
3. Bump version, add changelog entry
4. Romchi CTO mentor reviews any change to phase boundaries or vital scope

---

## Changelog

- **v1.0 (May 2026):** Initial lock based on research synthesis of Bazis modules, industrial cabinet manufacturing pipeline, IKEA Home Planner workflow, and kromka math. 30 steps in 6 phases.

---

## Open questions for field validation (do not block V1)

Field research needed to validate these assumptions before V2:

1. Tashkent mebelchi: which 12 hardware fittings actually dominate?
2. Kromka decision pattern: do shops universally use 2mm visible / 0.4mm hidden, or is there variation?
3. Customer confirmation: how does the mebelchi do it today? Paper? Phone photo? Nothing formal?
4. Structural failure modes: what breaks most often in delivered kitchens?
5. Phase B duration in real shops: is 5–15 minutes right, or 30+?
6. Phase C duration: is 15–45 minutes right, or does it actually take 2+ hours?

If field research changes any answer significantly, treat it as a v1.0 → v1.1 modification.
