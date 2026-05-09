"""
Cabinet generator — bir kabinet uchun barcha panellarni yaratadi.

Standart oddiy kabinet (oddiy quti):
- 2 ta yon panel (chap, o'ng — ko'zgu)
- 1 ta ust panel
- 1 ta past panel
- 1 ta orqa panel (yupqa, masalan HDF 4mm)
- 0+ ta polka

Birikma: yonlar tashqi, ust/past ichkarida (sides overlap top/bottom).

Output har bir panel `contracts/part.schema.json` ga muvofiq bo'lishi kafolatlangan
(build_cabinet oxirida _enrich_panels chaqiriladi). Validate qilish uchun
`validate_parts(panels)` chaqiring — schema buzilganda ValueError tashlaydi.
"""

import json
import pathlib
import re

# Default material assignments (CONVENTIONS §7 bo'yicha foreign key)
MATERIAL_BODY = "ldsp_18_white"   # yon, ust, past, polka, eshik, stretcher
MATERIAL_BACK = "hdf_4_back"      # orqa devor (HDF)

SIDE_THICKNESS = 18    # LDSP yon devorlar (mm) — body material thickness
BACK_THICKNESS = 4     # HDF orqa devor (mm) — back material thickness
HINGE_INSET = 35       # Petlya markazigacha chetdan masofa (mm)
HINGE_FROM_TOP = 100   # Yuqori petlya pastdan boshlab (mm)
SHELF_PIN_INSET = 37   # Polka shtiftlari chetdan (mm)
SHELF_PIN_DIAMETER = 5
SHELF_PIN_DEPTH = 13


def _hinge_holes(panel_h, on_left_edge=True):
    """Petlya teshiklarini panel ichida (local koordinat) qaytaradi.

    Yuqori petlya: pastdan (panel_h - HINGE_FROM_TOP)
    Pastki petlya: pastdan HINGE_FROM_TOP
    X: chap chetdan (yon panel ichidan ochiladigan eshik tomon)
    """
    x = HINGE_INSET if on_left_edge else None
    holes = []
    for y in (HINGE_FROM_TOP, panel_h - HINGE_FROM_TOP):
        holes.append({
            "type": "drill",
            "x_mm": x,
            "y_mm": y,
            "diameter_mm": 35,
            "depth_mm": 12.5,
        })
    return holes


def _shelf_pin_holes(panel_h, num_shelves, panel_d):
    """Polka shtiftlari uchun teshiklar (4 ta polka uchun, har biri 4 ta).

    Y koordinata har bir polka pozitsiyasida.
    X: oldingi chetdan SHELF_PIN_INSET, orqa chetdan ham SHELF_PIN_INSET.
    """
    if num_shelves <= 0:
        return []
    holes = []
    spacing = panel_h / (num_shelves + 1)
    for i in range(1, num_shelves + 1):
        y = round(i * spacing, 1)
        # Oldingi va orqa shtiftlar
        for x in (SHELF_PIN_INSET, panel_d - SHELF_PIN_INSET):
            holes.append({
                "type": "drill",
                "x_mm": x,
                "y_mm": y,
                "diameter_mm": SHELF_PIN_DIAMETER,
                "depth_mm": SHELF_PIN_DEPTH,
            })
    return holes


def _confirmat_holes_horizontal(length, panel_d):
    """Ust/past panellarning chap va o'ng chetlariga konfirmat (Eurosrew) teshiklar.

    Bular panel chetiga (yon panellar bilan birikadigan tomonga) joylashadi.
    """
    holes = []
    # 2 ta teshik har chetda (oldingi, orqa)
    for x_edge in (50, length - 50):  # chetdan 50mm
        # Y bo'yicha 2 ta: panel_d ning 1/3 va 2/3 da
        for y in (panel_d / 3, 2 * panel_d / 3):
            holes.append({
                "type": "drill",
                "x_mm": round(x_edge, 1),
                "y_mm": round(y, 1),
                "diameter_mm": 8,
                "depth_mm": 30,
            })
    return holes


def _add_banding_for_visible_edges(banding_config):
    """edge_banding dictini qaytaradi, default 0 bilan."""
    return {
        "left_mm": banding_config.get("left", 0),
        "right_mm": banding_config.get("right", 0),
        "top_mm": banding_config.get("top", 0),
        "bottom_mm": banding_config.get("bottom", 0),
    }


# Kabinet turlari va ularning standart o'lchamlari
CABINET_TYPE_DEFAULTS = {
    "wall": {  # devor kabinet (yuqorida osiladi)
        "height": 720,
        "depth": 320,
        "num_shelves": 1,
        "has_top": True,     # ust paneli bor
        "has_bottom": True,  # past paneli bor
    },
    "base": {  # past kabinet (yerda turadi, ustiga countertop)
        "height": 820,       # 720mm korpus + 100mm oyoq/plinta
        "depth": 600,
        "num_shelves": 1,
        "has_top": False,    # countertop tushadi, ust panel kerak emas
        "has_bottom": True,
    },
    "tall": {  # baland shkaf (poldan tepaga, oziq-ovqat / kombayn)
        "height": 2100,
        "depth": 600,
        "num_shelves": 4,
        "has_top": True,
        "has_bottom": True,
    },
}


def _label(name, cabinet_id=None):
    """Panel labeliga cabinet ID prefiks qo'shadi (agar berilgan bo'lsa)."""
    if cabinet_id:
        return f"{cabinet_id}: {name}"
    return name


# ----------------------------------------------------------------------------
# Schema migration helpers (CONVENTIONS.md + part.schema.json v1.0.0)
# ----------------------------------------------------------------------------

def _slug(s: str) -> str:
    """Erkin matnni canonical_id ga aylantiradi: 'O\\'ng yon' → 'ong_yon'."""
    s = s.lower().replace("'", "")
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")


def _part_id(canonical_name: str, cabinet_id):
    """part_id: '<cabinet_id>.<canonical_name>' yoki 'cab.<name>' agar id yo'q."""
    cab = _slug(cabinet_id) if cabinet_id else "cab"
    return f"{cab}.{canonical_name}"


def _purpose_for_diameter(diameter_mm, is_door):
    """Teshik diametriga qarab purpose ni aniqlaydi (schema enum)."""
    if diameter_mm >= 30:
        return "cup" if is_door else "hinge"
    if diameter_mm >= 7:
        return "confirmat"
    if diameter_mm >= 4:
        return "shelf_pin"
    return "other"


def _enrich_panels(panels, cabinet_id):
    """Har panelni part.schema.json ga to'liq mos qiladi.

    Qo'shadi: part_id, material_id, shape.thickness_mm, grain_locked.
    Operatsiyalarga: face, purpose.
    Mavjud kodni buzmaydi (faqat yangi maydonlar qo'shadi, eskilarini saqlaydi).
    """
    for p in panels:
        # Canonical name labeldan ajratiladi: "W1: Chap yon" → "Chap yon"
        label = p.get("label", "")
        name_only = label.split(": ", 1)[1] if ": " in label else label
        canonical = _slug(name_only) or "panel"

        # part_id
        p["part_id"] = _part_id(canonical, cabinet_id)

        # Material va thickness — orqa devor bo'lsa HDF, qolganlar LDSP
        is_back = canonical.startswith("orqa")
        if is_back:
            p["material_id"] = MATERIAL_BACK
            p["shape"]["thickness_mm"] = float(BACK_THICKNESS)
            p["grain_locked"] = False  # HDF gilamsiz
        else:
            p["material_id"] = MATERIAL_BODY
            p["shape"]["thickness_mm"] = float(SIDE_THICKNESS)
            p["grain_locked"] = True   # LDSP gilamli

        # Shape qiymatlarini float qilish (CONVENTIONS §6 — float mm)
        p["shape"]["w_mm"] = float(p["shape"]["w_mm"])
        p["shape"]["h_mm"] = float(p["shape"]["h_mm"])

        # Edge banding qiymatlarini ham float
        for k in ("left_mm", "right_mm", "top_mm", "bottom_mm"):
            if k in p["edge_banding"]:
                p["edge_banding"][k] = float(p["edge_banding"][k])

        # Operatsiyalarga face va purpose qo'shish
        is_door = canonical.startswith("eshik")
        # CONVENTIONS §1: door Face A = mijoz tomon → cup B da
        # qolgan panellar Face A = ichki yuz → ops A da
        default_face = "B" if is_door else "A"
        for op in p.get("operations", []):
            if op.get("type") != "drill":
                continue
            op["x_mm"] = float(op["x_mm"])
            op["y_mm"] = float(op["y_mm"])
            op["diameter_mm"] = float(op["diameter_mm"])
            op["depth_mm"] = float(op["depth_mm"])
            op.setdefault("face", default_face)
            op.setdefault("purpose", _purpose_for_diameter(op["diameter_mm"], is_door))

    return panels


_SCHEMA_CACHE = None


def _load_part_schema():
    global _SCHEMA_CACHE
    if _SCHEMA_CACHE is None:
        path = pathlib.Path(__file__).parent / "contracts" / "part.schema.json"
        _SCHEMA_CACHE = json.loads(path.read_text(encoding="utf-8"))
    return _SCHEMA_CACHE


def validate_parts(panels):
    """Har panelni part.schema.json ga qarshi tekshiradi.

    Schema buzilgan bo'lsa ValueError tashlaydi (kerakli maydonlar ro'yxati bilan).
    Pipeline kuchli qulf: agar bu funksiya tushib qolsa, build_project to'xtaydi.
    """
    try:
        from jsonschema import Draft202012Validator
    except ImportError as exc:
        raise RuntimeError(
            "validate_parts uchun 'jsonschema' kerak: pip install jsonschema"
        ) from exc

    schema = _load_part_schema()
    validator = Draft202012Validator(schema)
    errors = []
    for p in panels:
        # _comment kabi xizmat maydonlari validatsiyaga kirmasin
        clean = {k: v for k, v in p.items() if not k.startswith("_")}
        for err in validator.iter_errors(clean):
            path = ".".join(str(x) for x in err.absolute_path) or "<root>"
            errors.append(f"{p.get('part_id', p.get('label', '?'))}: {path} — {err.message}")
    if errors:
        raise ValueError(
            "Schema validatsiya xato — panellar contract bilan mos kelmadi:\n  "
            + "\n  ".join(errors)
        )
    return True


def build_cabinet(
    width=600,
    height=None,
    depth=None,
    num_shelves=None,
    with_door=True,
    cabinet_type="wall",
    cabinet_id=None,
):
    """Kabinetning barcha panellarini ro'yxat sifatida qaytaradi.

    Har bir panel:
      {
        "label": str,
        "shape": {"w_mm": ..., "h_mm": ...},
        "edge_banding": {...},
        "operations": [...]
      }

    Parametrlar:
        width        — kabinetning umumiy kengligi (mm)
        height       — balandligi (None bo'lsa cabinet_type defaultidan olinadi)
        depth        — chuqurligi (None bo'lsa default)
        num_shelves  — polkalar soni (None bo'lsa default)
        with_door    — eshik (default True)
        cabinet_type — "wall" | "base" | "tall"
        cabinet_id   — ko'p kabinetli loyihada label prefiksi (masalan "K1")
    """
    if cabinet_type not in CABINET_TYPE_DEFAULTS:
        raise ValueError(
            f"Noma'lum cabinet_type: {cabinet_type!r}. "
            f"Mumkin: {list(CABINET_TYPE_DEFAULTS)}"
        )
    defaults = CABINET_TYPE_DEFAULTS[cabinet_type]
    if height is None:
        height = defaults["height"]
    if depth is None:
        depth = defaults["depth"]
    if num_shelves is None:
        num_shelves = defaults["num_shelves"]
    has_top = defaults["has_top"]
    has_bottom = defaults["has_bottom"]

    panels = []

    # Eshiklar layoutini avval hisoblaymiz — yon panel petlyalarini har bir eshikka mos qilish uchun
    # Tall kabinetda 2 eshik bo'lsa, yon panelda 4 ta petlya kerak (2 tepa + 2 past).
    if with_door:
        if cabinet_type == "tall" and height > 1500:
            door_h_each = (height - 6) / 2
            doors_layout = [
                {"y_offset": 2, "height": door_h_each},
                {"y_offset": 2 + door_h_each + 2, "height": door_h_each},
            ]
        else:
            doors_layout = [{"y_offset": 2, "height": height - 4}]
        # Har eshikning yuqori va past petlya y koordinatasi
        hinge_ys = []
        for d in doors_layout:
            hinge_ys.append(d["y_offset"] + HINGE_FROM_TOP)
            hinge_ys.append(d["y_offset"] + d["height"] - HINGE_FROM_TOP)
    else:
        doors_layout = []
        hinge_ys = []

    # --- YON PANELLAR (chap, o'ng) ---
    side_w = depth
    side_h = height

    chap_yon = {
        "label": _label("Chap yon", cabinet_id),
        "shape": {"w_mm": side_w, "h_mm": side_h},
        "edge_banding": _add_banding_for_visible_edges({
            "right": 2.0,
            "top": 2.0,
            "bottom": 2.0,
        }),
        "operations": [],
    }
    for y in hinge_ys:
        chap_yon["operations"].append({
            "type": "drill",
            "x_mm": depth - HINGE_INSET,
            "y_mm": y,
            "diameter_mm": 35,
            "depth_mm": 12.5,
        })
    chap_yon["operations"].extend(_shelf_pin_holes(side_h, num_shelves, side_w))
    panels.append(chap_yon)

    ong_yon = {
        "label": _label("O'ng yon", cabinet_id),
        "shape": {"w_mm": side_w, "h_mm": side_h},
        "edge_banding": _add_banding_for_visible_edges({
            "left": 2.0,
            "top": 2.0,
            "bottom": 2.0,
        }),
        "operations": [],
    }
    for y in hinge_ys:
        ong_yon["operations"].append({
            "type": "drill",
            "x_mm": HINGE_INSET,
            "y_mm": y,
            "diameter_mm": 35,
            "depth_mm": 12.5,
        })
    ong_yon["operations"].extend(_shelf_pin_holes(side_h, num_shelves, side_w))
    panels.append(ong_yon)

    # --- UST va PAST panellar ---
    # Yon panellar oralig'iga kiradi
    horiz_w = width - 2 * SIDE_THICKNESS
    horiz_h = depth

    if has_top:
        ust = {
            "label": _label("Ust", cabinet_id),
            "shape": {"w_mm": horiz_w, "h_mm": horiz_h},
            "edge_banding": _add_banding_for_visible_edges({"top": 2.0}),  # old cheti
            "operations": _confirmat_holes_horizontal(horiz_w, horiz_h),
        }
        panels.append(ust)

    if has_bottom:
        past = {
            "label": _label("Past", cabinet_id),
            "shape": {"w_mm": horiz_w, "h_mm": horiz_h},
            "edge_banding": _add_banding_for_visible_edges({"top": 2.0}),
            "operations": _confirmat_holes_horizontal(horiz_w, horiz_h),
        }
        panels.append(past)

    # BASE kabinetda ust panel o'rniga 2 ta strecher (tirgak) qo'yamiz
    if not has_top:
        # Old va orqa stretcher (100mm kenglikda)
        for name in ("Stretcher old", "Stretcher orqa"):
            panels.append({
                "label": _label(name, cabinet_id),
                "shape": {"w_mm": horiz_w, "h_mm": 100},
                "edge_banding": _add_banding_for_visible_edges({}),
                "operations": [
                    # Yon panellarga konfirmat bilan biriktiriladi
                    {
                        "type": "drill",
                        "x_mm": 50,
                        "y_mm": 50,
                        "diameter_mm": 8,
                        "depth_mm": 30,
                    },
                    {
                        "type": "drill",
                        "x_mm": horiz_w - 50,
                        "y_mm": 50,
                        "diameter_mm": 8,
                        "depth_mm": 30,
                    },
                ],
            })

    # --- POLKALAR ---
    for i in range(num_shelves):
        polka = {
            "label": _label(f"Polka {i + 1}", cabinet_id),
            "shape": {"w_mm": horiz_w, "h_mm": horiz_h - 10},  # 10mm orqa devor uchun
            "edge_banding": _add_banding_for_visible_edges({"top": 2.0}),
            "operations": [],
        }
        panels.append(polka)

    # --- ORQA PANEL (HDF) ---
    # O'lcham: width x height (yoki yon-ust-past ichidagi groove ga moslashadi)
    # Hozircha to'liq qoplaydigan o'lcham
    orqa = {
        "label": _label("Orqa devor (HDF)", cabinet_id),
        "shape": {"w_mm": width, "h_mm": height},
        "edge_banding": _add_banding_for_visible_edges({}),  # banding yo'q
        "operations": [],
    }
    panels.append(orqa)

    # --- ESHIK ---
    if with_door:
        # TALL kabinetda 2 ta eshik (yuqori va past) — har biri yarmiga
        if cabinet_type == "tall" and height > 1500:
            door_h_each = (height - 6) / 2  # 2mm tepa+past+orta gap
            for idx, door_y_offset in enumerate(("past", "yuqori"), start=1):
                eshik = {
                    "label": _label(f"Eshik {idx} ({door_y_offset})", cabinet_id),
                    "shape": {"w_mm": width - 4, "h_mm": door_h_each},
                    "edge_banding": _add_banding_for_visible_edges({
                        "left": 2.0, "right": 2.0, "top": 2.0, "bottom": 2.0,
                    }),
                    "operations": [
                        {
                            "type": "drill",
                            "x_mm": HINGE_INSET / 2 + 11,
                            "y_mm": HINGE_FROM_TOP,
                            "diameter_mm": 35,
                            "depth_mm": 12.5,
                        },
                        {
                            "type": "drill",
                            "x_mm": HINGE_INSET / 2 + 11,
                            "y_mm": door_h_each - HINGE_FROM_TOP,
                            "diameter_mm": 35,
                            "depth_mm": 12.5,
                        },
                    ],
                }
                panels.append(eshik)
        else:
            eshik = {
                "label": _label("Eshik", cabinet_id),
                "shape": {"w_mm": width - 4, "h_mm": height - 4},  # 2mm gap har tomondan
                "edge_banding": _add_banding_for_visible_edges({
                    "left": 2.0, "right": 2.0, "top": 2.0, "bottom": 2.0,
                }),
                "operations": [
                    # Eshikning ichki yuzasida petlya teshiklari (chashka)
                    {
                        "type": "drill",
                        "x_mm": HINGE_INSET / 2 + 11,  # chashka markazi
                        "y_mm": HINGE_FROM_TOP,
                        "diameter_mm": 35,
                        "depth_mm": 12.5,
                    },
                    {
                        "type": "drill",
                        "x_mm": HINGE_INSET / 2 + 11,
                        "y_mm": (height - 4) - HINGE_FROM_TOP,
                        "diameter_mm": 35,
                        "depth_mm": 12.5,
                    },
                ],
            }
            panels.append(eshik)

    # Schema migration: har panel `contracts/part.schema.json` ga muvofiq
    # bo'lishi kerak (part_id, material_id, thickness_mm, face, purpose, ...)
    return _enrich_panels(panels, cabinet_id)


def layout_panels_simple(panels, sheet_w=2750, sheet_h=1830, gap=20):
    """Panellarni listga oddiy qatorlash, kerak bo'lsa avtomat aylanish.

    Strategy: chapdan o'ngga, qator to'lganda yangi qator.
    Agar panel listga to'g'ri sig'masa — 90° aylantirib sinab ko'radi.
    Hali sig'masa — yangi list.

    Saralash: panellar avval balandlik bo'yicha kamayish tartibida tartiblanadi
    (large-first heuristic) — bu listga zichroq joylash uchun.
    """
    # Saralash: katta panellarni avval joylashtirish (FFDH-like)
    sorted_panels = sorted(
        panels,
        key=lambda p: max(p["shape"]["w_mm"], p["shape"]["h_mm"]),
        reverse=True,
    )

    placements = []
    sheets_used = 1
    cursor_x = 0
    cursor_y = 0
    row_max_h = 0
    sheet_idx = 0

    def fits(w, h):
        return cursor_x + w <= sheet_w and cursor_y + h <= sheet_h

    def fits_anywhere(w, h):
        return w <= sheet_w and h <= sheet_h

    for part in sorted_panels:
        pw = part["shape"]["w_mm"]
        ph = part["shape"]["h_mm"]

        # Aylanmagan va aylantirilgan variantlarni tekshirish
        # (rot=0: pw x ph,  rot=90: ph x pw)
        candidates = [
            (pw, ph, 0),
            (ph, pw, 90),
        ]

        placed = False
        for cw, ch, rot in candidates:
            if not fits_anywhere(cw, ch):
                continue
            # Joriy pozitsiyada
            if fits(cw, ch):
                placements.append({
                    "part": part,
                    "transform": {
                        "x_mm": cursor_x,
                        "y_mm": cursor_y,
                        "rot_deg": rot,
                    },
                    "sheet_index": sheet_idx,
                })
                cursor_x += cw + gap
                if ch > row_max_h:
                    row_max_h = ch
                placed = True
                break

        if placed:
            continue

        # Yangi qator
        cursor_x = 0
        cursor_y += row_max_h + gap
        row_max_h = 0
        for cw, ch, rot in candidates:
            if not fits_anywhere(cw, ch):
                continue
            if fits(cw, ch):
                placements.append({
                    "part": part,
                    "transform": {
                        "x_mm": cursor_x,
                        "y_mm": cursor_y,
                        "rot_deg": rot,
                    },
                    "sheet_index": sheet_idx,
                })
                cursor_x += cw + gap
                if ch > row_max_h:
                    row_max_h = ch
                placed = True
                break

        if placed:
            continue

        # Yangi list
        sheet_idx += 1
        sheets_used = sheet_idx + 1
        cursor_x = 0
        cursor_y = 0
        row_max_h = 0
        for cw, ch, rot in candidates:
            if not fits_anywhere(cw, ch):
                continue
            placements.append({
                "part": part,
                "transform": {
                    "x_mm": 0,
                    "y_mm": 0,
                    "rot_deg": rot,
                },
                "sheet_index": sheet_idx,
            })
            cursor_x = cw + gap
            row_max_h = ch
            placed = True
            break

        if not placed:
            raise ValueError(
                f"Panel {part['label']!r} ({pw}x{ph}) listga sig'maydi: "
                f"{sheet_w}x{sheet_h}"
            )

    return {"sheets_used": sheets_used, "placements": placements}
