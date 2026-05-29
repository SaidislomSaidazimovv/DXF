"""
Kuxnya Generator GUI — Tkinter bilan oddiy va tez ko'rinishli interfeys.

Foydalanish:
    python gui.py

Kabinet qo'shing, ro'yxatni ko'ring, "DXF YARATISH" tugmasini bosing —
DXF fayl yaratiladi va tizim default DXF viewerda avtomatik ochiladi.

Hech qanday boshqa fayllarni o'zgartirmaydi — faqat o'qiydi (project, cabinet,
dxf_generator).
"""

import os
import time
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox

from project import build_project, layout_panels_simple
from dxf_generator import generate_furniture_dxf
from cabinet import CABINET_TYPE_DEFAULTS
from preview3d import generate_3d_preview


# --- Ranglar va shrift sozlamalari ---
COLOR_BG = "#f5f5f7"
COLOR_PANEL = "#ffffff"
COLOR_PRIMARY = "#0066cc"
COLOR_PRIMARY_HOVER = "#004fa3"
COLOR_SUCCESS = "#28a745"
COLOR_DANGER = "#dc3545"
COLOR_TEXT = "#1a1a1a"
COLOR_MUTED = "#6c757d"

FONT_TITLE = ("Segoe UI", 18, "bold")
FONT_HEADER = ("Segoe UI", 12, "bold")
FONT_BODY = ("Segoe UI", 10)
FONT_BUTTON = ("Segoe UI", 11, "bold")
FONT_STAT = ("Segoe UI", 14, "bold")


CABINET_TYPE_LABELS = {
    "wall": "Devor (yuqorida)",
    "base": "Past (yerda)",
    "tall": "Baland shkaf",
}


# Demo uchun namunaviy boshlang'ich ma'lumotlar — xo'jayinga ko'rsatishga tayyor
DEMO_CABINETS = [
    {"id": "W1", "type": "wall", "width": 600, "num_shelves": 1, "with_door": True},
    {"id": "W2", "type": "wall", "width": 800, "num_shelves": 1, "with_door": True},
    {"id": "W3", "type": "wall", "width": 400, "num_shelves": 1, "with_door": True},
    {"id": "B1", "type": "base", "width": 600, "num_shelves": 1, "with_door": True},
    {"id": "B2", "type": "base", "width": 800, "num_shelves": 0, "with_door": True},
    {"id": "B3", "type": "base", "width": 400, "num_shelves": 1, "with_door": True},
    {"id": "T1", "type": "tall", "width": 600, "num_shelves": 4, "with_door": True},
]


class KuxnyaGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Kuxnya Generator — DXF avtomatik")
        self.root.geometry("1100x700")
        self.root.configure(bg=COLOR_BG)

        # State: barcha qo'shilgan kabinetlar (dict ro'yxati)
        self.cabinets = list(DEMO_CABINETS)  # demo bilan boshlanadi

        self._setup_styles()
        self._build_ui()
        self._refresh_cabinet_list()

    def _setup_styles(self):
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass

        style.configure(
            "Primary.TButton",
            font=FONT_BUTTON,
            background=COLOR_PRIMARY,
            foreground="white",
            padding=(20, 12),
            borderwidth=0,
        )
        style.map(
            "Primary.TButton",
            background=[("active", COLOR_PRIMARY_HOVER), ("pressed", COLOR_PRIMARY_HOVER)],
        )

        style.configure(
            "Success.TButton",
            font=FONT_BUTTON,
            background=COLOR_SUCCESS,
            foreground="white",
            padding=(15, 10),
            borderwidth=0,
        )
        style.map("Success.TButton", background=[("active", "#1e7e34")])

        style.configure(
            "Danger.TButton",
            font=FONT_BODY,
            background=COLOR_DANGER,
            foreground="white",
            padding=(8, 4),
            borderwidth=0,
        )
        style.map("Danger.TButton", background=[("active", "#a71d2a")])

        style.configure(
            "Card.TFrame",
            background=COLOR_PANEL,
            relief="flat",
            borderwidth=1,
        )
        style.configure("TLabel", background=COLOR_PANEL, foreground=COLOR_TEXT, font=FONT_BODY)
        style.configure("Header.TLabel", background=COLOR_PANEL, font=FONT_HEADER)
        style.configure("Muted.TLabel", background=COLOR_PANEL, foreground=COLOR_MUTED, font=FONT_BODY)

    def _build_ui(self):
        # Sarlavha
        header = tk.Frame(self.root, bg=COLOR_BG)
        header.pack(fill="x", padx=20, pady=(20, 10))
        tk.Label(
            header,
            text="🏭 Kuxnya Generator",
            font=FONT_TITLE,
            bg=COLOR_BG,
            fg=COLOR_TEXT,
        ).pack(side="left")
        tk.Label(
            header,
            text="Mebel kabinetlari → CNC kesish chizmasi (DXF)",
            font=FONT_BODY,
            bg=COLOR_BG,
            fg=COLOR_MUTED,
        ).pack(side="left", padx=(12, 0), pady=(8, 0))

        # Asosiy konteyner — 2 ustun
        main = tk.Frame(self.root, bg=COLOR_BG)
        main.pack(fill="both", expand=True, padx=20, pady=10)
        main.columnconfigure(0, weight=0, minsize=380)
        main.columnconfigure(1, weight=1)
        main.rowconfigure(0, weight=1)

        # CHAP USTUN — Kabinet qo'shish formasi
        left_card = self._make_card(main, "Yangi kabinet qo'shish")
        left_card.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        self._build_form(left_card)

        # O'NG USTUN — Kabinetlar ro'yxati + generate
        right = tk.Frame(main, bg=COLOR_BG)
        right.grid(row=0, column=1, sticky="nsew")
        right.rowconfigure(0, weight=1)
        right.rowconfigure(1, weight=0)
        right.columnconfigure(0, weight=1)

        list_card = self._make_card(right, "Loyihadagi kabinetlar")
        list_card.grid(row=0, column=0, sticky="nsew")
        self._build_list(list_card)

        action_card = self._make_card(right, "DXF yaratish")
        action_card.grid(row=1, column=0, sticky="ew", pady=(10, 0))
        self._build_action(action_card)

    def _make_card(self, parent, title):
        outer = tk.Frame(parent, bg=COLOR_BG)
        card = tk.Frame(
            outer, bg=COLOR_PANEL, highlightbackground="#dee2e6", highlightthickness=1
        )
        card.pack(fill="both", expand=True)

        if title:
            tk.Label(
                card,
                text=title,
                font=FONT_HEADER,
                bg=COLOR_PANEL,
                fg=COLOR_TEXT,
            ).pack(anchor="w", padx=16, pady=(14, 8))
            sep = tk.Frame(card, height=1, bg="#e9ecef")
            sep.pack(fill="x", padx=16)

        body = tk.Frame(card, bg=COLOR_PANEL)
        body.pack(fill="both", expand=True, padx=16, pady=12)

        # outerga body ni teshik orqali ulashish — caller bevosita body ga widget joylashtiradi
        outer.body = body
        return outer

    def _build_form(self, card):
        body = card.body

        # ID
        self._form_row(body, "ID (masalan W1):").pack(fill="x", pady=4)
        self.var_id = tk.StringVar(value=f"K{len(self.cabinets) + 1}")
        ttk.Entry(body, textvariable=self.var_id, font=FONT_BODY).pack(fill="x", pady=(0, 8))

        # Turi
        self._form_row(body, "Turi:").pack(fill="x", pady=4)
        self.var_type = tk.StringVar(value="wall")
        type_frame = tk.Frame(body, bg=COLOR_PANEL)
        type_frame.pack(fill="x", pady=(0, 8))
        for code, label in CABINET_TYPE_LABELS.items():
            tk.Radiobutton(
                type_frame,
                text=label,
                value=code,
                variable=self.var_type,
                font=FONT_BODY,
                bg=COLOR_PANEL,
                anchor="w",
                command=self._on_type_change,
            ).pack(anchor="w")

        # Kenglik
        self._form_row(body, "Kenglik (mm):").pack(fill="x", pady=4)
        self.var_width = tk.IntVar(value=600)
        ttk.Spinbox(
            body, from_=200, to=2400, increment=50,
            textvariable=self.var_width, font=FONT_BODY,
        ).pack(fill="x", pady=(0, 8))

        # Balandlik (auto/custom)
        self._form_row(body, "Balandlik (mm — bo'sh = avtomat):").pack(fill="x", pady=4)
        self.var_height = tk.StringVar(value="")
        ttk.Entry(body, textvariable=self.var_height, font=FONT_BODY).pack(fill="x", pady=(0, 8))

        # Chuqurlik
        self._form_row(body, "Chuqurlik (mm — bo'sh = avtomat):").pack(fill="x", pady=4)
        self.var_depth = tk.StringVar(value="")
        ttk.Entry(body, textvariable=self.var_depth, font=FONT_BODY).pack(fill="x", pady=(0, 8))

        # Polka soni
        self._form_row(body, "Polka soni (bo'sh = avtomat):").pack(fill="x", pady=4)
        self.var_shelves = tk.StringVar(value="")
        ttk.Spinbox(
            body, from_=0, to=10, increment=1,
            textvariable=self.var_shelves, font=FONT_BODY,
        ).pack(fill="x", pady=(0, 8))

        # Eshik
        self.var_door = tk.BooleanVar(value=True)
        tk.Checkbutton(
            body, text="Eshik bilan", variable=self.var_door,
            font=FONT_BODY, bg=COLOR_PANEL,
        ).pack(anchor="w", pady=(4, 12))

        # Qo'shish tugmasi
        ttk.Button(
            body, text="+ KABINET QO'SHISH",
            style="Success.TButton", command=self._add_cabinet,
        ).pack(fill="x")

        # Default avtomat o'lchamlarni ko'rsatish
        self._update_default_hint(body)

    def _form_row(self, parent, text):
        return tk.Label(
            parent, text=text, font=FONT_BODY,
            bg=COLOR_PANEL, fg=COLOR_TEXT, anchor="w",
        )

    def _update_default_hint(self, body):
        # Hozirgi turga qarab default qiymatlarni ko'rsatish (faqat ma'lumot uchun)
        defs = CABINET_TYPE_DEFAULTS[self.var_type.get()]
        if hasattr(self, "_hint_label"):
            self._hint_label.destroy()
        text = (
            f"Avtomat qiymatlar ({self.var_type.get()}): "
            f"H={defs['height']}, D={defs['depth']}, polka={defs['num_shelves']}"
        )
        self._hint_label = tk.Label(
            body, text=text, font=("Segoe UI", 8), bg=COLOR_PANEL, fg=COLOR_MUTED,
        )
        self._hint_label.pack(pady=(8, 0))

    def _on_type_change(self):
        # Form yangilanganda hint ham yangilansin
        body = self._hint_label.master
        self._update_default_hint(body)

    def _build_list(self, card):
        body = card.body

        # Treeview ro'yxat
        cols = ("id", "type", "width", "height", "depth", "shelves", "door")
        tree = ttk.Treeview(body, columns=cols, show="headings", height=12)
        tree.heading("id", text="ID")
        tree.heading("type", text="Turi")
        tree.heading("width", text="Kenglik")
        tree.heading("height", text="Balandlik")
        tree.heading("depth", text="Chuqurlik")
        tree.heading("shelves", text="Polka")
        tree.heading("door", text="Eshik")

        tree.column("id", width=60, anchor="center")
        tree.column("type", width=80, anchor="center")
        tree.column("width", width=80, anchor="center")
        tree.column("height", width=90, anchor="center")
        tree.column("depth", width=90, anchor="center")
        tree.column("shelves", width=60, anchor="center")
        tree.column("door", width=60, anchor="center")

        scroll = ttk.Scrollbar(body, orient="vertical", command=tree.yview)
        tree.configure(yscroll=scroll.set)
        tree.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")
        self.tree = tree

        # O'chirish va tozalash
        btn_frame = tk.Frame(body, bg=COLOR_PANEL)
        btn_frame.pack(fill="x", pady=(8, 0))
        ttk.Button(
            btn_frame, text="🗑 Tanlanganni o'chirish",
            style="Danger.TButton", command=self._remove_selected,
        ).pack(side="left")
        ttk.Button(
            btn_frame, text="Hammasini tozalash",
            style="Danger.TButton", command=self._clear_all,
        ).pack(side="left", padx=(8, 0))

    def _build_action(self, card):
        body = card.body
        # Project ID
        proj_row = tk.Frame(body, bg=COLOR_PANEL)
        proj_row.pack(fill="x", pady=(0, 8))
        tk.Label(
            proj_row, text="Loyiha nomi:", font=FONT_BODY,
            bg=COLOR_PANEL, fg=COLOR_TEXT,
        ).pack(side="left")
        self.var_project = tk.StringVar(value="kuxnya_demo")
        ttk.Entry(proj_row, textvariable=self.var_project, font=FONT_BODY, width=25).pack(
            side="left", padx=(8, 0)
        )

        # Statistika
        self.lbl_stats = tk.Label(
            body, text="Tayyor: 0 kabinet, 0 panel",
            font=FONT_BODY, bg=COLOR_PANEL, fg=COLOR_MUTED,
        )
        self.lbl_stats.pack(anchor="w", pady=(0, 8))

        # Generate tugmalari yonma-yon (KATTA, asosiy)
        btn_grid = tk.Frame(body, bg=COLOR_PANEL)
        btn_grid.pack(fill="x", pady=(4, 8))
        btn_grid.columnconfigure(0, weight=1)
        btn_grid.columnconfigure(1, weight=1)

        ttk.Button(
            btn_grid, text="⚡  DXF (CNC uchun)",
            style="Primary.TButton", command=self._generate,
        ).grid(row=0, column=0, sticky="ew", padx=(0, 4))

        ttk.Button(
            btn_grid, text="🎨  3D KO'RISH",
            style="Primary.TButton", command=self._generate_3d,
        ).grid(row=0, column=1, sticky="ew", padx=(4, 0))

        # Status
        self.lbl_status = tk.Label(
            body, text="", font=FONT_STAT, bg=COLOR_PANEL, fg=COLOR_SUCCESS,
        )
        self.lbl_status.pack(anchor="w")

    # --- Logic ---

    def _add_cabinet(self):
        try:
            cab_id = self.var_id.get().strip() or f"K{len(self.cabinets) + 1}"
            cab_type = self.var_type.get()
            width = int(self.var_width.get())

            if width <= 0:
                raise ValueError("Kenglik 0 dan katta bo'lishi kerak")

            entry = {"id": cab_id, "type": cab_type, "width": width}
            if self.var_height.get().strip():
                entry["height"] = int(self.var_height.get())
            if self.var_depth.get().strip():
                entry["depth"] = int(self.var_depth.get())
            if self.var_shelves.get().strip():
                entry["num_shelves"] = int(self.var_shelves.get())
            entry["with_door"] = self.var_door.get()

            # ID dublikatini tekshirish
            if any(c["id"] == cab_id for c in self.cabinets):
                messagebox.showwarning(
                    "Diqqat", f"'{cab_id}' ID bilan kabinet allaqachon bor"
                )
                return

            self.cabinets.append(entry)
            self._refresh_cabinet_list()
            # ID ni avtomatik keyingi raqamga
            self.var_id.set(f"K{len(self.cabinets) + 1}")
        except ValueError as e:
            messagebox.showerror("Xato", f"Noto'g'ri qiymat: {e}")

    def _remove_selected(self):
        selected = self.tree.selection()
        if not selected:
            return
        for iid in selected:
            cab_id = self.tree.item(iid)["values"][0]
            self.cabinets = [c for c in self.cabinets if c["id"] != cab_id]
        self._refresh_cabinet_list()

    def _clear_all(self):
        if not self.cabinets:
            return
        if messagebox.askyesno("Tasdiqlash", "Barcha kabinetlarni o'chirasizmi?"):
            self.cabinets.clear()
            self._refresh_cabinet_list()

    def _refresh_cabinet_list(self):
        # Tree ni tozalash
        for iid in self.tree.get_children():
            self.tree.delete(iid)

        for cab in self.cabinets:
            cab_type = cab.get("type", "wall")
            defs = CABINET_TYPE_DEFAULTS[cab_type]
            self.tree.insert(
                "", "end",
                values=(
                    cab["id"],
                    cab_type,
                    f"{cab['width']} mm",
                    f"{cab.get('height', defs['height'])} mm",
                    f"{cab.get('depth', defs['depth'])} mm",
                    cab.get("num_shelves", defs["num_shelves"]),
                    "✓" if cab.get("with_door", True) else "—",
                ),
            )

        # Statistika yangilash
        n = len(self.cabinets)
        self.lbl_stats.config(text=f"Loyihada: {n} ta kabinet")

    def _generate(self):
        if not self.cabinets:
            messagebox.showwarning("Bo'sh", "Hech qanday kabinet yo'q")
            return

        proj_id = self.var_project.get().strip() or "demo"

        try:
            t0 = time.perf_counter()
            panels, summary = build_project(self.cabinets)
            layout = layout_panels_simple(panels)
            path = generate_furniture_dxf(layout, project_id=proj_id)
            elapsed = time.perf_counter() - t0
        except Exception as e:
            messagebox.showerror("DXF yaratishda xato", str(e))
            return

        # Statistika va status
        n_cab = len(summary)
        n_panel = len(panels)
        n_sheet = layout["sheets_used"]

        self.lbl_status.config(
            text=(
                f"✓ MUVAFFAQIYAT  ({elapsed:.2f} sek)\n"
                f"   {n_cab} kabinet  →  {n_panel} panel  →  {n_sheet} list"
            )
        )

        # DXF ni avtomat ochish
        self._open_file(path)

        # Xulosa popup (xo'jayinga ko'rsatish uchun mukammal)
        msg = self._build_summary_message(summary, n_panel, n_sheet, elapsed, path)
        messagebox.showinfo("DXF tayyor", msg)

    def _generate_3d(self):
        if not self.cabinets:
            messagebox.showwarning("Bo'sh", "Hech qanday kabinet yo'q")
            return

        proj_id = self.var_project.get().strip() or "demo"

        try:
            t0 = time.perf_counter()
            html_path = generate_3d_preview(self.cabinets, project_id=proj_id)
            elapsed = time.perf_counter() - t0
        except Exception as e:
            messagebox.showerror("3D yaratishda xato", str(e))
            return

        n_cab = len(self.cabinets)
        self.lbl_status.config(
            text=(
                f"✓ 3D TAYYOR  ({elapsed:.2f} sek)\n"
                f"   {n_cab} kabinet  →  brauzerda ochilmoqda..."
            )
        )

        # HTML ni brauzerda avtomat ochish
        self._open_file(html_path)

    def _build_summary_message(self, summary, n_panel, n_sheet, elapsed, path):
        lines = [
            f"⏱  Vaqt:    {elapsed:.2f} sekund",
            f"📦  Kabinet: {len(summary)} ta",
            f"🪵  Panel:   {n_panel} ta",
            f"📋  List:    {n_sheet} ta (2750x1830mm)",
            "",
            "KABINETLAR:",
        ]
        for s in summary:
            lines.append(
                f"  • [{s['id']}] {s['type']:<5s} {s['dimensions']:>15s} "
                f"({s['panel_count']} panel)"
            )
        lines.append("")
        lines.append(f"Saqlandi: {path}")
        return "\n".join(lines)

    def _open_file(self, path):
        try:
            abs_path = os.path.abspath(path)
            if os.name == "nt":
                os.startfile(abs_path)
            else:
                subprocess.run(["xdg-open", abs_path], check=False)
        except Exception:
            pass


def main():
    root = tk.Tk()
    KuxnyaGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
