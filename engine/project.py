"""
Project builder — bir nechta kabinetni bitta loyiha sifatida yig'ish.

Foydalanish:
    cabinets = [
        {"id": "K1", "type": "wall", "width": 600},
        {"id": "K2", "type": "base", "width": 800},
        {"id": "K3", "type": "tall", "width": 600},
    ]
    panels = build_project(cabinets)
    layout = layout_panels_simple(panels)
    generate_furniture_dxf(layout, project_id="kuxnya_ivanov")
"""

from cabinet import (
    build_cabinet,
    layout_panels_simple,
    validate_parts,
    CABINET_TYPE_DEFAULTS,
)


def build_project(cabinets_config, *, validate=True):
    """Kabinetlar ro'yxatidan barcha panellarni yig'adi.

    cabinets_config — har bir kabinet uchun dict ro'yxati:
      {
        "id": "K1",                    # majburiy: kabinet identifikatori
        "type": "wall" | "base" | "tall",  # majburiy: kabinet turi
        "width": 600,                  # majburiy: kenglik
        "height": None,                # ixtiyoriy: balandlik (default — turga qarab)
        "depth": None,                 # ixtiyoriy: chuqurlik
        "num_shelves": None,           # ixtiyoriy: polkalar soni
        "with_door": True,             # ixtiyoriy
      }

    validate=True bo'lsa, hosil bo'lgan barcha panellar
    `contracts/part.schema.json` ga qarshi tekshiriladi (CONVENTIONS qulfi).
    Schema buzilsa ValueError tashlanadi va pipeline to'xtaydi.

    Qaytaradi: barcha panellar ro'yxati (har bir panel "id: name" labeli bilan)
    """
    all_panels = []
    summary = []

    for idx, cfg in enumerate(cabinets_config):
        cab_id = cfg.get("id") or f"K{idx + 1}"
        cab_type = cfg.get("type", "wall")
        width = cfg.get("width")
        if width is None:
            raise ValueError(f"Kabinet {cab_id!r}: width majburiy")

        panels = build_cabinet(
            width=width,
            height=cfg.get("height"),
            depth=cfg.get("depth"),
            num_shelves=cfg.get("num_shelves"),
            with_door=cfg.get("with_door", True),
            cabinet_type=cab_type,
            cabinet_id=cab_id,
        )
        all_panels.extend(panels)

        # Statistika uchun
        defaults = CABINET_TYPE_DEFAULTS[cab_type]
        actual_height = cfg.get("height") or defaults["height"]
        actual_depth = cfg.get("depth") or defaults["depth"]
        summary.append({
            "id": cab_id,
            "type": cab_type,
            "dimensions": f"{width}x{actual_height}x{actual_depth}",
            "panel_count": len(panels),
        })

    # CONVENTIONS qulfi: pipeline boshlamaydi, agar contract buzilsa.
    # Bu run-time guard 3 dasturchi bilan ishlaganda eng muhim himoya.
    if validate:
        validate_parts(all_panels)

    return all_panels, summary


def print_project_summary(summary, total_panels, sheets_used):
    print("=" * 60)
    print("LOYIHA XULOSASI")
    print("=" * 60)
    for s in summary:
        print(
            f"  [{s['id']:>4s}] {s['type']:5s}  "
            f"{s['dimensions']:>15s}  ({s['panel_count']} panel)"
        )
    print("-" * 60)
    print(f"  Jami kabinet:  {len(summary)}")
    print(f"  Jami panel:    {total_panels}")
    print(f"  Jami list:     {sheets_used}")
    print("=" * 60)


__all__ = [
    "build_project",
    "layout_panels_simple",
    "print_project_summary",
]
