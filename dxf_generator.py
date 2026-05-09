"""
DXF Generator — Mebel paneli uchun CNC kesish DXF yaratuvchi.

Foydalanish:
    from dxf_generator import generate_furniture_dxf
    path = generate_furniture_dxf(cut_layout, project_id=1)
"""

import os
import ezdxf
from ezdxf import colors


SHEET_W = 2750
SHEET_H = 1830
SHEET_GAP = 150


def apply_transform(x_local, y_local, panel_w, panel_h, transform):
    """Local panel koordinatni global sheet koordinatga o'tkazadi.

    Panel burilganda teshiklar ham buriladi — bu funksiya buni hal qiladi.
    """
    rot = transform["rot_deg"]
    sx = transform["x_mm"]
    sy = transform["y_mm"]

    if rot == 0:
        gx = sx + x_local
        gy = sy + y_local
    elif rot == 90:
        gx = sx + (panel_h - y_local)
        gy = sy + x_local
    elif rot == 180:
        gx = sx + (panel_w - x_local)
        gy = sy + (panel_h - y_local)
    elif rot == 270:
        gx = sx + y_local
        gy = sy + (panel_w - x_local)
    else:
        gx = sx + x_local
        gy = sy + y_local

    return round(gx, 1), round(gy, 1)


def _drill_layer_for(diameter_mm):
    if diameter_mm >= 30:
        return "DRILL_35MM"
    if diameter_mm >= 8:
        return "DRILL_8MM"
    return "DRILL_5MM"


def draw_panel(msp, part, transform):
    pw = part["shape"]["w_mm"]
    ph = part["shape"]["h_mm"]

    banding = part.get("edge_banding", {})
    left = banding.get("left_mm", 0)
    right = banding.get("right_mm", 0)
    top = banding.get("top_mm", 0)
    bottom = banding.get("bottom_mm", 0)

    # Edge banding kesish o'lchamidan ayiriladi
    cut_w = pw - left - right
    cut_h = ph - top - bottom

    corners_local = [
        (left, bottom),
        (left + cut_w, bottom),
        (left + cut_w, bottom + cut_h),
        (left, bottom + cut_h),
        (left, bottom),
    ]
    corners_global = [
        apply_transform(x, y, pw, ph, transform) for x, y in corners_local
    ]
    msp.add_lwpolyline(
        corners_global,
        dxfattribs={"layer": "CUT", "closed": True},
    )

    # Panel nomi va o'lcham markazga
    cx_local = left + cut_w / 2
    cy_local = bottom + cut_h / 2
    cx, cy = apply_transform(cx_local, cy_local, pw, ph, transform)

    msp.add_text(
        part["label"],
        dxfattribs={"layer": "LABELS", "height": 12},
    ).set_placement((cx, cy))

    msp.add_text(
        f"{int(pw)}x{int(ph)}mm (kesish:{int(cut_w)}x{int(cut_h)})",
        dxfattribs={"layer": "LABELS", "height": 8},
    ).set_placement((cx, cy - 20))

    # Operatsiyalar (teshiklar)
    for op in part.get("operations", []):
        if op["type"] == "drill":
            gx, gy = apply_transform(
                op["x_mm"], op["y_mm"], pw, ph, transform
            )
            diameter = op["diameter_mm"]
            layer = _drill_layer_for(diameter)
            msp.add_circle(
                center=(gx, gy),
                radius=diameter / 2,
                dxfattribs={"layer": layer},
            )
            depth = op.get("depth_mm")
            if depth:
                msp.add_text(
                    f"Z{depth}",
                    dxfattribs={"layer": "LABELS", "height": 5},
                ).set_placement((gx + diameter / 2 + 2, gy))


def generate_furniture_dxf(cut_layout: dict, project_id: int) -> str:
    doc = ezdxf.new(dxfversion="R2010")
    msp = doc.modelspace()

    doc.layers.add("CUT", color=colors.RED)
    doc.layers.add("DRILL_35MM", color=colors.GREEN)
    doc.layers.add("DRILL_8MM", color=colors.YELLOW)
    doc.layers.add("DRILL_5MM", color=colors.CYAN)
    doc.layers.add("LABELS", color=colors.BLUE)
    doc.layers.add("SHEET", color=7)

    sheets_used = cut_layout.get("sheets_used", 1)
    for s in range(sheets_used):
        offset_x = s * (SHEET_W + SHEET_GAP)
        msp.add_lwpolyline(
            [
                (offset_x, 0),
                (offset_x + SHEET_W, 0),
                (offset_x + SHEET_W, SHEET_H),
                (offset_x, SHEET_H),
                (offset_x, 0),
            ],
            dxfattribs={"layer": "SHEET", "closed": True},
        )
        msp.add_text(
            f"LIST {s + 1} / {sheets_used}",
            dxfattribs={"layer": "LABELS", "height": 40},
        ).set_placement((offset_x + 20, SHEET_H + 50))

    for placement in cut_layout.get("placements", []):
        part = placement["part"]
        transform = placement["transform"]
        sheet_idx = placement["sheet_index"]
        adjusted = {
            "x_mm": transform["x_mm"] + sheet_idx * (SHEET_W + SHEET_GAP),
            "y_mm": transform["y_mm"],
            "rot_deg": transform["rot_deg"],
        }
        draw_panel(msp, part, adjusted)

    output_dir = f"output/project_{project_id}"
    os.makedirs(output_dir, exist_ok=True)
    dxf_path = f"{output_dir}/cutting_plan.dxf"
    doc.saveas(dxf_path)
    print(f"DXF saqlandi: {dxf_path}")
    return dxf_path
