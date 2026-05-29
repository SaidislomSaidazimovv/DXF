"""
Contract validation — har bir fixture va material faylini schemaga tekshiradi.

Foydalanish:
    python tests/validate_contracts.py

CI da: agar schema validation chiqib qolsa, exit code 1 bilan tugaydi
(GitHub Actions / pre-commit hook avtomat to'xtatadi).
"""

import json
import sys
from pathlib import Path

try:
    from jsonschema import Draft202012Validator
except ImportError:
    print("XATO: jsonschema kutubxona yo'q. O'rnating: pip install jsonschema")
    sys.exit(2)


ROOT = Path(__file__).resolve().parent.parent
CONTRACTS = ROOT / "contracts"
FIXTURES = ROOT / "tests" / "fixtures"
DATA = ROOT / "data"


def load_json(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate(instance, schema, label: str) -> list:
    """Bitta instance ni schema ga tekshiradi. Xatolar ro'yxatini qaytaradi."""
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(instance), key=lambda e: e.path)
    return [f"  {label}: {'.'.join(str(p) for p in e.absolute_path) or '<root>'} — {e.message}"
            for e in errors]


def strip_comments(d):
    """JSON ichidagi _comment va _contract kalitlarini olib tashlash (validation uchun)."""
    if isinstance(d, dict):
        return {k: strip_comments(v) for k, v in d.items() if not k.startswith("_")}
    if isinstance(d, list):
        return [strip_comments(x) for x in d]
    return d


def main() -> int:
    failures = []
    checked = 0

    # 1) Schemalarni yuklash
    part_schema = load_json(CONTRACTS / "part.schema.json")
    transform_schema = load_json(CONTRACTS / "transform.schema.json")

    # 2) Fixturelar — har birini Part schemaga tekshirish
    print("=== Fixturelarni tekshiraman ===")
    for fixture_file in sorted(FIXTURES.glob("*.json")):
        raw = load_json(fixture_file)
        clean = strip_comments(raw)

        # 03_mirrored_pair: pair[] — har ikkalasini alohida
        if "pair" in clean:
            for i, part in enumerate(clean["pair"]):
                errs = validate(part, part_schema, f"{fixture_file.name}#{i}")
                if errs:
                    failures.extend(errs)
                checked += 1
            print(f"  {fixture_file.name}: pair[] ({len(clean['pair'])} part)")
            continue

        # 05_transform_math: part + expected
        if "part" in clean and "expected_global_drill_positions" in clean:
            errs = validate(clean["part"], part_schema, fixture_file.name)
            if errs:
                failures.extend(errs)
            # Expected positions ham transform schemaga tekshirilsin
            for j, case in enumerate(clean["expected_global_drill_positions"]):
                errs = validate(case["transform"], transform_schema, f"{fixture_file.name}#case{j}")
                if errs:
                    failures.extend(errs)
            checked += 1
            print(f"  {fixture_file.name}: part + {len(clean['expected_global_drill_positions'])} transform case")
            continue

        # Oddiy single Part fixture
        errs = validate(clean, part_schema, fixture_file.name)
        if errs:
            failures.extend(errs)
        checked += 1
        print(f"  {fixture_file.name}: single part")

    # 3) MaterialCatalog — material_id format va shape sanity
    print("\n=== MaterialCatalog ===")
    materials = load_json(DATA / "materials.json")
    for mid, mat in materials.items():
        if mid.startswith("_"):
            continue
        if not mid.replace("_", "").isalnum() or not mid.islower():
            failures.append(f"  materials.json: '{mid}' material_id format buzilgan (faqat lowercase + raqam + _)")
        if not all(k in mat for k in ("name", "thickness_mm", "sheet_w_mm", "sheet_h_mm")):
            failures.append(f"  materials.json: '{mid}' majburiy maydonlar yo'q")
        checked += 1
    print(f"  {len([k for k in materials if not k.startswith('_')])} ta material tekshirildi")

    # 4) Cross-check: fixturelardagi material_id materials.json da bormi?
    print("\n=== Material foreign key cross-check ===")
    valid_mids = {k for k in materials if not k.startswith("_")}
    for fixture_file in sorted(FIXTURES.glob("*.json")):
        raw = load_json(fixture_file)
        clean = strip_comments(raw)

        def collect_mids(d, found):
            if isinstance(d, dict):
                if "material_id" in d:
                    found.append(d["material_id"])
                for v in d.values():
                    collect_mids(v, found)
            elif isinstance(d, list):
                for x in d:
                    collect_mids(x, found)

        mids = []
        collect_mids(clean, mids)
        for mid in mids:
            if mid not in valid_mids:
                failures.append(f"  {fixture_file.name}: material_id='{mid}' materials.json da yo'q")
        if mids:
            print(f"  {fixture_file.name}: {len(mids)} foreign key OK")

    # Hisobot
    print("\n" + "=" * 60)
    if failures:
        print(f"VALIDATION XATO ({len(failures)} ta):")
        for f in failures:
            print(f)
        print(f"\nJami tekshirildi: {checked}, xato: {len(failures)}")
        return 1
    print(f"OK — barcha {checked} ta artifact contract bilan mos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
