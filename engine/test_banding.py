"""
Edge banding test: 4 ta bir xil panel, har birida turli banding konfiguratsiyasi.
DXF da kesish (qizil) konturi banding qiymatiga qarab ichkariga surilishi kerak.

Hammasi 600x400 panel (label-da yozilgan o'lcham).
Lekin kesish to'rtburchagi banding bo'lgan tomonlardan ichkariga siljishi kerak.
"""

from dxf_generator import generate_furniture_dxf


def panel_with_banding(label, x_offset, banding):
    return {
        "part": {
            "label": label,
            "shape": {"w_mm": 600, "h_mm": 400},
            "edge_banding": banding,
            "operations": [],
        },
        "transform": {"x_mm": x_offset, "y_mm": 0, "rot_deg": 0},
        "sheet_index": 0,
    }


GAP = 100
PW = 600

cut_layout = {
    "sheets_used": 1,
    "placements": [
        # 1) Banding YO'Q — kesish to'liq 600x400
        panel_with_banding(
            "Banding yo'q",
            0,
            {"left_mm": 0, "right_mm": 0, "top_mm": 0, "bottom_mm": 0},
        ),
        # 2) Faqat oldingi (yuqori) chetda 2mm — kesish 600 x 398
        panel_with_banding(
            "Faqat tepa: 2mm",
            (PW + GAP) * 1,
            {"left_mm": 0, "right_mm": 0, "top_mm": 2, "bottom_mm": 0},
        ),
        # 3) Chap va o'ng 2mm — kesish 596 x 400
        panel_with_banding(
            "Chap+ong: 2+2mm",
            (PW + GAP) * 2,
            {"left_mm": 2, "right_mm": 2, "top_mm": 0, "bottom_mm": 0},
        ),
        # 4) Hamma yon 2mm — kesish 596 x 396
        panel_with_banding(
            "4 tomon: 2mm",
            (PW + GAP) * 3,
            {"left_mm": 2, "right_mm": 2, "top_mm": 2, "bottom_mm": 2},
        ),
    ],
}


if __name__ == "__main__":
    path = generate_furniture_dxf(cut_layout, project_id="banding_test")
    print(f"Yaratildi: {path}")
    print("\nKutilgan kesish o'lchamlari:")
    print("  1) Banding yo'q     : 600 x 400 (panel chetiga teng)")
    print("  2) Faqat tepa 2mm   : 600 x 398 (yuqoridan 2mm ichkari)")
    print("  3) Chap+o'ng 2+2mm  : 596 x 400")
    print("  4) 4 tomon 2mm      : 596 x 396")
