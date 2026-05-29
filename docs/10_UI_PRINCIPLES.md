# 10 — UI Principles

**Version:** 1.0
**Last updated:** May 2026
**Owner:** Oppoq
**Status:** SACRED — same modification rules as `06_CONVENTIONS.md`

---

## What this document is

The locked design contract for Mebelchi V1. Saidislom codes against this. The brother codes against this. Future designers code against this. If a UI decision is not in this document, it has not been made.

This document is the companion to `06_CONVENTIONS.md`. Where conventions govern how data flows between modules, this governs how interactions flow between the user and the data.

---

## The thesis in one sentence

The kitchen is the UI. Every interaction is reached by touching the object being changed, the camera physically moves to whatever is being edited, and no chrome persists except a price ticker and one primary action.

---

## 1. The Five Primary Inputs (the decision cascade) — LOCKED

Every kitchen Mebelchi will ever produce reduces to five user decisions. Everything else is derived, defaulted, or hidden.

| # | Decision | Type | Where the user provides it |
|---|---|---|---|
| 1 | Wall length(s) | Number | Tappable pill in header, default 2400mm |
| 2 | Anchor positions (sink / stove / fridge) | Spatial | Per-cabinet swap on tap (cabinet type cycle) |
| 3 | Material palette | Categorical (4 options) | Long-press → bottom drawer |
| 4 | Door style | Categorical (3 options) | Inside detail-dive on a cabinet (Stage 5) |
| 5 | Budget tier | Categorical (3 options) | Set once at shop setup, hidden after |

Everything else derives:
- Cabinet count, widths, depths, heights → derived from wall length + anchor positions
- Door splits → derived from width (>500mm gets 2 doors)
- Hinge type, drawer slide brand → derived from budget tier
- Edge banding color → derived from material (auto-match)
- Sheet size, kerf, grain rules → constants in `conventions.md`

**Rule:** Any new feature proposal must answer "which of the five inputs does this serve?" before it can be added. If it doesn't serve one of the five, it goes in the next-version backlog.

---

## 2. The Nine Atomic Verbs — LOCKED

Every gesture in the entire app must reduce to exactly one of these nine verbs. If a feature requires a tenth verb, that feature does not belong in V1.

| # | Verb | Gesture | Used for |
|---|---|---|---|
| 1 | **Look** | Passive view | The kitchen at rest |
| 2 | **Choose** | Horizontal swipe | Template variants, palette swatches |
| 3 | **Move** | Drag | Cabinet repositioning (V2 — out of scope for V1) |
| 4 | **Resize** | Drag edge or tap −/+ | Cabinet width, wall length |
| 5 | **Swap** | Tap cycle | Cabinet type (door ↔ drawer ↔ sink) |
| 6 | **Add** | Tap empty slot | Inserting a new cabinet (V2 — out of scope for V1) |
| 7 | **Remove** | Double-tap with confirm | Deleting a cabinet |
| 8 | **Inspect** | Pinch-zoom into cabinet | Detail dive (Stage 5) |
| 9 | **Lock** | Bottom primary button | Save, generate DXF, generate quote |

**Verbs explicitly forbidden in V1:** Configure, Adjust, Customize, Settings, Preferences, Setup, Calibrate, Edit properties, Modify, Set. These all collapse into Swap or Inspect when the interaction inversion is built correctly.

---

## 3. The Interaction Inversion — LOCKED

The standard CAD UI has: menu bar, tool palette, object inspector, property panel, status bar. Five layers of chrome around the actual work.

Mebelchi has exactly five persistent elements on screen at any time:

| Element | Position | Purpose |
|---|---|---|
| **The kitchen** (3D canvas) | Full viewport | The work itself |
| **Wall length pill** | Top-left | Primary input #1 |
| **Price ticker** | Top-right | The value, always live |
| **Material button** | Bottom-left | Long-press shortcut |
| **Primary action button** | Bottom-right | Stage-dependent ("Save", "Order cutting") |

Nothing else is persistent. Everything else is reached by touching the object being changed. The cabinet's facade IS its material picker (long-press). The cabinet's edge IS its width control (tap, then −/+). The wall IS its dimension input (tap the pill). No sidebar. No menu. No tabs. No settings screen. No tutorial overlay.

**Rule:** Adding any sixth persistent UI element requires the modification protocol below — it is treated as breaking the contract.

---

## 4. The Six Stages of Use — LOCKED

The user moves through six conceptual stages per kitchen. Stages have defined entry conditions, on-screen state, valid verbs, and exit conditions. Saidislom builds the UI as a finite state machine with these six states.

### Stage 1 — Arrival (0–5s)
- **On screen:** Default 2400mm kitchen rendered in default material. Header pills present. Primary action shows "Изменить размер" if untouched.
- **Verbs available:** Look, Resize (wall length)
- **Exit:** User taps wall pill OR swipes OR taps a cabinet

### Stage 2 — Template variants (5–20s)
- **On screen:** Same kitchen plus dots indicator showing N variants. Wall length still tappable.
- **Verbs available:** Choose (swipe), Resize (wall length)
- **Exit:** User taps a cabinet (→ Stage 3)

### Stage 3 — Cabinet selected (20–90s)
- **On screen:** Camera tweened to selected cabinet. Floating −/+ buttons projected to cabinet edges. Floating dimension label projected above cabinet. Dots indicator hidden.
- **Verbs available:** Resize (width), Swap (tap cabinet again cycles type), Remove (double-tap), Inspect (pinch)
- **Exit:** Tap floor (→ Stage 2), long-press cabinet (→ Stage 4), pinch-zoom (→ Stage 5)

### Stage 4 — Material drawer (90–150s)
- **On screen:** Kitchen visible in top 60%, drawer slides up from bottom with palette swatches.
- **Verbs available:** Choose (tap swatch)
- **Exit:** Tap swatch (drawer closes, return to previous stage), tap outside drawer (cancel)

### Stage 5 — Detail dive (optional, 0–120s)
- **On screen:** Single cabinet fills the canvas. Other cabinets faded to 10% opacity. Door style toggle floating on facade. Handle style toggle floating.
- **Verbs available:** Swap (door style, handle), Inspect
- **Exit:** Pinch out OR tap outside cabinet (→ Stage 3)

### Stage 6 — Lock and quote (last 30s)
- **On screen:** Camera pulled back to hero shot. Warmer lighting. All editing affordances removed. Price becomes large heading. Primary button reads "Сохранить раскрой".
- **Verbs available:** Lock
- **Exit:** Tap primary button → DXF + PDF + labels generate, signup prompt if not authenticated.

---

## 5. The NFS Camera Contract — LOCKED

The camera is the user's body. Its movement is how the user understands what they are editing.

| Property | Value | Rationale |
|---|---|---|
| Camera type | `PerspectiveCamera`, FOV 36° | Mild perspective, no fisheye |
| Overview position | `(2.4, 1.9, 3.4)` looking at `(0, 0.55, -0.2)` | Cinematic 3/4 view |
| Tween duration (to cabinet) | 480ms | Below this feels harsh; above feels sluggish |
| Tween duration (to overview) | 540ms | Slightly longer — return feels reassuring |
| Easing | `easeOutCubic` for both directions | Front-loaded motion, soft landing |
| Camera position when focused | `(center.x × 0.5 ± 0.55, center.y + 0.45, center.z + 1.55 + width × 0.4)` | Frames cabinet without losing context |
| LookAt target when focused | Cabinet center, raised by 0.05 | Slightly above geometric center reads as natural eye level |
| Pivot point | Bounding box center of selected cabinet | Prevents "object flies off screen" failure mode |
| Rotation freedom | None in V1 | Constrained — no orbit until V2 |

**Rule:** Camera control is automated. The user never manually orbits or rotates the camera in V1. Camera position is a function of selection state. This is the single rule that makes the schoolboy test pass.

---

## 6. The Three Technical Pillars — LOCKED

Every interaction in this product reduces to three engineering primitives. If you cannot accomplish a UI behavior using one of these three, it does not belong in V1.

### Pillar 1: Raycaster
The user touches the screen. A ray is cast from the camera through the 2D touch coordinates into the 3D scene. Whatever it hits first is the target. Implementation:
```javascript
raycaster.setFromCamera(pointer, camera);
const hits = raycaster.intersectObjects(cabinetBodies, false);
if (hits.length > 0) selectCabinet(hits[0].object.userData.cabinetIndex);
```

### Pillar 2: Camera tween
On selection, the camera position and look-at target lerp from current to computed-target over 480ms with `easeOutCubic`. Implementation must:
- Store `currentLook` separately from camera (camera doesn't expose a stored target)
- Lerp position AND look-at on every frame
- Re-issue `camera.lookAt(currentLook)` every frame during tween

### Pillar 3: Vector projection
Floating UI elements (buttons, labels, swatches) are HTML/RN components positioned by projecting a 3D world coordinate to 2D screen space every frame. Implementation:
```javascript
function project(v3) {
  const v = v3.clone().project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * canvas.clientWidth,
    y: (-v.y * 0.5 + 0.5) * canvas.clientHeight
  };
}
```
In R3F, `<Html>` from `@react-three/drei` handles this automatically. In Flutter with embedded native 3D, this must be implemented manually via a per-frame ticker.

---

## 7. The Hard "No" List — LOCKED

The following are forbidden in V1. Each requires the modification protocol to override.

| Forbidden | Why |
|---|---|
| Settings screen | `conventions.md` IS settings |
| Tutorial overlay | The interface is the tutorial (Tinkercad doctrine) |
| Blank canvas / empty state | Always render a default kitchen |
| Modal dialogs on cabinet add | Add silently with defaults |
| Free camera orbit | Camera is automated only |
| Free object rotation | Camera always moves, object never rotates |
| Property sidebar | Use floating projected controls |
| Tabs / mode switcher / view picker | One model, two cameras maximum |
| Cabinet width input field | Use −/+ buttons or edge drag (V2) |
| Color picker UI | Use palette presets only |
| "Advanced settings" | If it requires "advanced" framing, it's not in V1 |
| Account creation gate before first interaction | Signup happens at Stage 6 (Bitwig DAW model) |
| Loading splash longer than 800ms | If you need a splash, the bundle is too big |

---

## 8. Stage-by-Stage UI Spec (for Saidislom)

For each stage, exactly what is rendered, exactly what is hidden, and exactly which events are listened for.

### Stage 1 — Arrival
- **Rendered:** kitchen mesh (default template, default material), header pills, primary button (label: "Изменить размер")
- **Hidden:** dots, overlay buttons, dimension label, drawer, hint
- **Listeners:** pointerdown on canvas, click on wall pill, click on material button, swipe on canvas

### Stage 2 — Template variants
- **Rendered:** same as Stage 1 plus dots indicator
- **Hidden:** overlay buttons, dimension label, drawer
- **Listeners:** same as Stage 1
- **Swipe threshold:** 40px horizontal, must exceed vertical movement by 1.4×

### Stage 3 — Cabinet selected
- **Rendered:** kitchen, header pills, primary button, floating −/+ buttons (projected to cabinet edges), floating dimension label (projected above cabinet), selection highlight (blue 16% opacity bounding box around selected cabinet)
- **Hidden:** dots, drawer
- **Listeners:** pointerdown on canvas (background → exit, cabinet → swap type, button → resize)
- **Long-press threshold:** 460ms

### Stage 4 — Material drawer
- **Rendered:** kitchen at 60% height, drawer at 40% from bottom with handle bar, swatch grid
- **Hidden:** floating overlays
- **Listeners:** click on swatch (apply + close), click outside drawer (cancel)
- **Animation:** drawer slides in over 280ms with `cubic-bezier(0.2, 0.9, 0.3, 1)`

### Stage 5 — Detail dive
- **Rendered:** single cabinet at full size, other cabinets at 10% opacity, door style toggle, handle toggle
- **Hidden:** floating −/+ buttons
- **Listeners:** pinch-out (exit), toggle taps

### Stage 6 — Lock and quote
- **Rendered:** kitchen at hero camera angle (z+2.5, y+1.2, slow auto-rotate), price as headline, primary button as full-width CTA
- **Hidden:** wall pill, material button, all editing UI
- **Listeners:** primary button → generate outputs, signup if needed

---

## 9. Acceptance Criteria for V1 UI

Before V1 ships, every item below must pass:

- [ ] Cold load to first render: < 1.5s on a $150 Android phone over 3G
- [ ] Camera tween between any two states completes in 480 ± 30ms
- [ ] Width change → kitchen reflow + price update completes in < 100ms
- [ ] Material swap → all cabinets repaint in < 100ms
- [ ] Schoolboy test passes: 5 teenagers, no instructions, each completes a kitchen in < 5 minutes
- [ ] CNC test passes: the DXF from a teenager's kitchen cuts on a real CNC without an engineer touching the file
- [ ] No settings screen exists in the app
- [ ] No empty state is reachable through any sequence of user actions
- [ ] The product works in Russian by default and toggles to Uzbek (Latin)
- [ ] Wall length pill is reachable in 1 tap from any stage
- [ ] Price ticker is visible at all times except Stage 6 (where price becomes headline)

---

## 10. Modification Protocol

This document is sacred. To change anything in it:

1. Open a Telegram message to the team: "Proposing change to UI_PRINCIPLES.md, section N: [reason]"
2. Get explicit "yes" from at least two of three core team members (Oppoq, Saidislom, brother)
3. Update the document, increment its version number, add a changelog entry below
4. Romchi CTO mentor reviews any change that affects acceptance criteria or the three technical pillars

Treat this exactly like `06_CONVENTIONS.md`. Drift in either kills the project.

---

## Changelog

- **v1.0 (May 2026):** Initial lock. Five primary inputs, nine atomic verbs, six stages, NFS camera contract, three technical pillars, hard "no" list.
