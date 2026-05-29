# CONVENTIONS — Pipeline bedrock contracts

**Status:** v1.0.0 — LOCKED
**Owners:** all module authors must agree before editing
**Rule:** never edited without all owners approving

These are the immutable rules that ALL pipeline modules (Decomposer, Optimizer,
DXF Generator, 3D Preview, GUI) follow. Every schema, every test fixture, every
transform formula derives from this file.

If you find code that contradicts this document, the code is wrong — not the
document.

---

## 1. Coordinate system (Part-local)

Each Part has a **local coordinate frame** with these properties:

```
        Y (height)
        ▲
        │
        │
        │     ┌─────────────────┐
        │     │                 │
        │     │   Face A        │
        │     │   (outward,     │
        │     │    visible)     │
        │     │                 │
        │     │                 │
        │     └─────────────────┘
   Origin─────────────────────► X (width)
   (bottom-left of Face A)
```

- **Origin**: bottom-left corner of **Face A**, viewed from outside the part
- **X axis**: increases to the right
- **Y axis**: increases upward
- **Z axis**: increases AWAY from Face A (into the panel thickness)
- All coordinates in **part-local mm**, never global

**Face A** is the visible/outward face:
- For side panels: the face toward the cabinet interior
- For top/bottom panels: the face toward the cabinet interior
- For doors: the face toward the customer (outside)
- For back panels: the face toward the cabinet interior

**Face B** is opposite to Face A.

---

## 2. Operations live inside Part

```json
{
  "part_id": "W1.chap_yon",
  "shape": { "w_mm": 320.0, "h_mm": 720.0, "thickness_mm": 18.0 },
  "operations": [
    { "type": "drill", "x_mm": 285.0, "y_mm": 102.0,
      "diameter_mm": 35.0, "depth_mm": 12.5, "face": "A" }
  ]
}
```

- **Operations are part-local coordinates.** They travel with the part through
  every transform (rotation, mirror, placement on sheet).
- **The CNC sees nothing else.** If a feature isn't in `operations[]`, it
  doesn't exist. There is no other route.
- Modules MUST NOT compute operation positions outside the Part. The
  Decomposer is the only authority that can add operations.

---

## 3. Transform: `{ x_mm, y_mm, rot_deg, mirror }`

The Optimizer outputs a **Transform** for each Part placement, never bare
coordinates:

```json
{
  "part_id": "W1.chap_yon",
  "sheet_index": 0,
  "transform": {
    "x_mm": 0.0,
    "y_mm": 0.0,
    "rot_deg": 0,
    "mirror": false
  }
}
```

**Rotation order (LOCKED):**
1. Mirror about X-axis (if `mirror == true`)
2. Rotate around part origin (0,0) by `rot_deg` counter-clockwise
3. Translate by `(x_mm, y_mm)` to global sheet position

**Allowed rotations (V1):** `0`, `90`, `180`, `270` only. No arbitrary angles.

**Transform formulas** (apply in order: mirror, rotate, translate):

```
mirror=true:    x' = w − x_local        y' = y_local

rot=0:          x' = x_local            y' = y_local
rot=90:         x' = h − y_local        y' = x_local
rot=180:        x' = w − x_local        y' = h − y_local
rot=270:        x' = y_local            y' = w − x_local

translate:      x_global = sheet_x + x'   y_global = sheet_y + y'
```

(`w` = part width before rotation, `h` = part height before rotation)

The DXF Generator and 3D Preview MUST apply transforms identically to
operations and to the outline. The Optimizer NEVER inspects operations.

---

## 4. Edge banding subtraction (LOCKED)

**Decision: store FINAL panel size in `Part.shape`, store banding per edge,
DXF Generator subtracts at draw time.**

```json
{
  "shape": { "w_mm": 600.0, "h_mm": 400.0, "thickness_mm": 18.0 },
  "edge_banding": {
    "left_mm":   2.0,
    "right_mm":  2.0,
    "top_mm":    0.4,
    "bottom_mm": 0.0
  }
}
```

- `Part.shape` = final assembled panel size (what the customer sees, what the
  factory tracks).
- `edge_banding.*_mm` = thickness of banding on each edge (0 = no banding).
- **Cut size** (drawn in DXF as the cut outline) = shape − banding on each
  edge:
  - `cut_w = shape.w − edge_banding.left − edge_banding.right`
  - `cut_h = shape.h − edge_banding.top  − edge_banding.bottom`
- **Operations remain in shape coordinates**, NOT cut coordinates. They travel
  unchanged regardless of banding.

---

## 5. Mirror handling (LOCKED)

**Decision: mirror at the Decomposer.**

The Decomposer outputs two distinct Parts where `right_side.operations` are
already mirrored coordinates of `left_side.operations`. Each Part is a
complete, self-contained physical object.

Generators stay dumb — they apply transforms blindly without knowing about
mirror semantics at the part level.

`Placement.transform.mirror` exists in the schema but stays `false` in V1.
It's reserved for future special cases (e.g., a panel that has BOTH faces
machined and the Optimizer can flip it upside down on the sheet).

---

## 6. Units and tolerance (LOCKED)

- **All linear dimensions:** floats in millimeters, rounded to **0.1 mm at
  module boundaries**. Internal calculations may carry more precision.
- **All angles:** integers in degrees. V1 supports only `0`, `90`, `180`, `270`.
- **All comparisons in tests:** use **0.05 mm tolerance**. A point at
  `(285.00, 102.00)` and a point at `(285.04, 102.04)` are equal for test
  purposes.

---

## 7. MaterialCatalog is foreign-key

`Part.material_id` is a **string foreign key** referencing
`/data/materials.json`. Never duplicate material data into Parts.

```json
// In Part:
{ "material_id": "ldsp_18_white", ... }

// In /data/materials.json:
{
  "ldsp_18_white": {
    "name": "ЛДСП 18мм белый",
    "thickness_mm": 18.0,
    "sheet_w_mm": 2750.0,
    "sheet_h_mm": 1830.0,
    "kerf_mm": 4.0,
    "grain": "vertical",
    "price_per_sheet_uzs": 420000
  }
}
```

The MaterialCatalog is owned by NO module. Every module reads it.

---

## 8. Layer naming (DXF output)

The DXF Generator MUST emit these exact layer names:

| Layer | Color | Purpose |
|---|---|---|
| `CUT` | red (1) | Final cut outline (after banding subtraction) |
| `DRILL_5MM` | cyan (4) | 5mm holes (shelf pins) |
| `DRILL_8MM` | yellow (2) | 8mm holes (confirmat / euroscrew) |
| `DRILL_35MM` | green (3) | 35mm holes (hinge cup) |
| `LABELS` | blue (5) | Part labels and dimension text |
| `SHEET` | white (7) | Sheet boundary (informational) |

Other operation diameters get layers: `DRILL_<diameter>MM`.

---

## 9. Frontend rule

The GUI/3D-Preview may render preview geometry from input dimensions for
responsiveness. It **MUST NOT** compute manufacturing truth. The DXF that
reaches the CNC is always the result of the full pipeline:

```
GUI input → Decomposer → Optimizer → DXF Generator → CNC
                  ↑
                  └── single source of truth
```

3D preview and 2D preview are derived; if they disagree with the DXF, the
DXF wins.

---

## 10. The discipline rule

> **If a feature isn't in `Part.operations[]`, it doesn't exist. The CNC
> machine never sees it. There is no other route.**

Not in Cabinet. Not in HardwareList. Not in a comment. Not in someone's
head. Only in the part. Break this rule and the pipeline drifts silently
until a customer's cabinet has the wrong holes.

---

## Version history

- **1.0.0** — Initial lock. Coordinates, transforms, banding, mirror, units,
  layers all defined. Reserved `mirror` flag in Placement for V2 use.
