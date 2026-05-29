"""
3D preview testi: demo kuxnya konfiguratsiyasi → HTML fayl.
"""

from preview3d import generate_3d_preview


kuxnya = [
    {"id": "W1", "type": "wall", "width": 600, "num_shelves": 1},
    {"id": "W2", "type": "wall", "width": 800, "num_shelves": 1},
    {"id": "W3", "type": "wall", "width": 400, "num_shelves": 1},
    {"id": "B1", "type": "base", "width": 600, "num_shelves": 1},
    {"id": "B2", "type": "base", "width": 800, "num_shelves": 0},
    {"id": "B3", "type": "base", "width": 400, "num_shelves": 1},
    {"id": "T1", "type": "tall", "width": 600, "num_shelves": 4},
]


if __name__ == "__main__":
    path = generate_3d_preview(kuxnya, project_id="kuxnya_3d_demo")
    print(f"3D HTML yaratildi: {path}")
    print("Brauzerda ochish uchun ushbu yo'lni double-click qiling")
