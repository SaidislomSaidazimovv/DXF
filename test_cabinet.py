"""
To'liq kabinet test: 600x720x320mm devor kabineti, 1 polka, 1 eshik bilan.
"""

from cabinet import build_cabinet, layout_panels_simple
from dxf_generator import generate_furniture_dxf


def main():
    panels = build_cabinet(
        width=600,
        height=720,
        depth=320,
        num_shelves=1,
        with_door=True,
    )

    print(f"Yaratilgan panellar: {len(panels)} ta")
    for p in panels:
        w = p["shape"]["w_mm"]
        h = p["shape"]["h_mm"]
        ops = len(p["operations"])
        print(f"  - {p['label']:25s}  {w:5.0f} x {h:5.0f} mm   ({ops} operatsiya)")

    layout = layout_panels_simple(panels)
    print(f"\nIshlatilgan listlar: {layout['sheets_used']}")

    path = generate_furniture_dxf(layout, project_id="cabinet_600x720")
    print(f"\nDXF: {path}")


if __name__ == "__main__":
    main()
