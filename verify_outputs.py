"""
Generated DXF fayllarni dasturiy tekshirish: entity sonini layer bo'yicha hisoblash.
"""

import ezdxf
from collections import Counter
from pathlib import Path


def summarize(dxf_path):
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()
    counts = Counter()
    for entity in msp:
        layer = entity.dxf.layer
        counts[(layer, entity.dxftype())] += 1
    return counts


def fmt(counts):
    lines = []
    for (layer, etype), n in sorted(counts.items()):
        lines.append(f"    {layer:15s} {etype:15s} {n:3d}")
    return "\n".join(lines)


outputs = [
    ("Asosiy test (2 yon panel)", "output/project_1/cutting_plan.dxf"),
    ("Burilish testi", "output/project_rotation_test/cutting_plan.dxf"),
    ("Banding testi", "output/project_banding_test/cutting_plan.dxf"),
    ("Kabinet (600x720)", "output/project_cabinet_600x720/cutting_plan.dxf"),
    ("Kuxnya (7 kabinet)", "output/project_kuxnya_demo/cutting_plan.dxf"),
]

for label, path in outputs:
    if not Path(path).exists():
        print(f"\n{label}: FAYL YO'Q ({path})")
        continue
    print(f"\n=== {label} ===")
    print(f"  fayl: {path}")
    counts = summarize(path)
    total = sum(counts.values())
    print(f"  jami entity: {total}")
    print(fmt(counts))
