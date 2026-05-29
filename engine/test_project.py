"""
Real kuxnya loyiha testi:
- 3 ta devor kabinet (yuqorida)
- 3 ta past kabinet (yerda)
- 1 ta baland shkaf (sovutgich uchun yon yoki muzlatkich kabineti)

Total 7 ta kabinet — odatdagi kichik kuxnya.
"""

from project import build_project, layout_panels_simple, print_project_summary
from dxf_generator import generate_furniture_dxf


# Kuxnya konfiguratsiya
kuxnya = [
    # --- Devor kabinetlari (yuqori qator, 720mm balandlik) ---
    {"id": "W1", "type": "wall", "width": 600, "num_shelves": 1},
    {"id": "W2", "type": "wall", "width": 800, "num_shelves": 1},
    {"id": "W3", "type": "wall", "width": 400, "num_shelves": 1},

    # --- Past kabinetlari (820mm balandlik, 600mm chuqurlik) ---
    {"id": "B1", "type": "base", "width": 600, "num_shelves": 1},
    {"id": "B2", "type": "base", "width": 800, "num_shelves": 0},  # tortma kabinet (polka yo'q)
    {"id": "B3", "type": "base", "width": 400, "num_shelves": 1},

    # --- Baland shkaf (oziq-ovqat) ---
    {"id": "T1", "type": "tall", "width": 600, "num_shelves": 4},
]


def main():
    panels, summary = build_project(kuxnya)
    layout = layout_panels_simple(panels)

    print_project_summary(
        summary=summary,
        total_panels=len(panels),
        sheets_used=layout["sheets_used"],
    )

    # Har bir kabinet panel ro'yxatini ko'rsatish (qisqa shaklda)
    print("\nPanellar ro'yxati (kabinet bo'yicha):")
    current_cab = None
    for p in panels:
        # Label "K1: Chap yon" formatida — id ni ajratamiz
        if ":" in p["label"]:
            cab_id = p["label"].split(":", 1)[0].strip()
        else:
            cab_id = "—"
        if cab_id != current_cab:
            print(f"\n  [{cab_id}]")
            current_cab = cab_id
        w = p["shape"]["w_mm"]
        h = p["shape"]["h_mm"]
        ops = len(p["operations"])
        name = p["label"].split(":", 1)[1].strip() if ":" in p["label"] else p["label"]
        print(f"    {name:25s}  {w:5.0f} x {h:5.0f} mm   ({ops} op)")

    path = generate_furniture_dxf(layout, project_id="kuxnya_demo")
    print(f"\nDXF: {path}")


if __name__ == "__main__":
    main()
