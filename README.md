# Mebelchi

Toshkent mebel ustalari uchun kuxnya loyihalash → ChPU (CNC) fayl
generatsiya tizimi. Loyiha **ikki qismdan** iborat:

```
DXF/
├─ mebelchi-app/      🟩 Mobil ilova (Expo + React Native + TypeScript)
│                        6-bosqichli UI: Замер → Реж → Созлаш →
│                        Инженерия → Расчёт → ЧПУ. Bu — foydalanuvchi
│                        ko'radigan qism. Hozir mock data bilan ishlaydi.
│
├─ engine (root)      🟦 Python DXF backend — real kesish/sverlovka fayl
│   ├─ cabinet.py        generatori. Kelajakda (HANDOVER Day 14)
│   ├─ dxf_generator.py  mebelchi-app'ga ulanadi.
│   ├─ project.py
│   ├─ preview3d.py
│   ├─ gui.py            desktop GUI (engine test uchun)
│   ├─ streamlit_app.py  web demo
│   ├─ contracts/        JSON schema'lar (part, transform)
│   ├─ data/             material katalogi (catalog.json, materials.json)
│   ├─ tests/ + test_*.py
│   └─ katalog.xlsx      katalog manbasi (Excel)
│
└─ docs/              🟨 Dizayn hujjatlari
    ├─ handover-v2/      JORIY spec (Oppoq) — shu bo'yicha quramiz
    │   ├─ HANDOVER_UI_V2.md
    │   ├─ UI_TYPES_V2.ts
    │   └─ 00_CJM_V1.md
    ├─ 10_UI_PRINCIPLES.md   UI tamoyillari (joriy)
    ├─ STACK.md              texnik stack xulosasi
    └─ archive-v1/           eskirgan V1 hujjatlar + eski prototiplar
```

## Mebelchi app (UI)

```bash
cd mebelchi-app
npm install
npx expo start          # telefonda Expo Go orqali
npm run typecheck       # TypeScript tekshiruvi
npx expo export --platform web   # web build → dist/
```

Web demo: https://saidislomsaidazimovv.github.io/DXF/app/
(desktop'da telefon ramkasida ko'rinadi)

## Python engine (DXF backend)

```bash
pip install -r requirements.txt
python gui.py           # desktop GUI
streamlit run streamlit_app.py   # web demo
pytest                  # testlar
```

## Ikki qism qanday bog'lanadi

Hozir `mebelchi-app` Phase F'da **mock** DXF/MPR/CIX fayl chiqaradi.
HANDOVER §0 bo'yicha: avval UI shell tugaydi va tasdiqlanadi, **keyin**
(Day 14) Python engine ulanadi. Shунинг учун ikkalasi alohida turadi —
UI hissi tasdiqlangach engine ulanadi.
