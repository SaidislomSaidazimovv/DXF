"""
Burilgan panel testi: bir xil panel 4 ta burchakka qo'yiladi.
Har bir panelda 1 ta katta teshik (35mm) chap-past burchakka yaqin.
DXF da har bir panelda teshik turli tomonda turishi kerak.
"""

from dxf_generator import generate_furniture_dxf


def panel_with_corner_hole(label, x_offset, y_offset, rot):
    return {
        "part": {
            "label": f"{label} (rot={rot})",
            "shape": {"w_mm": 600, "h_mm": 400},
            "edge_banding": {
                "left_mm": 0, "right_mm": 0,
                "top_mm": 0, "bottom_mm": 0,
            },
            "operations": [
                {
                    "type": "drill",
                    "x_mm": 50,
                    "y_mm": 50,
                    "diameter_mm": 35,
                    "depth_mm": 12.5,
                },
                {
                    "type": "drill",
                    "x_mm": 150,
                    "y_mm": 50,
                    "diameter_mm": 8,
                    "depth_mm": 10,
                },
            ],
        },
        "transform": {"x_mm": x_offset, "y_mm": y_offset, "rot_deg": rot},
        "sheet_index": 0,
    }


# Bo'shliq qo'yish uchun panel o'lchami + 100mm
GAP = 100
PW, PH = 600, 400

cut_layout = {
    "sheets_used": 1,
    "placements": [
        # Pastki qator: rot=0, rot=90
        panel_with_corner_hole("Original", 0, 0, 0),
        # rot=90 da panel egallaydigan joy h x w bo'ladi
        panel_with_corner_hole("90 derak", PW + GAP, 0, 90),
        # Yuqori qator: rot=180, rot=270
        panel_with_corner_hole("180 derak", 0, PH + GAP, 180),
        panel_with_corner_hole("270 derak", PW + GAP, PH + GAP, 270),
    ],
}


if __name__ == "__main__":
    path = generate_furniture_dxf(cut_layout, project_id="rotation_test")
    print(f"Yaratildi: {path}")
    print("\nKutilgan natija:")
    print("  rot=0   : 35mm teshik chap-past burchakda (x=50, y=50)")
    print("  rot=90  : 35mm teshik o'ng-past burchakda")
    print("  rot=180 : 35mm teshik o'ng-yuqori burchakda")
    print("  rot=270 : 35mm teshik chap-yuqori burchakda")
