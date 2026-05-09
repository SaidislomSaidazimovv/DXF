"""
Streamlit wrapper — namuna (prototype) demoni Streamlit Cloud orqali link sifatida ulashish.

Foydalanuvchi (xo'jayin / advisor):
  1. Linkni bossa, parol so'raladi
  2. Forma: kuxnya konfiguratsiyasini tahrir qilish (kabinet qo'shish/o'chirish)
  3. "DXF YARATISH" yoki "3D KO'RISH" tugmasi
  4. Fayllarni download qiladi yoki 3D ni brauzerda ko'radi

Bu Streamlit app — V1 SaaS EMAS, faqat namuna ko'rsatish uchun.
Real product Flutter PWA + FastAPI backend bo'ladi.

Ishga tushirish (lokal):
    streamlit run streamlit_app.py

Deploy (Streamlit Cloud):
    streamlit.io/cloud → New app → repo: SaidislomSaidazimovv/DXF
    Main file: streamlit_app.py
    Secrets:  DEMO_PAROL = "kuxnya2026"
"""

import os
import time
import tempfile
from pathlib import Path

import streamlit as st

from project import build_project, layout_panels_simple
from dxf_generator import generate_furniture_dxf
from preview3d import generate_3d_preview
from cabinet import CABINET_TYPE_DEFAULTS


# ============================================================================
# Sahifa konfiguratsiyasi
# ============================================================================
st.set_page_config(
    page_title="Kuxnya Generator — namuna",
    page_icon="🏭",
    layout="wide",
)


# ============================================================================
# Parol qulfi
# ============================================================================
def check_password() -> None:
    """Foydalanuvchini parol bilan tekshiradi. Noto'g'ri bo'lsa app to'xtaydi."""
    if "auth" not in st.session_state:
        st.session_state.auth = False

    if st.session_state.auth:
        return

    st.title("🔒 Kirish")
    st.caption("Bu — Kuxnya Generator namunasi. Demo'ga kirish uchun parol kerak.")

    with st.form("login", clear_on_submit=False):
        pwd = st.text_input("Maxfiy kod:", type="password")
        ok = st.form_submit_button("Kirish")

    if ok:
        # Streamlit Cloud da: secrets.toml dan; lokalda — fallback
        expected = st.secrets.get("DEMO_PAROL", os.environ.get("DEMO_PAROL", "kuxnya2026"))
        if pwd == expected:
            st.session_state.auth = True
            st.rerun()
        else:
            st.error("Noto'g'ri parol")
    st.stop()


check_password()


# ============================================================================
# Asosiy interfeys
# ============================================================================
st.title("🏭 Kuxnya Generator (namuna)")
st.caption(
    "DXF (CNC mashina uchun) + 3D HTML (mijozga ko'rsatish uchun) — bir formaga "
    "o'lchamlarni kiritib, bir necha sekundda ikki natija."
)


# Demo cabinets (dastlabki kirishda)
DEFAULT_CABINETS = [
    {"id": "W1", "type": "wall", "width": 600, "num_shelves": 1, "with_door": True},
    {"id": "W2", "type": "wall", "width": 800, "num_shelves": 1, "with_door": True},
    {"id": "W3", "type": "wall", "width": 400, "num_shelves": 1, "with_door": True},
    {"id": "B1", "type": "base", "width": 600, "num_shelves": 1, "with_door": True},
    {"id": "B2", "type": "base", "width": 800, "num_shelves": 0, "with_door": True},
    {"id": "B3", "type": "base", "width": 400, "num_shelves": 1, "with_door": True},
    {"id": "T1", "type": "tall", "width": 600, "num_shelves": 4, "with_door": True},
]

if "cabinets" not in st.session_state:
    st.session_state.cabinets = list(DEFAULT_CABINETS)


# === Yon panel: kabinet qo'shish formasi ===
with st.sidebar:
    st.header("➕ Yangi kabinet")

    next_idx = len(st.session_state.cabinets) + 1
    new_id = st.text_input("ID", value=f"K{next_idx}")
    type_label = {"wall": "🔝 Devor", "base": "🪑 Past (yerda)", "tall": "📦 Baland shkaf"}
    new_type = st.selectbox(
        "Turi",
        options=["wall", "base", "tall"],
        format_func=lambda x: type_label[x],
    )
    defs = CABINET_TYPE_DEFAULTS[new_type]

    new_width = st.number_input("Kenglik (mm)", min_value=200, max_value=2400, value=600, step=50)
    new_height = st.number_input(
        f"Balandlik (mm) — 0 = avtomat ({defs['height']})",
        min_value=0, max_value=2500, value=0, step=10,
    )
    new_depth = st.number_input(
        f"Chuqurlik (mm) — 0 = avtomat ({defs['depth']})",
        min_value=0, max_value=800, value=0, step=10,
    )
    new_shelves = st.number_input(
        f"Polka soni — default {defs['num_shelves']}",
        min_value=0, max_value=10, value=int(defs["num_shelves"]), step=1,
    )
    new_door = st.checkbox("Eshik bilan", value=True)

    if st.button("➕ Qo'shish", type="primary", use_container_width=True):
        if any(c["id"] == new_id for c in st.session_state.cabinets):
            st.error(f"'{new_id}' allaqachon bor")
        elif not new_id.strip():
            st.error("ID bo'sh bo'lmasligi kerak")
        else:
            entry = {"id": new_id.strip(), "type": new_type, "width": int(new_width)}
            if new_height > 0:
                entry["height"] = int(new_height)
            if new_depth > 0:
                entry["depth"] = int(new_depth)
            entry["num_shelves"] = int(new_shelves)
            entry["with_door"] = new_door
            st.session_state.cabinets.append(entry)
            st.rerun()

    st.divider()
    if st.button("🔄 Demo ro'yxatni qaytarish", use_container_width=True):
        st.session_state.cabinets = list(DEFAULT_CABINETS)
        st.rerun()
    if st.button("🗑 Hammasini tozalash", use_container_width=True):
        st.session_state.cabinets = []
        st.rerun()


# === Asosiy ustun: ro'yxat va generatsiya ===
st.subheader(f"📋 Loyihadagi kabinetlar ({len(st.session_state.cabinets)})")

if not st.session_state.cabinets:
    st.info("Kabinet yo'q. Chap formadan qo'shing yoki demo ro'yxatni qaytaring.")
else:
    # Jadval shaklida ko'rsatish
    rows = []
    for cab in st.session_state.cabinets:
        cab_defs = CABINET_TYPE_DEFAULTS[cab["type"]]
        rows.append({
            "ID": cab["id"],
            "Turi": cab["type"],
            "Kenglik": f"{cab['width']} mm",
            "Balandlik": f"{cab.get('height', cab_defs['height'])} mm",
            "Chuqurlik": f"{cab.get('depth', cab_defs['depth'])} mm",
            "Polka": cab.get("num_shelves", cab_defs["num_shelves"]),
            "Eshik": "✓" if cab.get("with_door", True) else "—",
        })
    st.dataframe(rows, use_container_width=True, hide_index=True)

    # O'chirish
    ids = [c["id"] for c in st.session_state.cabinets]
    to_remove = st.multiselect("O'chirish uchun tanlang:", ids, key="rm_select")
    if st.button("🗑 Tanlanganni o'chirish", disabled=not to_remove):
        st.session_state.cabinets = [
            c for c in st.session_state.cabinets if c["id"] not in to_remove
        ]
        st.rerun()


st.divider()

# === Generatsiya ===
st.subheader("⚡ Generatsiya")

proj_name = st.text_input("Loyiha nomi", value="kuxnya_demo")
sanitized_name = "".join(ch if ch.isalnum() or ch == "_" else "_" for ch in proj_name) or "demo"

col1, col2 = st.columns(2)
gen_dxf = col1.button(
    "⚡ DXF YARATISH (CNC uchun)",
    type="primary",
    use_container_width=True,
    disabled=not st.session_state.cabinets,
)
gen_3d = col2.button(
    "🎨 3D KO'RISH (mijozga)",
    type="primary",
    use_container_width=True,
    disabled=not st.session_state.cabinets,
)


# === DXF generatsiya ===
if gen_dxf:
    with st.spinner("DXF yaratilyapti..."):
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                t0 = time.perf_counter()
                panels, summary = build_project(st.session_state.cabinets)
                layout = layout_panels_simple(panels)
                dxf_path = generate_furniture_dxf(
                    layout, project_id=sanitized_name, output_dir=tmpdir
                )
                with open(dxf_path, "rb") as f:
                    dxf_bytes = f.read()
                elapsed = time.perf_counter() - t0
        except Exception as e:
            st.error(f"DXF yaratishda xato: {e}")
            st.stop()

    n_cab = len(summary)
    n_panel = len(panels)
    n_sheet = layout["sheets_used"]

    st.success(f"✓ DXF tayyor — {n_cab} kabinet, {n_panel} panel, {n_sheet} list ({elapsed:.2f} sek)")

    metric_cols = st.columns(4)
    metric_cols[0].metric("Kabinet", n_cab)
    metric_cols[1].metric("Panel", n_panel)
    metric_cols[2].metric("List (LDSP)", n_sheet)
    metric_cols[3].metric("Vaqt", f"{elapsed:.2f} s")

    st.download_button(
        label="📥 DXF download",
        data=dxf_bytes,
        file_name=f"{sanitized_name}_cutting_plan.dxf",
        mime="application/dxf",
        use_container_width=True,
    )

    st.caption(
        "DXF faylni LibreCAD, FreeCAD, AutoCAD yoki ShareCAD (online) da oching. "
        "CNC operator buni G-code ga o'giradi (CAM dasturi orqali) va mashinaga yuboradi."
    )


# === 3D HTML generatsiya ===
if gen_3d:
    with st.spinner("3D ko'rinish yaratilyapti..."):
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                t0 = time.perf_counter()
                html_path = generate_3d_preview(
                    st.session_state.cabinets,
                    project_id=sanitized_name,
                    output_dir=tmpdir,
                )
                with open(html_path, "rb") as f:
                    html_bytes = f.read()
                elapsed = time.perf_counter() - t0
        except Exception as e:
            st.error(f"3D yaratishda xato: {e}")
            st.stop()

    st.success(f"✓ 3D HTML tayyor ({elapsed:.2f} sek)")

    st.download_button(
        label="📥 3D HTML download",
        data=html_bytes,
        file_name=f"{sanitized_name}_3d_preview.html",
        mime="text/html",
        use_container_width=True,
    )

    st.caption(
        "🖱 Sichqoncha bilan: LMB sudrang — aylantirish, Wheel — yaqinlashtirish, "
        "RMB sudrang — surish. Korpus shaffofligini sliderdan o'zgartirib ichidagi "
        "teshik va detallarni ko'ring."
    )

    # Pastda o'rnatilgan iframe ko'rinish
    st.subheader("👁 Bu yerda 3D")
    st.components.v1.html(html_bytes.decode("utf-8"), height=720, scrolling=False)


# Footer
st.divider()
st.caption(
    "🏭 Kuxnya Generator namunasi · DXF R2010 · 3D Three.js · "
    "Bu prototipni yopiq sinov sifatida ko'rsatilmoqda. "
    "V1 SaaS Flutter PWA + FastAPI backend bilan quriladi."
)
