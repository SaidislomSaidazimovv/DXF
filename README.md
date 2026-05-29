# Mebelchi

Toshkent mebel ustalari uchun kuxnya loyihalash → ChPU (CNC) fayl
generatsiya tizimi. Loyiha **uch papkadan** iborat:

```
DXF/
├─ mebelchi-app/      🟩 Mobil ilova (Expo + React Native + TypeScript)
│                        6-bosqichli UI: Замер → Реж → Созлаш →
│                        Инженерия → Расчёт → ЧПУ. Foydalanuvchi
│                        ko'radigan qism. Hozir mock data bilan ishlaydi.
│
├─ engine/           🟦 Python DXF backend — real kesish/sverlovka fayl
│   ├─ cabinet.py        generatori. Kelajakda (HANDOVER Day 14)
│   ├─ dxf_generator.py  mebelchi-app'ga ulanadi.
│   ├─ project.py
│   ├─ preview3d.py
│   ├─ gui.py            desktop GUI (engine test uchun)
│   ├─ contracts/        JSON schema'lar (part, transform)
│   ├─ data/             material katalogi (catalog.json, materials.json)
│   ├─ tests/ + test_*.py
│   ├─ requirements.txt, run_gui.bat
│   └─ katalog.xlsx      katalog manbasi (Excel)
│
└─ docs/              🟨 Dizayn hujjatlari
    ├─ handover-v2/      JORIY spec (Oppoq) — shu bo'yicha quramiz
    ├─ 10_UI_PRINCIPLES.md   UI tamoyillari (joriy)
    ├─ STACK.md              texnik stack xulosasi
    └─ archive-v1/           eskirgan V1 hujjatlar + eski prototiplar
```

## Mebelchi app (UI)

```bash
cd mebelchi-app
npm install
npx expo start                    # telefonda Expo Go orqali
npm run typecheck                 # TypeScript tekshiruvi
npx expo export --platform web    # web build → dist/
```

Web demo: https://saidislomsaidazimovv.github.io/DXF/app/
(desktop'da telefon ramkasida ko'rinadi)

## Python engine (DXF backend)

```bash
cd engine
pip install -r requirements.txt
python gui.py     # desktop GUI
python -m pytest  # yoki test_*.py larni alohida
```

CI (`.github/workflows/contracts.yml`) har push'da engine testlarini
ishlatadi (schema validatsiya + transform math + end-to-end DXF).

## Ikki qism qanday bog'lanadi

Hozir `mebelchi-app` Phase F'da **mock** DXF/MPR/CIX fayl chiqaradi.
HANDOVER §0 bo'yicha: avval UI shell tugaydi va tasdiqlanadi, **keyin**
(Day 14) `engine/` ulanadi. Shuning uchun ikkalasi alohida turadi —
UI hissi tasdiqlangach engine ulanadi.
