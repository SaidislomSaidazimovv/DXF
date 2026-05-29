"""
Schema migration test — har turdagi kabinet build_cabinet() chiqimi
contracts/part.schema.json ga mos kelishini tasdiqlaydi.

Shuningdek schema buzilishini ham sinaymiz: noto'g'ri panel yasab
validate_parts ValueError tashlashi kerak.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from cabinet import build_cabinet, validate_parts
from project import build_project


def assert_part_id_format(panels, label):
    import re
    pat = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")
    for p in panels:
        assert "part_id" in p, f"{label}: {p['label']} part_id yo'q"
        assert pat.match(p["part_id"]), f"{label}: {p['part_id']} format buzilgan"


def assert_required_fields(panels, label):
    required = {"part_id", "label", "shape", "material_id", "edge_banding", "operations"}
    for p in panels:
        missing = required - set(p.keys())
        assert not missing, f"{label}: {p['part_id']} maydonlar yo'q: {missing}"
        assert "thickness_mm" in p["shape"], f"{label}: shape.thickness_mm yo'q"


def assert_ops_have_face(panels, label):
    for p in panels:
        for op in p["operations"]:
            if op.get("type") == "drill":
                assert "face" in op, f"{label}: {p['part_id']} operatsiyada face yo'q"
                assert op["face"] in ("A", "B"), f"{label}: face xato — {op['face']}"


def test_wall_cabinet():
    panels = build_cabinet(width=600, cabinet_type="wall", cabinet_id="W1")
    assert_part_id_format(panels, "wall")
    assert_required_fields(panels, "wall")
    assert_ops_have_face(panels, "wall")
    validate_parts(panels)
    print(f"  OK  wall   ({len(panels)} panel)")


def test_base_cabinet():
    panels = build_cabinet(width=600, cabinet_type="base", cabinet_id="B1")
    assert_part_id_format(panels, "base")
    assert_required_fields(panels, "base")
    validate_parts(panels)
    print(f"  OK  base   ({len(panels)} panel)")


def test_tall_cabinet():
    panels = build_cabinet(width=600, cabinet_type="tall", cabinet_id="T1")
    assert_part_id_format(panels, "tall")
    assert_required_fields(panels, "tall")
    # Tall: 2 eshik → 4 petlya yon panelda + 4 chashka eshikda
    side = next(p for p in panels if p["part_id"] == "t1.chap_yon")
    hinges = [op for op in side["operations"] if op.get("purpose") == "hinge"]
    assert len(hinges) == 4, f"Tall yon panelda 4 petlya kutilgan, lekin {len(hinges)}"

    cup_holes = []
    for p in panels:
        for op in p["operations"]:
            if op.get("purpose") == "cup":
                cup_holes.append(op)
    assert len(cup_holes) == 4, f"Tall da 4 chashka kutilgan, lekin {len(cup_holes)}"

    validate_parts(panels)
    print(f"  OK  tall   ({len(panels)} panel, 4 hinge + 4 cup mosligi)")


def test_door_face_is_B():
    """Eshik chashkalari Face B da bo'lishi kerak (CONVENTIONS §1)."""
    panels = build_cabinet(width=600, cabinet_type="wall", cabinet_id="W1")
    eshik = next(p for p in panels if p["part_id"] == "w1.eshik")
    for op in eshik["operations"]:
        assert op["face"] == "B", f"Eshik op face B kutilgan, lekin {op['face']}"
        assert op["purpose"] == "cup"
    print(f"  OK  eshik chashkalari Face B da, purpose='cup'")


def test_back_panel_material():
    """Orqa devor material_id = hdf_4_back, thickness 4mm."""
    panels = build_cabinet(width=600, cabinet_type="wall", cabinet_id="W1")
    orqa = next(p for p in panels if "orqa" in p["part_id"])
    assert orqa["material_id"] == "hdf_4_back", f"orqa material xato: {orqa['material_id']}"
    assert orqa["shape"]["thickness_mm"] == 4.0, f"orqa thickness xato: {orqa['shape']['thickness_mm']}"
    assert orqa["grain_locked"] is False, "HDF orqa grain_locked=False bo'lishi kerak"
    print(f"  OK  orqa devor: material=hdf_4_back, thickness=4.0, grain_locked=False")


def test_full_project_validates():
    """build_project validation yoqilgan holatda muvaffaqiyatli ishlashi kerak."""
    panels, _ = build_project([
        {"id": "W1", "type": "wall", "width": 600},
        {"id": "B1", "type": "base", "width": 800},
        {"id": "T1", "type": "tall", "width": 600},
    ])
    print(f"  OK  full project ({len(panels)} panel) validation o'tdi")


def test_validation_catches_bug():
    """Maxsus buzilgan panel — validate_parts ValueError tashlashi shart."""
    panels = build_cabinet(width=600, cabinet_type="wall", cabinet_id="W1")
    # Bilib turib buzamiz
    panels[0]["shape"]["w_mm"] = -100  # noto'g'ri qiymat
    try:
        validate_parts(panels)
    except ValueError as e:
        assert "w_mm" in str(e) or "minimum" in str(e), f"Xato xabari noto'g'ri: {e}"
        print(f"  OK  validation buzilgan panelni tutdi (w_mm=-100)")
        return
    raise AssertionError("validate_parts xato bermadi — bu yomon")


def main():
    print("Schema migration testi:")
    print("=" * 60)
    test_wall_cabinet()
    test_base_cabinet()
    test_tall_cabinet()
    test_door_face_is_B()
    test_back_panel_material()
    test_full_project_validates()
    test_validation_catches_bug()
    print("=" * 60)
    print("Hammasi OK — Code <-> Schema migration to'liq mos.")


if __name__ == "__main__":
    main()
