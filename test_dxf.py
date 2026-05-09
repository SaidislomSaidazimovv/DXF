"""
Test: 2 ta yon panel (chap + o'ng, ko'zgu teshiklar) bitta listga.
"""

from dxf_generator import generate_furniture_dxf


def make_side_panel(label, mirror=False, x_offset=0):
    hole_x = 685 if mirror else 35
    return {
        "part": {
            "label": label,
            "shape": {"w_mm": 720, "h_mm": 580},
            "edge_banding": {
                "left_mm": 0 if mirror else 2.0,
                "right_mm": 2.0 if mirror else 0,
                "top_mm": 2.0,
                "bottom_mm": 0,
            },
            "operations": [
                {
                    "type": "drill",
                    "x_mm": hole_x,
                    "y_mm": 100,
                    "diameter_mm": 35,
                    "depth_mm": 12.5,
                },
                {
                    "type": "drill",
                    "x_mm": hole_x,
                    "y_mm": 450,
                    "diameter_mm": 35,
                    "depth_mm": 12.5,
                },
            ],
        },
        "transform": {"x_mm": x_offset, "y_mm": 0, "rot_deg": 0},
        "sheet_index": 0,
    }


cut_layout = {
    "sheets_used": 1,
    "placements": [
        make_side_panel("Chap yon panel", mirror=False, x_offset=0),
        make_side_panel("O'ng yon panel", mirror=True, x_offset=724),
    ],
}


if __name__ == "__main__":
    path = generate_furniture_dxf(cut_layout, project_id=1)
    print(f"Yaratildi: {path}")
