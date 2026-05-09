"""
Fixture 05 (transform math) ni haqiqiy dxf_generator.apply_transform ga
qarshi tekshiradi. CONVENTIONS.md §3 formulalari bilan kod mos kelishi shart.

Foydalanish:
    python tests/verify_transform_math.py
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dxf_generator import apply_transform


def main() -> int:
    fixture = json.loads((ROOT / "tests" / "fixtures" / "05_transform_math.json").read_text(encoding="utf-8"))

    part = fixture["part"]
    pw = part["shape"]["w_mm"]
    ph = part["shape"]["h_mm"]
    drill = part["operations"][0]
    tol = fixture["tolerance_mm"]

    failures = 0
    print(f"Tolerance: {tol} mm")
    print(f"Local drill: ({drill['x_mm']}, {drill['y_mm']}) on panel {pw}x{ph}\n")

    for case in fixture["expected_global_drill_positions"]:
        t = case["transform"]
        expected = case["expected_global"]

        actual = apply_transform(
            drill["x_mm"], drill["y_mm"], pw, ph,
            {"x_mm": t["x_mm"], "y_mm": t["y_mm"], "rot_deg": t["rot_deg"]}
        )
        ax, ay = actual
        ex, ey = expected["x_mm"], expected["y_mm"]
        ok = abs(ax - ex) <= tol and abs(ay - ey) <= tol
        mark = "OK  " if ok else "XATO"
        print(f"  [{mark}] {case['case']}")
        print(f"        kutilgan: ({ex}, {ey})  haqiqiy: ({ax}, {ay})")
        if not ok:
            failures += 1
            print(f"        formula: {case['formula']}")

    print(f"\n{'OK' if failures == 0 else 'XATO'} — {len(fixture['expected_global_drill_positions'])} test, {failures} xato")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
