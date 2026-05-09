"""
3D Preview generator — kabinetlarni 3D fazoda joylashtirib HTML+Three.js
yordamida brauzerda interaktiv ko'rinish yaratadi.

Xususiyatlar:
  - Eshiklar haqiqiy petlyaga aylanadi (markaz emas, chetga)
  - Teshik markerlari (petlya 35mm, konfirmat 8mm, polka shtift 5mm)
  - Shaffoflik slider (korpus ichini ko'rish)
  - Explode rejim (panellarni ajratish)
  - LMB drag = aylantirish, Wheel = zoom, RMB drag = surish
"""

import json
import os
from cabinet import CABINET_TYPE_DEFAULTS
from project import build_project, layout_panels_simple


SIDE_THICKNESS = 18
BACK_THICKNESS = 4

WALL_HANG_HEIGHT = 1400
CABINET_GAP = 5

# Ranglar
COLOR_WOOD = "#d4a373"
COLOR_DOOR = "#a87544"
COLOR_BACK = "#8b6f47"
COLOR_FLOOR = "#e9ecef"
COLOR_COUNTERTOP = "#3e2723"  # to'q jigarrang ish stoli (worktop)
COUNTERTOP_THICKNESS = 30      # mm — standart kuxnya stoli qalinligi

# Teshik ranglari
HOLE_HINGE = "#22c55e"      # 35mm petlya — yashil
HOLE_CONFIRMAT = "#eab308"  # 8mm konfirmat — sariq
HOLE_SHELF_PIN = "#a855f7"  # 5mm polka shtifti — siyohrang
HOLE_DOOR_CUP = "#22c55e"   # eshik chashkasi (35mm) — yashil

# Cabinet hardware konstantalari (cabinet.py bilan mos)
HINGE_INSET = 35
HINGE_FROM_TOP = 100
SHELF_PIN_INSET = 37
SHELF_PIN_DIAMETER = 5
SHELF_PIN_DEPTH = 13


def _hinge_holes_3d_left(y_positions):
    """Chap yon panel uchun petlya teshiklari, har eshik uchun 2 ta y pozitsiyada."""
    holes = []
    for y in y_positions:
        holes.append({
            "position": [SIDE_THICKNESS, y, HINGE_INSET],
            "axis": "x",
            "diameter": 35,
            "color": HOLE_HINGE,
            "label": "Petlya",
            "host": "panel:Chap yon",
        })
    return holes


def _hinge_holes_3d_right(width, y_positions):
    """O'ng yon panel uchun petlya teshiklari (ko'zgu)."""
    holes = []
    for y in y_positions:
        holes.append({
            "position": [width - SIDE_THICKNESS, y, HINGE_INSET],
            "axis": "x",
            "diameter": 35,
            "color": HOLE_HINGE,
            "label": "Petlya",
            "host": "panel:O'ng yon",
        })
    return holes


def _compute_door_layout(cab_type, height, with_door):
    """Eshiklarning y_offset va balandliklarini hisoblaydi.

    Qaytaradi: list of dict {"y_offset", "height", "sublabel"}.
    """
    if not with_door:
        return []
    if cab_type == "tall" and height > 1500:
        door_h_each = (height - 6) / 2
        return [
            {"y_offset": 2, "height": door_h_each, "sublabel": "past"},
            {"y_offset": 2 + door_h_each + 2, "height": door_h_each, "sublabel": "yuqori"},
        ]
    return [{"y_offset": 2, "height": height - 4, "sublabel": ""}]


def _hinge_y_positions_for_doors(doors_layout):
    """Eshiklarni ro'yxatdan har biri uchun yon paneldagi 2 ta petlya y pozitsiyasini qaytaradi."""
    positions = []
    for d in doors_layout:
        positions.append(d["y_offset"] + HINGE_FROM_TOP)
        positions.append(d["y_offset"] + d["height"] - HINGE_FROM_TOP)
    return positions


def _shelf_pin_holes_3d_left(height, depth, num_shelves):
    """Chap yon panelning ichki yuzasida polka shtiftlari."""
    if num_shelves <= 0:
        return []
    holes = []
    spacing = height / (num_shelves + 1)
    for i in range(1, num_shelves + 1):
        y = i * spacing
        for z in (SHELF_PIN_INSET, depth - SHELF_PIN_INSET):
            holes.append({
                "position": [SIDE_THICKNESS, y, z],
                "axis": "x",
                "diameter": SHELF_PIN_DIAMETER,
                "color": HOLE_SHELF_PIN,
                "label": "Polka shtifti",
                "host": "panel:Chap yon",
            })
    return holes


def _shelf_pin_holes_3d_right(width, height, depth, num_shelves):
    """O'ng yon panelning ichki yuzasida polka shtiftlari (ko'zgu)."""
    if num_shelves <= 0:
        return []
    holes = []
    spacing = height / (num_shelves + 1)
    for i in range(1, num_shelves + 1):
        y = i * spacing
        for z in (SHELF_PIN_INSET, depth - SHELF_PIN_INSET):
            holes.append({
                "position": [width - SIDE_THICKNESS, y, z],
                "axis": "x",
                "diameter": SHELF_PIN_DIAMETER,
                "color": HOLE_SHELF_PIN,
                "label": "Polka shtifti",
                "host": "panel:O'ng yon",
            })
    return holes


def _confirmat_holes_3d_top(width, height, depth):
    """Ust panelning chetlarida (yon panellar bilan birikish) konfirmat."""
    holes = []
    for x_local in (SIDE_THICKNESS, width - SIDE_THICKNESS):
        for z in (depth / 3, 2 * depth / 3):
            holes.append({
                "position": [x_local, height - SIDE_THICKNESS, z],
                "axis": "y",
                "diameter": 8,
                "color": HOLE_CONFIRMAT,
                "label": "Konfirmat",
                "host": "panel:Ust",
            })
    return holes


def _confirmat_holes_3d_bottom(width, depth):
    """Past panelning chetlarida konfirmat."""
    holes = []
    for x_local in (SIDE_THICKNESS, width - SIDE_THICKNESS):
        for z in (depth / 3, 2 * depth / 3):
            holes.append({
                "position": [x_local, SIDE_THICKNESS, z],
                "axis": "y",
                "diameter": 8,
                "color": HOLE_CONFIRMAT,
                "label": "Konfirmat",
                "host": "panel:Past",
            })
    return holes


def _door_cup_holes_3d(width, height, door_offset_y, door_h, door_z, door_index=0):
    """Eshikning ichki yuzasida chashka teshiklari (35mm).

    host = "door:<index>" — explode/rotation paytida eshik bilan birga harakatlanadi.
    """
    holes = []
    cup_x = HINGE_INSET / 2 + 11 + 2  # eshik chap chetidan 28.5mm
    for y_offset in (HINGE_FROM_TOP, door_h - HINGE_FROM_TOP):
        holes.append({
            "position": [cup_x, door_offset_y + y_offset, door_z],
            "axis": "z",
            "diameter": 35,
            "color": HOLE_DOOR_CUP,
            "label": "Chashka",
            "host": f"door:{door_index}",
        })
    return holes


def _build_panels_for_cabinet(cabinet_cfg):
    """Bitta kabinet uchun 3D panellar va teshiklar ro'yxatini hisoblaydi."""
    cab_type = cabinet_cfg.get("type", "wall")
    defs = CABINET_TYPE_DEFAULTS[cab_type]

    width = cabinet_cfg["width"]
    height = cabinet_cfg.get("height", defs["height"])
    depth = cabinet_cfg.get("depth", defs["depth"])
    num_shelves = cabinet_cfg.get("num_shelves", defs["num_shelves"])
    with_door = cabinet_cfg.get("with_door", True)
    has_top = defs["has_top"]
    has_bottom = defs["has_bottom"]

    panels = []
    holes_all = []
    doors = []  # alohida ro'yxat (rotation pivot bilan)

    # Eshiklar layoutini avval hisoblaymiz — yon panel petlyalarini har bir eshikka mos qilish uchun
    doors_layout = _compute_door_layout(cab_type, height, with_door)
    hinge_ys = _hinge_y_positions_for_doors(doors_layout)

    # 1) Chap yon
    panels.append({
        "name": "Chap yon",
        "size": [SIDE_THICKNESS, height, depth],
        "position": [0, 0, 0],
        "color": COLOR_WOOD,
        "category": "body",
    })
    if hinge_ys:
        holes_all.extend(_hinge_holes_3d_left(hinge_ys))
    holes_all.extend(_shelf_pin_holes_3d_left(height, depth, num_shelves))

    # 2) O'ng yon
    panels.append({
        "name": "O'ng yon",
        "size": [SIDE_THICKNESS, height, depth],
        "position": [width - SIDE_THICKNESS, 0, 0],
        "color": COLOR_WOOD,
        "category": "body",
    })
    if hinge_ys:
        holes_all.extend(_hinge_holes_3d_right(width, hinge_ys))
    holes_all.extend(_shelf_pin_holes_3d_right(width, height, depth, num_shelves))

    # 3) Past panel
    if has_bottom:
        panels.append({
            "name": "Past",
            "size": [width - 2 * SIDE_THICKNESS, SIDE_THICKNESS, depth],
            "position": [SIDE_THICKNESS, 0, 0],
            "color": COLOR_WOOD,
            "category": "body",
        })
        holes_all.extend(_confirmat_holes_3d_bottom(width, depth))

    # 4) Ust panel (yo'q bo'lsa stretcherlar)
    if has_top:
        panels.append({
            "name": "Ust",
            "size": [width - 2 * SIDE_THICKNESS, SIDE_THICKNESS, depth],
            "position": [SIDE_THICKNESS, height - SIDE_THICKNESS, 0],
            "color": COLOR_WOOD,
            "category": "body",
        })
        holes_all.extend(_confirmat_holes_3d_top(width, height, depth))
    else:
        for label, z_pos in (("Stretcher old", 0), ("Stretcher orqa", depth - SIDE_THICKNESS)):
            panels.append({
                "name": label,
                "size": [width - 2 * SIDE_THICKNESS, 100, SIDE_THICKNESS],
                "position": [SIDE_THICKNESS, height - 100, z_pos],
                "color": COLOR_WOOD,
                "category": "body",
            })
        # Countertop (ish stoli) — vizual, kesish chizmasiga kirmaydi.
        # Real kuxnyada granit/akril/postformingdan yetkazib beruvchidan alohida.
        # Base kabinet ustini yopiq ko'rsatish uchun 3D'ga qo'shamiz.
        panels.append({
            "name": "Countertop (vizual)",
            "size": [width, COUNTERTOP_THICKNESS, depth],
            "position": [0, height, 0],
            "color": COLOR_COUNTERTOP,
            "category": "countertop",
        })

    # 5) Orqa devor
    panels.append({
        "name": "Orqa (HDF)",
        "size": [width, height, BACK_THICKNESS],
        "position": [0, 0, depth - BACK_THICKNESS],
        "color": COLOR_BACK,
        "category": "back",
    })

    # 6) Polkalar
    inner_h = height - (SIDE_THICKNESS if has_top else 0) - (SIDE_THICKNESS if has_bottom else 0)
    inner_y_start = SIDE_THICKNESS if has_bottom else 0
    if num_shelves > 0:
        spacing = inner_h / (num_shelves + 1)
        for i in range(1, num_shelves + 1):
            panels.append({
                "name": f"Polka {i}",
                "size": [width - 2 * SIDE_THICKNESS, SIDE_THICKNESS, depth - 10],
                "position": [
                    SIDE_THICKNESS,
                    inner_y_start + i * spacing - SIDE_THICKNESS / 2,
                    0,
                ],
                "color": COLOR_WOOD,
                "category": "shelf",
            })

    # 7) Eshik(lar) — doors_layout dan foydalanamiz (yuqorida hisoblangan)
    if doors_layout:
        door_thickness = SIDE_THICKNESS
        door_z_back = -0.5

        for idx, dlayout in enumerate(doors_layout):
            y_offset = dlayout["y_offset"]
            door_h = dlayout["height"]
            sublabel = dlayout["sublabel"]
            door_idx = idx
            name = f"Eshik {idx + 1}" + (f" ({sublabel})" if sublabel else "")
            if len(doors_layout) == 1:
                name = "Eshik"
            doors.append({
                "name": name,
                "size": [width - 4, door_h, door_thickness],
                "hinge_position": [2, y_offset, door_z_back],
                "color": COLOR_DOOR,
                "category": "door",
                "index": door_idx,
            })
            holes_all.extend(_door_cup_holes_3d(
                width, height, y_offset, door_h, door_z_back, door_index=door_idx
            ))

    return panels, doors, holes_all, {"width": width, "height": height, "depth": depth}


def _layout_kitchen(cabinets_config):
    """Kabinetlarni kuxnya layoutiga joylashtiradi.

    Wall hanging height dinamik: agar loyihada tall kabinet bo'lsa,
    devor kabinetlarning ustki qismi tall ustki qismi bilan tekislanadi.
    """
    # Eng baland tall kabinet ustini topish
    tall_max_top = 0
    for cfg in cabinets_config:
        if cfg.get("type") == "tall":
            defs = CABINET_TYPE_DEFAULTS["tall"]
            h = cfg.get("height", defs["height"])
            tall_max_top = max(tall_max_top, h)

    # Devor kabinetining balandligini topish (loyihadagi birinchisidan)
    wall_h = None
    for cfg in cabinets_config:
        if cfg.get("type") == "wall":
            defs = CABINET_TYPE_DEFAULTS["wall"]
            wall_h = cfg.get("height", defs["height"])
            break

    # Wall hang height: tall kabinet bilan tekislash, yoki default
    if tall_max_top > 0 and wall_h is not None:
        wall_hang = max(tall_max_top - wall_h, 1300)  # minimal 1300mm (countertop+gap)
    else:
        wall_hang = WALL_HANG_HEIGHT

    scene_cabinets = []
    floor_x = 0
    wall_x = 0

    for cfg in cabinets_config:
        cab_type = cfg.get("type", "wall")
        cab_id = cfg.get("id", "?")

        panels, doors, holes, dims = _build_panels_for_cabinet(cfg)

        if cab_type == "wall":
            origin = [wall_x, wall_hang, 0]
            wall_x += dims["width"] + CABINET_GAP
        else:
            origin = [floor_x, 0, 0]
            floor_x += dims["width"] + CABINET_GAP

        scene_cabinets.append({
            "id": cab_id,
            "type": cab_type,
            "origin": origin,
            "dimensions": dims,
            "panels": panels,
            "doors": doors,
            "holes": holes,
        })

    max_x = max(
        (c["origin"][0] + c["dimensions"]["width"] for c in scene_cabinets),
        default=1000,
    )
    max_y = max(
        (c["origin"][1] + c["dimensions"]["height"] for c in scene_cabinets),
        default=1000,
    )
    max_z = max(
        (c["origin"][2] + c["dimensions"]["depth"] for c in scene_cabinets),
        default=600,
    )

    return {
        "cabinets": scene_cabinets,
        "bounds": {"max_x": max_x, "max_y": max_y, "max_z": max_z},
        "config": {
            "wall_hang_height": WALL_HANG_HEIGHT,
            "floor_color": COLOR_FLOOR,
        },
    }


def _build_2d_layout_data(cabinets_config):
    """Cutting plan (DXF kabi) uchun 2D layout ma'lumotlarini tayyorlaydi.

    Har placement: panel'ning sheet'dagi joyi + transform + barcha operatsiyalar.
    SVG renderer va info panel shu ma'lumotni ishlatadi.
    """
    panels, summary = build_project(cabinets_config)
    layout = layout_panels_simple(panels)

    # cabinet xulosalari (info panel uchun "tegishli kabinet" ma'lumoti)
    cab_meta = {s["id"].lower(): s for s in summary}

    placements_2d = []
    for placement in layout["placements"]:
        part = placement["part"]
        transform = placement["transform"]

        cabinet_id = ""
        if "." in part.get("part_id", ""):
            cabinet_id = part["part_id"].split(".", 1)[0]

        # Faqat drill operatsiyalari (V1)
        ops = []
        for op in part.get("operations", []):
            if op.get("type") != "drill":
                continue
            ops.append({
                "x_mm": op["x_mm"],
                "y_mm": op["y_mm"],
                "diameter_mm": op["diameter_mm"],
                "depth_mm": op.get("depth_mm", 0),
                "purpose": op.get("purpose", "other"),
                "face": op.get("face", "A"),
            })

        placements_2d.append({
            "part_id": part.get("part_id", ""),
            "label": part.get("label", ""),
            "cabinet_id": cabinet_id,
            "sheet_index": placement["sheet_index"],
            "transform": {
                "x_mm": transform["x_mm"],
                "y_mm": transform["y_mm"],
                "rot_deg": transform["rot_deg"],
            },
            "shape": {
                "w_mm": part["shape"]["w_mm"],
                "h_mm": part["shape"]["h_mm"],
                "thickness_mm": part["shape"].get("thickness_mm", 18.0),
            },
            "material_id": part.get("material_id", ""),
            "edge_banding": dict(part.get("edge_banding", {})),
            "grain_locked": part.get("grain_locked", False),
            "operations": ops,
        })

    return {
        "sheet_w_mm": 2750.0,
        "sheet_h_mm": 1830.0,
        "sheet_gap_mm": 150.0,
        "sheets_used": layout["sheets_used"],
        "placements": placements_2d,
        "cabinets_summary": [
            {
                "id": s["id"],
                "type": s["type"],
                "dimensions": s["dimensions"],
                "panel_count": s["panel_count"],
            } for s in summary
        ],
    }


def generate_3d_preview(cabinets_config, project_id="demo", output_dir=None):
    scene_data = _layout_kitchen(cabinets_config)
    layout_data = _build_2d_layout_data(cabinets_config)

    if output_dir is None:
        output_dir = f"output/project_{project_id}"
    os.makedirs(output_dir, exist_ok=True)
    html_path = os.path.join(output_dir, "3d_preview.html")

    html = _render_html(scene_data, layout_data, project_id)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    return html_path


def _render_html(scene_data, layout_data, project_id):
    scene_json = json.dumps(scene_data, ensure_ascii=False)
    layout_json = json.dumps(layout_data, ensure_ascii=False)
    return f"""<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="utf-8">
<title>3D Preview — {project_id}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Segoe UI', Tahoma, sans-serif; background: #1a1a1a; color: #fff; overflow: hidden; }}
  #app {{ position: relative; width: 100vw; height: 100vh; }}
  canvas {{ display: block; }}

  .panel {{
    position: absolute; background: rgba(20, 20, 20, 0.88);
    backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 14px 16px;
  }}
  #info {{ top: 16px; left: 16px; min-width: 240px; }}
  #info h1 {{ font-size: 16px; margin-bottom: 8px; color: #4dabf7; }}
  #info .stats {{ font-size: 13px; line-height: 1.6; color: #ced4da; }}
  #info .stats span {{ color: #fff; font-weight: 600; }}

  #controls {{ top: 16px; right: 16px; min-width: 280px; max-height: 90vh; overflow-y: auto; }}
  #controls h2 {{ font-size: 14px; margin-bottom: 10px; color: #4dabf7; }}
  .ctrl-row {{ display: flex; align-items: center; margin-bottom: 8px; font-size: 13px; gap: 8px; }}
  .ctrl-row label {{ flex: 1; color: #ced4da; }}
  .ctrl-row input[type="checkbox"] {{ width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; }}
  .ctrl-row input[type="range"] {{ width: 110px; flex-shrink: 0; }}
  .ctrl-row .val {{ color: #4dabf7; font-size: 11px; min-width: 32px; text-align: right; }}
  .group-title {{ color: #4dabf7; font-size: 12px; font-weight: 600;
                  text-transform: uppercase; letter-spacing: 0.5px; margin: 12px 0 6px; }}
  button {{ background: #0066cc; color: white; border: none; padding: 6px 12px;
           border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 4px; margin-bottom: 4px; }}
  button:hover {{ background: #004fa3; }}

  #legend {{ bottom: 16px; left: 16px; max-width: 320px; font-size: 12px; }}
  #legend h2 {{ font-size: 14px; margin-bottom: 8px; color: #4dabf7; }}
  .leg-item {{ display: flex; align-items: center; margin-bottom: 4px; color: #ced4da; }}
  .leg-color {{ width: 14px; height: 14px; border-radius: 2px; margin-right: 8px; flex-shrink: 0; }}
  .leg-color.circle {{ border-radius: 50%; }}

  #help {{ bottom: 16px; right: 16px; font-size: 12px; color: #adb5bd; max-width: 240px; }}
  #help h2 {{ font-size: 13px; margin-bottom: 6px; color: #4dabf7; }}
  #help kbd {{ background: #444; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 11px; }}

  /* === 3D / 2D toggle bar === */
  #view-toggle {{
    position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
    z-index: 100; background: rgba(20,20,20,0.92); border-radius: 10px;
    padding: 4px; display: flex; gap: 4px; border: 1px solid rgba(255,255,255,0.12);
  }}
  .vtoggle-btn {{
    background: transparent; color: #ced4da; padding: 8px 16px;
    font-size: 13px; font-weight: 600; border: none; border-radius: 6px;
    cursor: pointer; transition: all 0.15s;
  }}
  .vtoggle-btn:hover {{ background: rgba(255,255,255,0.06); color: #fff; }}
  .vtoggle-btn.active {{ background: #0066cc; color: #fff; }}

  /* === 2D scene === */
  #scene-2d {{
    position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
    background: #f1f5f9; overflow-y: auto; padding: 70px 24px 100px;
  }}
  #scene-2d .sheet-block {{
    background: white; border-radius: 10px; padding: 16px 20px 20px;
    margin: 16px auto; max-width: 1400px;
    box-shadow: 0 2px 10px rgba(15,23,42,0.07);
  }}
  #scene-2d .sheet-header {{
    display: flex; justify-content: space-between; align-items: baseline;
    color: #0f172a; font-size: 16px; font-weight: 700; margin-bottom: 12px;
    padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;
  }}
  #scene-2d .sheet-header .sheet-meta {{
    color: #64748b; font-size: 12px; font-weight: 400;
  }}
  #scene-2d .sheet-svg {{
    display: block; width: 100%; height: auto;
    background: #fafafa; border: 1px solid #cbd5e1; border-radius: 4px;
    user-select: none;
  }}
  #scene-2d .panel-rect {{ cursor: pointer; transition: fill 0.1s; }}
  #scene-2d .panel-rect:hover {{ fill: rgba(220,38,38,0.18) !important; }}
  #scene-2d .panel-rect.selected {{ fill: rgba(59,130,246,0.25) !important; stroke: #1d4ed8 !important; stroke-width: 5 !important; }}
  #scene-2d .sheet-bg {{ fill: #ffffff; stroke: #94a3b8; stroke-width: 4; }}
  #scene-2d .panel-label {{ fill: #0f172a; font-family: 'Segoe UI', sans-serif; pointer-events: none; font-weight: 700; }}
  #scene-2d .panel-dim {{ fill: #475569; font-family: 'Segoe UI', sans-serif; pointer-events: none; }}
  #scene-2d .hole-marker {{ pointer-events: none; }}
  #scene-2d .banding-rect {{ fill: none; stroke: #b45309; stroke-width: 2; stroke-dasharray: 8 5; pointer-events: none; }}

  /* 2D tooltip (hover) */
  #tooltip-2d {{
    position: fixed; z-index: 200; background: rgba(15,23,42,0.95);
    color: #f8fafc; padding: 10px 12px; border-radius: 6px; font-size: 12px;
    pointer-events: none; max-width: 280px; line-height: 1.4;
    border: 1px solid rgba(77,171,247,0.4);
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    display: none;
  }}

  /* 2D info panel (click) */
  #info-2d {{
    position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
    width: min(720px, 92vw); max-height: 50vh; overflow-y: auto;
    background: rgba(15,23,42,0.96); color: #e2e8f0;
    border: 1px solid rgba(77,171,247,0.35); padding: 0; z-index: 50;
  }}
  #info-2d-header {{
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.08);
    color: #4dabf7;
  }}
  #info-2d-close {{
    background: transparent; color: #94a3b8; border: none; font-size: 18px;
    cursor: pointer; padding: 0 6px;
  }}
  #info-2d-close:hover {{ color: #f87171; }}
  #info-2d-content {{ padding: 14px 16px; font-size: 13px; line-height: 1.55; }}
  #info-2d-content .field {{ margin-bottom: 6px; }}
  #info-2d-content .field b {{ color: #4dabf7; display: inline-block; width: 130px; }}
  #info-2d-content .ops-list {{ margin-top: 10px; padding-left: 0; list-style: none; }}
  #info-2d-content .ops-list li {{
    background: rgba(255,255,255,0.04); border-left: 3px solid; padding: 8px 12px;
    margin-bottom: 6px; border-radius: 3px;
  }}
  #info-2d-content .ops-list li .op-title {{ font-weight: 600; color: #f8fafc; }}
  #info-2d-content .ops-list li .op-why {{ color: #cbd5e1; margin-top: 4px; font-size: 12px; }}
  #info-2d-content .ops-list li .op-coords {{ color: #94a3b8; font-size: 11px; font-family: monospace; }}

  /* Belgilar — yuqorida kompakt strip, kontentni yopmaydi */
  #legend-2d {{
    position: fixed; top: 70px; left: 0; right: 0; z-index: 80;
    background: rgba(15,23,42,0.96); color: #e2e8f0;
    padding: 10px 24px; display: flex; flex-wrap: wrap; gap: 18px;
    align-items: center; justify-content: center;
    border-bottom: 1px solid rgba(77,171,247,0.3); font-size: 12px;
  }}
  #legend-2d .leg-line {{
    display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
  }}
  #legend-2d .leg-sw {{ width: 22px; height: 12px; flex-shrink: 0; border-radius: 2px; }}
  #legend-2d .leg-circle {{ width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }}
  #legend-2d b {{ color: #4dabf7; font-weight: 600; }}
  /* 2D scene — agar legend ko'rinsa, padding qo'shamiz */
  #scene-2d.with-legend {{ padding-top: 122px; }}
</style>
</head>
<body>
<div id="app">
  <!-- 3D / 2D toggle ko'rinish -->
  <div id="view-toggle">
    <button class="vtoggle-btn active" data-mode="3d" type="button">🏗️ 3D yig'ilgan</button>
    <button class="vtoggle-btn" data-mode="2d" type="button">📐 2D Cutting plan</button>
  </div>

  <!-- 2D scene konteyneri -->
  <div id="scene-2d" style="display:none;"></div>

  <!-- 2D click info panel (pastida) -->
  <div id="info-2d" class="panel" style="display:none;">
    <div id="info-2d-header">
      <strong>📦 Tanlangan panel</strong>
      <button id="info-2d-close" type="button">✕</button>
    </div>
    <div id="info-2d-content">Panelga sichqonchani olib boring yoki bossangiz ma'lumot ko'rinadi.</div>
  </div>

  <!-- 2D belgilar — yuqorida kompakt strip -->
  <div id="legend-2d" style="display:none;">
    <span class="leg-line"><span class="leg-sw" style="background:#fee2e2;border:2px solid #dc2626"></span><b>Qizil</b> kesish chegara</span>
    <span class="leg-line"><span class="leg-sw" style="background:#fef3c7;border:1px dashed #b45309"></span><b>Sariq dashed</b> banding</span>
    <span class="leg-line"><span class="leg-circle" style="background:#22c55e"></span><b>35mm</b> petlya/chashka</span>
    <span class="leg-line"><span class="leg-circle" style="background:#eab308"></span><b>8mm</b> konfirmat</span>
    <span class="leg-line"><span class="leg-circle" style="background:#a855f7"></span><b>5mm</b> shtift</span>
    <span class="leg-line" style="color:#64748b">Panelga bossangiz tushuntirish chiqadi</span>
  </div>

  <!-- 3D scene konteyneri (canvas shu yerga joylashadi) -->
  <div id="scene-3d">

  <div id="info" class="panel">
    <h1>🏭 {project_id}</h1>
    <div class="stats">
      <div>Kabinet: <span id="cab-count">—</span></div>
      <div>Panel:   <span id="panel-count">—</span></div>
      <div>Teshik:  <span id="hole-count">—</span></div>
      <div>Kenglik: <span id="dim-w">—</span></div>
      <div>Balandl: <span id="dim-h">—</span></div>
      <div>Chuqurl: <span id="dim-d">—</span></div>
    </div>
  </div>

  <div id="controls" class="panel">
    <h2>⚙️ Boshqaruv</h2>

    <div class="group-title">Ko'rinish</div>
    <div class="ctrl-row">
      <label>Korpus shaffofligi</label>
      <input type="range" id="body-opacity" min="0" max="100" value="100">
      <span class="val" id="body-opacity-val">100%</span>
    </div>
    <div class="ctrl-row">
      <label>Eshik shaffofligi</label>
      <input type="range" id="door-opacity" min="0" max="100" value="100">
      <span class="val" id="door-opacity-val">100%</span>
    </div>
    <div class="ctrl-row">
      <label>Eshik ochilganligi</label>
      <input type="range" id="door-open" min="0" max="110" value="0">
      <span class="val" id="door-open-val">0°</span>
    </div>
    <div class="ctrl-row">
      <label>Explode (panellar)</label>
      <input type="range" id="explode" min="0" max="100" value="0">
      <span class="val" id="explode-val">0%</span>
    </div>

    <div class="group-title">Ko'rsatish</div>
    <div class="ctrl-row">
      <label>Eshiklar</label>
      <input type="checkbox" id="show-doors" checked>
    </div>
    <div class="ctrl-row">
      <label>Orqa devorlar</label>
      <input type="checkbox" id="show-back" checked>
    </div>
    <div class="ctrl-row">
      <label>Teshiklar (markerlar)</label>
      <input type="checkbox" id="show-holes" checked>
    </div>
    <div class="ctrl-row">
      <label>Kabinet ID labellari</label>
      <input type="checkbox" id="show-labels" checked>
    </div>

    <div class="group-title">Kamera</div>
    <div>
      <button id="reset-view">📷 3/4</button>
      <button id="front-view">▶ Old</button>
      <button id="top-view">🔝 Yuqori</button>
      <button id="side-view">◀ Yon</button>
    </div>
  </div>

  <div id="legend" class="panel">
    <h2>📋 Belgilar</h2>
    <div class="leg-item"><div class="leg-color" style="background:#d4a373"></div>LDSP korpus</div>
    <div class="leg-item"><div class="leg-color" style="background:#a87544"></div>Eshik</div>
    <div class="leg-item"><div class="leg-color" style="background:#8b6f47"></div>Orqa devor (HDF)</div>
    <div class="leg-item"><div class="leg-color circle" style="background:#22c55e"></div>Petlya / Chashka (35mm)</div>
    <div class="leg-item"><div class="leg-color circle" style="background:#eab308"></div>Konfirmat (8mm)</div>
    <div class="leg-item"><div class="leg-color circle" style="background:#a855f7"></div>Polka shtifti (5mm)</div>
  </div>

  <div id="help" class="panel">
    <h2>🖱 Sichqoncha</h2>
    <div><kbd>LMB</kbd> sudrang — aylantirish</div>
    <div><kbd>Wheel</kbd> — yaqinlashtirish</div>
    <div><kbd>RMB</kbd> sudrang — surish</div>
    <div style="margin-top:6px;color:#22c55e;">💡 Korpus shaffofligini sliderdan o'zgartirib ichidagi teshik va detallarni ko'ring</div>
  </div>

  </div><!-- /#scene-3d -->
</div><!-- /#app -->

<!-- Hover tooltip (har 2 rejim uchun) -->
<div id="tooltip-2d"></div>

<script type="importmap">
{{
  "imports": {{
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }}
}}
</script>

<script type="module">
import * as THREE from 'three';
import {{ OrbitControls }} from 'three/addons/controls/OrbitControls.js';

const SCENE_DATA = {scene_json};
const LAYOUT_DATA = {layout_json};

// =====================================================================
// Operatsiya turlari uchun tushuntirishlar (purpose explanations)
// =====================================================================
const PURPOSE_INFO = {{
  hinge: {{
    title: "Petlya teshigi (35mm)",
    color: "#22c55e",
    why: "Eshikni yon panelga ulash uchun. Real petlya: yon paneldagi plate (mount) qismi shu yerga vintlar bilan biriktiriladi. Eshikning ichki yuzasidagi chashka bilan birgalikda harakatlanuvchi tugun hosil qiladi.",
    connects: "Eshikning chashka teshigi bilan",
    standard: "Blum / Hettich / GTV — 35mm Yevropa standarti (1971-yildan)",
  }},
  cup: {{
    title: "Chashka teshigi (35mm, eshikda)",
    color: "#22c55e",
    why: "Petlya cup qismi shu yerga o'rnatiladi. Eshik ICHKI yuzasida (Face B), tashqaridan ko'rinmaydi. Eshik 18mm qalin → chashka 12.5mm chuqur.",
    connects: "Yon paneldagi petlya teshigi bilan",
    standard: "Blum 35mm",
  }},
  shelf_pin: {{
    title: "Polka shtifti teshigi (5mm)",
    color: "#a855f7",
    why: "Polkani tutib turish uchun shtift kiritiladi. Yon panelning ichki yuzasida, oldingi va orqa chetlardan SHELF_PIN_INSET (37mm) ichkarida.",
    connects: "Polkaning yon chetlari bilan (polka teshik kerak emas — shtiftga tayanadi)",
    standard: "5mm — sanoat default",
  }},
  confirmat: {{
    title: "Konfirmat teshigi (8mm)",
    color: "#eab308",
    why: "Eurosrew (konfirmat vint) bilan ust/past panelni yon panelga bog'lash uchun. Yon panel chetidan vint o'tib gorizontal panel ichidagi 8mm teshikka kiradi.",
    connects: "Yon panel bilan",
    standard: "Standart Euroscrew 7×50mm yoki 7×70mm",
  }},
  other: {{
    title: "Boshqa teshik",
    color: "#94a3b8",
    why: "Maxsus operatsiya",
    connects: "—",
    standard: "—",
  }},
}};

const MATERIAL_INFO = {{
  ldsp_18_white: "ЛДСП 18мм белый — 2750×1830мм list",
  ldsp_18_oak:   "ЛДСП 18мм дуб сонома — 2750×1830мм list",
  mdf_16_white:  "МДФ 16мм белый — 2800×2070мм list",
  hdf_4_back:    "ХДФ 4мм (orqa devor uchun) — 2800×2070мм list",
  hdf_3_back:    "ХДФ 3мм (orqa devor uchun) — 2800×2070мм list",
}};

// =====================================================================
// 2D SVG renderer (cutting plan / DXF kabi)
// Har list alohida katta SVG, vertikal stack.
// Y axis FLIPPED (DXF kabi: Y=0 PASTDA, yuqoriga ko'tariladi).
// =====================================================================
function render2DLayout() {{
  const sheetW = LAYOUT_DATA.sheet_w_mm;
  const sheetH = LAYOUT_DATA.sheet_h_mm;
  const numSheets = LAYOUT_DATA.sheets_used;

  // Panellarni listga guruhlash
  const bySheet = {{}};
  LAYOUT_DATA.placements.forEach((p, idx) => {{
    const k = p.sheet_index;
    (bySheet[k] || (bySheet[k] = [])).push({{ ...p, _idx: idx }});
  }});

  let html = '';
  for (let s = 0; s < numSheets; s++) {{
    const placements = bySheet[s] || [];

    html += `<div class="sheet-block">`;
    html += `<div class="sheet-header">`;
    html += `<span>📋 LIST ${{s + 1}} / ${{numSheets}}</span>`;
    html += `<span class="sheet-meta">${{sheetW}} × ${{sheetH}} mm  ·  ${{placements.length}} panel  ·  LDSP 18mm</span>`;
    html += `</div>`;

    // Padding viewBox (tashqarida bo'sh joy)
    const padding = 80;
    const vbX = -padding;
    const vbY = -padding;
    const vbW = sheetW + 2 * padding;
    const vbH = sheetH + 2 * padding;

    html += `<svg class="sheet-svg" viewBox="${{vbX}} ${{vbY}} ${{vbW}} ${{vbH}}" `;
    html += `preserveAspectRatio="xMidYMid meet">`;

    // Outer Y-flip group: DXF style (Y=0 pastda)
    html += `<g transform="translate(0, ${{sheetH}}) scale(1, -1)">`;

    // List foni
    html += `<rect class="sheet-bg" x="0" y="0" width="${{sheetW}}" height="${{sheetH}}"/>`;

    // === 1-PASS: Panellar (shape + banding + holes) ===
    // Rotation matrix dxf_generator.apply_transform bilan to'liq mos:
    //   rot=0:    identity
    //   rot=90:   matrix(0,1,-1,0,h,0)   → (x,y) → (h-y, x)
    //   rot=180:  matrix(-1,0,0,-1,w,h)  → (x,y) → (w-x, h-y)
    //   rot=270:  matrix(0,-1,1,0,0,w)   → (x,y) → (y, w-x)
    // Bu matritsa har bir lokal nuqtani kabinet local koordinatdan
    // sheet global koordinatga to'g'ri ko'chiradi (DXF generatori bilan teng).
    function panelTransform(tx, ty, rot, w, h) {{
      const t = `translate(${{tx}},${{ty}})`;
      switch (rot % 360) {{
        case 90:  return `${{t}} matrix(0,1,-1,0,${{h}},0)`;
        case 180: return `${{t}} matrix(-1,0,0,-1,${{w}},${{h}})`;
        case 270: return `${{t}} matrix(0,-1,1,0,0,${{w}})`;
        default:  return t;
      }}
    }}

    placements.forEach(p => {{
      const tx = p.transform.x_mm;
      const ty = p.transform.y_mm;
      const rot = p.transform.rot_deg;
      const w = p.shape.w_mm;
      const h = p.shape.h_mm;

      html += `<g transform="${{panelTransform(tx, ty, rot, w, h)}}" data-idx="${{p._idx}}">`;

      // Kesish kontur (qizil)
      html += `<rect class="panel-rect" x="0" y="0" width="${{w}}" height="${{h}}" `;
      html += `fill="rgba(220,38,38,0.07)" stroke="#dc2626" stroke-width="3.5" `;
      html += `data-pid="${{p.part_id}}" data-idx="${{p._idx}}"/>`;

      // Banding offset (sariq dashed)
      const eb = p.edge_banding;
      const left = eb.left_mm || 0, right = eb.right_mm || 0;
      const top = eb.top_mm || 0, bottom = eb.bottom_mm || 0;
      if (left || right || top || bottom) {{
        html += `<rect class="banding-rect" x="${{left}}" y="${{bottom}}" `;
        html += `width="${{w - left - right}}" height="${{h - top - bottom}}"/>`;
      }}

      // Teshiklar
      p.operations.forEach(op => {{
        const r = op.diameter_mm / 2;
        const color = (PURPOSE_INFO[op.purpose] || PURPOSE_INFO.other).color;
        html += `<circle class="hole-marker" cx="${{op.x_mm}}" cy="${{op.y_mm}}" r="${{r}}" `;
        html += `fill="${{color}}" stroke="#1e293b" stroke-width="1.5"/>`;
      }});

      html += `</g>`;
    }});

    // === 2-PASS: Matnlar (alohida, har doim to'g'ri o'qilishi uchun) ===
    // Burilgan panellar uchun ham matn upright bo'ladi.
    placements.forEach(p => {{
      const tx = p.transform.x_mm;
      const ty = p.transform.y_mm;
      const rot = p.transform.rot_deg;
      const w = p.shape.w_mm;
      const h = p.shape.h_mm;
      // rot=90/270 da effective dimensions almashinadi (h × w)
      const effW = (rot === 90 || rot === 270) ? h : w;
      const effH = (rot === 90 || rot === 270) ? w : h;
      const cx = tx + effW / 2;
      const cy = ty + effH / 2;
      const fs1 = Math.max(22, Math.min(effW / 11, 36));
      const fs2 = Math.max(15, Math.min(effW / 18, 22));
      const shortLabel = p.label.length > 26 ? p.label.substring(0, 26) + "…" : p.label;
      // Y-flipped frame ichida — counter-flip qilamiz (text upright bo'lsin)
      html += `<g class="panel-text" transform="translate(${{cx}}, ${{cy}}) scale(1, -1)">`;
      html += `<text class="panel-label" x="0" y="${{-fs2 / 2}}" `;
      html += `text-anchor="middle" font-size="${{fs1}}">${{escapeHtml(shortLabel)}}</text>`;
      html += `<text class="panel-dim" x="0" y="${{fs1 - 2}}" `;
      html += `text-anchor="middle" font-size="${{fs2}}">${{Math.round(w)}} × ${{Math.round(h)}} mm</text>`;
      html += `</g>`;
    }});

    html += `</g>`;  // /Y-flip group
    html += `</svg>`;
    html += `</div>`;  // /sheet-block
  }}
  return html;
}}

function escapeHtml(s) {{
  return String(s).replace(/[&<>"']/g, c =>
    ({{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}})[c]);
}}

// =====================================================================
// Tooltip va info panel
// =====================================================================
const tooltip = document.getElementById('tooltip-2d');

function showTooltip(html, evt) {{
  tooltip.innerHTML = html;
  tooltip.style.display = 'block';
  tooltip.style.left = (evt.clientX + 14) + 'px';
  tooltip.style.top = (evt.clientY + 14) + 'px';
}}
function hideTooltip() {{ tooltip.style.display = 'none'; }}

function panelTooltipHtml(p) {{
  const opCounts = {{}};
  p.operations.forEach(op => {{
    opCounts[op.purpose] = (opCounts[op.purpose] || 0) + 1;
  }});
  const opLines = Object.entries(opCounts).map(([k, v]) => {{
    const info = PURPOSE_INFO[k] || PURPOSE_INFO.other;
    return `• ${{v}}× ${{info.title}}`;
  }}).join('<br>');
  return `<b style="color:#4dabf7">${{escapeHtml(p.label)}}</b><br>` +
         `${{Math.round(p.shape.w_mm)}} × ${{Math.round(p.shape.h_mm)}} × ${{Math.round(p.shape.thickness_mm)}}mm<br>` +
         `<span style="color:#94a3b8;font-size:11px">${{p.material_id || '—'}}</span>` +
         (opLines ? `<hr style="border:0;border-top:1px solid rgba(255,255,255,0.15);margin:6px 0"/>${{opLines}}` : '') +
         `<div style="margin-top:6px;color:#22c55e;font-size:11px">📌 Tafsilot uchun bossangiz</div>`;
}}

function showInfo(p) {{
  const info = document.getElementById('info-2d-content');
  document.getElementById('info-2d').style.display = 'block';

  const cabSummary = LAYOUT_DATA.cabinets_summary.find(c => c.id.toLowerCase() === p.cabinet_id.toLowerCase());
  const cabText = cabSummary
    ? `${{cabSummary.id}} — ${{cabSummary.type}} kabinet (${{cabSummary.dimensions}}, ${{cabSummary.panel_count}} panel)`
    : (p.cabinet_id || "—");

  const eb = p.edge_banding;
  const bandText = ['left_mm','right_mm','top_mm','bottom_mm']
    .map(k => `${{k.replace('_mm','')}}: ${{eb[k] || 0}}mm`).join(', ');

  // Operatsiyalar tushuntirishi (qaysi qaysi narsa uchun)
  let opsHtml = '';
  if (p.operations.length === 0) {{
    opsHtml = '<div style="color:#64748b">Bu panelda teshik yo\\'q.</div>';
  }} else {{
    // Group by purpose
    const groups = {{}};
    p.operations.forEach(op => {{
      groups[op.purpose] = groups[op.purpose] || [];
      groups[op.purpose].push(op);
    }});
    opsHtml = '<ul class="ops-list">';
    Object.entries(groups).forEach(([purpose, ops]) => {{
      const inf = PURPOSE_INFO[purpose] || PURPOSE_INFO.other;
      opsHtml += `<li style="border-left-color:${{inf.color}}">` +
        `<div class="op-title">${{escapeHtml(inf.title)}} — ${{ops.length}} ta</div>` +
        `<div class="op-why">${{escapeHtml(inf.why)}}</div>` +
        `<div style="margin-top:4px;color:#fbbf24;font-size:11px">🔗 Bog'lanadi: ${{escapeHtml(inf.connects)}}</div>` +
        `<div style="margin-top:2px;color:#94a3b8;font-size:11px">📐 Standart: ${{escapeHtml(inf.standard)}}</div>` +
        `<div class="op-coords">Joylar: ${{ops.map(o => `(${{o.x_mm.toFixed(0)}}, ${{o.y_mm.toFixed(0)}}) Ø${{o.diameter_mm}}mm Z${{o.depth_mm}}mm Face ${{o.face}}`).join('; ')}}</div>` +
        `</li>`;
    }});
    opsHtml += '</ul>';
  }}

  // Bog'liq panellar (bir kabinetdagi boshqalar)
  const sameCab = LAYOUT_DATA.placements
    .filter(x => x.cabinet_id === p.cabinet_id && x.part_id !== p.part_id)
    .map(x => x.part_id.split('.')[1] || x.part_id);
  const relText = sameCab.length ? sameCab.join(', ') : '—';

  info.innerHTML =
    `<div class="field"><b>part_id:</b> <code>${{escapeHtml(p.part_id)}}</code></div>` +
    `<div class="field"><b>Tegishli kabinet:</b> ${{escapeHtml(cabText)}}</div>` +
    `<div class="field"><b>Bog'liq panellar:</b> ${{escapeHtml(relText)}}</div>` +
    `<div class="field"><b>Material:</b> ${{escapeHtml(p.material_id)}} ` +
       `<span style="color:#94a3b8">(${{escapeHtml(MATERIAL_INFO[p.material_id] || '')}})</span></div>` +
    `<div class="field"><b>Yakuniy o'lcham:</b> ${{p.shape.w_mm}} × ${{p.shape.h_mm}} × ${{p.shape.thickness_mm}}mm</div>` +
    `<div class="field"><b>Edge banding:</b> ${{bandText}}</div>` +
    `<div class="field"><b>Grain locked:</b> ${{p.grain_locked ? 'ha — vertical grain saqlanishi shart' : 'yo\\'q'}}</div>` +
    `<div class="field"><b>Joylashish:</b> List ${{p.sheet_index + 1}}, x=${{p.transform.x_mm.toFixed(0)}}mm, y=${{p.transform.y_mm.toFixed(0)}}mm, rot=${{p.transform.rot_deg}}°</div>` +
    `<hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:12px 0"/>` +
    `<div style="margin-bottom:6px"><b>Operatsiyalar va sabablar:</b></div>` +
    opsHtml;
}}

// =====================================================================
// Toggle 3D / 2D
// =====================================================================
let view2DRendered = false;
function setMode(mode) {{
  document.querySelectorAll('.vtoggle-btn').forEach(b => {{
    b.classList.toggle('active', b.dataset.mode === mode);
  }});
  if (mode === '3d') {{
    document.getElementById('scene-3d').style.display = 'block';
    document.getElementById('scene-2d').style.display = 'none';
    document.getElementById('legend-2d').style.display = 'none';
    document.getElementById('info-2d').style.display = 'none';
  }} else {{
    document.getElementById('scene-3d').style.display = 'none';
    const scene2d = document.getElementById('scene-2d');
    scene2d.style.display = 'block';
    scene2d.classList.add('with-legend');
    document.getElementById('legend-2d').style.display = 'flex';
    if (!view2DRendered) {{
      scene2d.innerHTML = render2DLayout();
      view2DRendered = true;
      attach2DHandlers();
    }}
  }}
}}
document.querySelectorAll('.vtoggle-btn').forEach(btn => {{
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
}});

function attach2DHandlers() {{
  const allRects = document.querySelectorAll('#scene-2d .panel-rect');
  allRects.forEach(rect => {{
    const idx = parseInt(rect.dataset.idx, 10);
    const p = LAYOUT_DATA.placements[idx];
    if (!p) return;

    rect.addEventListener('mouseenter', e => showTooltip(panelTooltipHtml(p), e));
    rect.addEventListener('mousemove', e => {{
      tooltip.style.left = (e.clientX + 14) + 'px';
      tooltip.style.top = (e.clientY + 14) + 'px';
    }});
    rect.addEventListener('mouseleave', hideTooltip);
    rect.addEventListener('click', () => {{
      document.querySelectorAll('#scene-2d .panel-rect.selected')
        .forEach(r => r.classList.remove('selected'));
      rect.classList.add('selected');
      showInfo(p);
    }});
  }});
}}

document.getElementById('info-2d-close').addEventListener('click', () => {{
  document.getElementById('info-2d').style.display = 'none';
  document.querySelectorAll('#scene-2d .panel-rect.selected').forEach(r => r.classList.remove('selected'));
}});

// === Scene setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2a2a);
scene.fog = new THREE.Fog(0x2a2a2a, 5000, 18000);

const bounds = SCENE_DATA.bounds;
const sceneSize = Math.max(bounds.max_x, bounds.max_y, bounds.max_z);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 30000);
// Default kamera oldindan-o'ngdan-yuqoridan (eshiklar z=0 dan oldinga ko'rinadi)
camera.position.set(sceneSize * 1.0, sceneSize * 0.9, -sceneSize * 1.4);
const center = new THREE.Vector3(bounds.max_x / 2, bounds.max_y / 2, bounds.max_z / 2);

const renderer = new THREE.WebGLRenderer({{ antialias: true }});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(center);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.update();

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
scene.add(hemi);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
// Yorug'lik kamera tomondan (oldindan), shunda eshik va front faces yorug' bo'ladi
dirLight.position.set(sceneSize * 0.5, sceneSize * 1.2, -sceneSize * 0.7);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -sceneSize;
dirLight.shadow.camera.right = sceneSize;
dirLight.shadow.camera.top = sceneSize;
dirLight.shadow.camera.bottom = -sceneSize;
dirLight.shadow.camera.near = 100;
dirLight.shadow.camera.far = sceneSize * 5;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight2.position.set(-sceneSize, sceneSize * 0.5, sceneSize);
scene.add(dirLight2);

// Floor
const floorGeom = new THREE.PlaneGeometry(sceneSize * 5, sceneSize * 5);
const floorMat = new THREE.MeshStandardMaterial({{ color: 0xe9ecef, roughness: 0.9 }});
const floor = new THREE.Mesh(floorGeom, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(sceneSize * 5, 50, 0x666666, 0x333333);
grid.position.y = 0.5;
scene.add(grid);

// === Build cabinets ===
const cabinetGroups = [];
const bodyMeshes = [];   // korpus paneller (chap, o'ng, ust, past, polka)
const backMeshes = [];   // orqa devorlar
const doorGroups = [];   // eshik groupsi (rotation pivot bilan)
const doorMeshes = [];   // eshik meshlari (shaffoflik uchun)
const holeMeshes = [];   // teshik markerlari
const labelSprites = [];
const explodeAnchors = []; // explode rejim uchun panel original pozitsiyalari

let totalPanels = 0;
let totalHoles = 0;

SCENE_DATA.cabinets.forEach(cab => {{
  const cabGroup = new THREE.Group();
  cabGroup.position.set(...cab.origin);
  cabGroup.userData = {{ id: cab.id, type: cab.type, dims: cab.dimensions }};
  scene.add(cabGroup);
  cabinetGroups.push(cabGroup);

  const cabCenter = new THREE.Vector3(
    cab.dimensions.width / 2, cab.dimensions.height / 2, cab.dimensions.depth / 2
  );

  // Har kabinet uchun explode masofasi — eng katta o'lchamning 35%
  const cabMaxDim = Math.max(
    cab.dimensions.width, cab.dimensions.height, cab.dimensions.depth
  );
  const explodeScale = cabMaxDim * 0.35;

  // Host objektlarni xaritada saqlaymiz (teshiklarni tegishli paneliga bog'lash uchun)
  const panelMap = {{}};   // "Chap yon" → mesh
  const doorMap = {{}};    // 0 → doorGroup

  // Yo'nalish hisoblash — markazda (NaN) bo'lsa, default Y axis
  function safeDir(origPos, fallback) {{
    const v = origPos.clone().sub(cabCenter);
    if (v.lengthSq() < 0.01) {{
      return (fallback || new THREE.Vector3(0, 1, 0)).clone();
    }}
    return v.normalize();
  }}

  // --- Body panellar ---
  cab.panels.forEach(panel => {{
    const [w, h, d] = panel.size;
    const [px, py, pz] = panel.position;
    const geom = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({{
      color: panel.color,
      roughness: 0.7,
      metalness: 0.05,
      transparent: true,
      opacity: 1.0,
    }});
    const mesh = new THREE.Mesh(geom, mat);
    const origPos = new THREE.Vector3(px + w / 2, py + h / 2, pz + d / 2);
    mesh.position.copy(origPos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {{ panelName: panel.name, cabinetId: cab.id, category: panel.category }};
    cabGroup.add(mesh);
    panelMap[panel.name] = mesh;

    // Yo'nalish: panel markazidan kabinet markaziga.
    // Polkalar markazga teng → safeDir Y axisga (yuqoriga) tashlaydi.
    const fallback = panel.category === 'shelf'
      ? new THREE.Vector3(0, 0, -1)  // shelves go forward
      : new THREE.Vector3(0, 1, 0);
    const dirFromCenter = safeDir(origPos, fallback);
    explodeAnchors.push({{
      object: mesh, origPos: origPos.clone(),
      dir: dirFromCenter, scale: explodeScale,
    }});

    if (panel.category === 'back') backMeshes.push(mesh);
    else bodyMeshes.push(mesh);

    totalPanels++;
  }});

  // --- Eshiklar (alohida group bilan, petlya pivot) ---
  cab.doors.forEach(door => {{
    const [w, h, d] = door.size;
    const [hx, hy, hz] = door.hinge_position;

    // Geometriyani translate qilamiz, shunda pivot chap-old-past burchakda
    const geom = new THREE.BoxGeometry(w, h, d);
    geom.translate(w / 2, h / 2, -d / 2);

    const mat = new THREE.MeshStandardMaterial({{
      color: door.color,
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
    }});
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {{ panelName: door.name, cabinetId: cab.id, category: 'door' }};

    const doorGroup = new THREE.Group();
    const groupOrigPos = new THREE.Vector3(hx, hy, hz);
    doorGroup.position.copy(groupOrigPos);
    doorGroup.add(mesh);
    cabGroup.add(doorGroup);

    doorMap[door.index] = doorGroup;
    doorGroups.push(doorGroup);
    doorMeshes.push(mesh);

    // Eshikning markazi (explode uchun yo'nalish hisoblash)
    const doorCenter = groupOrigPos.clone().add(new THREE.Vector3(w / 2, h / 2, -d / 2));
    const dirFromCenter = safeDir(doorCenter, new THREE.Vector3(0, 0, -1));
    explodeAnchors.push({{
      object: doorGroup, origPos: groupOrigPos.clone(),
      dir: dirFromCenter, scale: explodeScale,
    }});

    totalPanels++;
  }});

  // --- Teshik markerlari (host parenting bilan) ---
  cab.holes.forEach(hole => {{
    const [hx, hy, hz] = hole.position;
    const radius = hole.diameter / 2;
    const cyl = new THREE.CylinderGeometry(radius, radius, 4, 24, 1, false);
    const mat = new THREE.MeshStandardMaterial({{
      color: hole.color,
      roughness: 0.4,
      metalness: 0.5,
      emissive: hole.color,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 1.0,
    }});
    const cylMesh = new THREE.Mesh(cyl, mat);

    if (hole.axis === 'x') {{
      cylMesh.rotation.z = Math.PI / 2;
    }} else if (hole.axis === 'z') {{
      cylMesh.rotation.x = Math.PI / 2;
    }}
    cylMesh.userData = {{ holeLabel: hole.label, cabinetId: cab.id }};

    // Host topish va parenting
    const host = hole.host || "";
    let parent = cabGroup;
    let localPos = new THREE.Vector3(hx, hy, hz);

    if (host.startsWith("panel:")) {{
      const panelName = host.substring(6);
      const hostMesh = panelMap[panelName];
      if (hostMesh) {{
        parent = hostMesh;
        // Host mesh world position = cabGroup + hostMesh.position
        // Local position = hole_world (cabinet local) - hostMesh.position
        localPos = new THREE.Vector3(hx, hy, hz).sub(hostMesh.position);
      }}
    }} else if (host.startsWith("door:")) {{
      const doorIdx = parseInt(host.substring(5), 10);
      const hostDoorGroup = doorMap[doorIdx];
      if (hostDoorGroup) {{
        parent = hostDoorGroup;
        // doorGroup pozitsiyasi cabinet local da
        localPos = new THREE.Vector3(hx, hy, hz).sub(hostDoorGroup.position);
      }}
    }}

    cylMesh.position.copy(localPos);
    parent.add(cylMesh);
    holeMeshes.push(cylMesh);
    totalHoles++;
  }});

  // --- Kabinet ID label ---
  const sprite = makeLabel(cab.id, cab.type);
  sprite.position.set(
    cab.dimensions.width / 2,
    cab.dimensions.height + 50,
    cab.dimensions.depth / 2
  );
  cabGroup.add(sprite);
  labelSprites.push(sprite);
}});

function makeLabel(id, type) {{
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0066cc';
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 56px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(id, 128, 36);
  ctx.font = '20px Segoe UI, sans-serif';
  ctx.fillText(type, 128, 76);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({{ map: texture, transparent: true }});
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(220, 82, 1);
  return sprite;
}}

// === UI bog'lash ===
document.getElementById('cab-count').textContent = SCENE_DATA.cabinets.length;
document.getElementById('panel-count').textContent = totalPanels;
document.getElementById('hole-count').textContent = totalHoles;
document.getElementById('dim-w').textContent = bounds.max_x.toFixed(0) + ' mm';
document.getElementById('dim-h').textContent = bounds.max_y.toFixed(0) + ' mm';
document.getElementById('dim-d').textContent = bounds.max_z.toFixed(0) + ' mm';

function setOpacity(meshes, value) {{
  meshes.forEach(m => {{
    m.material.opacity = value;
    m.material.transparent = value < 1.0;
    m.material.depthWrite = value >= 0.99;
  }});
}}

document.getElementById('body-opacity').addEventListener('input', e => {{
  const v = e.target.value / 100;
  setOpacity(bodyMeshes, v);
  setOpacity(backMeshes, v);
  document.getElementById('body-opacity-val').textContent = e.target.value + '%';
}});
document.getElementById('door-opacity').addEventListener('input', e => {{
  const v = e.target.value / 100;
  setOpacity(doorMeshes, v);
  document.getElementById('door-opacity-val').textContent = e.target.value + '%';
}});
document.getElementById('door-open').addEventListener('input', e => {{
  // Eshik petlya bo'ylab aylanadi (Y axis), pivot chap chet va orqa
  const angle = (e.target.value / 100) * (Math.PI / 2);
  doorGroups.forEach(g => g.rotation.y = angle);
  document.getElementById('door-open-val').textContent = (angle * 180 / Math.PI).toFixed(0) + '°';
}});
document.getElementById('explode').addEventListener('input', e => {{
  const factor = e.target.value / 100;
  explodeAnchors.forEach(a => {{
    // Har kabinet o'z hajmiga moslab portlatadi (kichik kabinet kichik, katta — katta)
    const distance = (a.scale || 250) * factor;
    a.object.position.copy(a.origPos).add(a.dir.clone().multiplyScalar(distance));
  }});
  document.getElementById('explode-val').textContent = e.target.value + '%';
}});

document.getElementById('show-doors').addEventListener('change', e => {{
  doorGroups.forEach(g => g.visible = e.target.checked);
}});
document.getElementById('show-back').addEventListener('change', e => {{
  backMeshes.forEach(m => m.visible = e.target.checked);
}});
document.getElementById('show-holes').addEventListener('change', e => {{
  holeMeshes.forEach(m => m.visible = e.target.checked);
}});
document.getElementById('show-labels').addEventListener('change', e => {{
  labelSprites.forEach(s => s.visible = e.target.checked);
}});

document.getElementById('reset-view').addEventListener('click', () => {{
  camera.position.set(sceneSize * 1.0, sceneSize * 0.9, -sceneSize * 1.4);
  controls.target.copy(center);
  controls.update();
}});
document.getElementById('top-view').addEventListener('click', () => {{
  camera.position.set(center.x, sceneSize * 2.5, center.z);
  controls.target.copy(center);
  controls.update();
}});
document.getElementById('front-view').addEventListener('click', () => {{
  // Front = -z tomondan (chunki eshiklar -z ga qaragan)
  camera.position.set(center.x, center.y, -sceneSize * 2.0);
  controls.target.copy(center);
  controls.update();
}});
document.getElementById('side-view').addEventListener('click', () => {{
  camera.position.set(-sceneSize * 2.0, center.y, center.z);
  controls.target.copy(center);
  controls.update();
}});

window.addEventListener('resize', () => {{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}});

function animate() {{
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}}
animate();
</script>
</body>
</html>
"""
