"""
3D Preview generator — kabinetlarni 3D fazoda joylashtirib HTML+Three.js
yordamida brauzerda interaktiv ko'rinish yaratadi.

Xususiyatlar:
  - Eshiklar haqiqiy petlyaga aylanadi (markaz emas, chetga)
  - Teshik markerlari (petlya 35mm, konfirmat 8mm, polka shtift 5mm)
  - Shaffoflik slider (korpus ichini ko'rish)
  - Explode rejim (panellarni ajratish)
  - LMB drag = aylantirish, Wheel = zoom, RMB drag = surish
"""

import json
import os
from cabinet import CABINET_TYPE_DEFAULTS


SIDE_THICKNESS = 18
BACK_THICKNESS = 4

WALL_HANG_HEIGHT = 1400
CABINET_GAP = 5

# Ranglar
COLOR_WOOD = "#d4a373"
COLOR_DOOR = "#a87544"
COLOR_BACK = "#8b6f47"
COLOR_FLOOR = "#e9ecef"

# Teshik ranglari
HOLE_HINGE = "#22c55e"      # 35mm petlya — yashil
HOLE_CONFIRMAT = "#eab308"  # 8mm konfirmat — sariq
HOLE_SHELF_PIN = "#a855f7"  # 5mm polka shtifti — siyohrang
HOLE_DOOR_CUP = "#22c55e"   # eshik chashkasi (35mm) — yashil

# Cabinet hardware konstantalari (cabinet.py bilan mos)
HINGE_INSET = 35
HINGE_FROM_TOP = 100
SHELF_PIN_INSET = 37
SHELF_PIN_DIAMETER = 5
SHELF_PIN_DEPTH = 13


def _hinge_holes_3d_left(y_positions):
    """Chap yon panel uchun petlya teshiklari, har eshik uchun 2 ta y pozitsiyada."""
    holes = []
    for y in y_positions:
        holes.append({
            "position": [SIDE_THICKNESS, y, HINGE_INSET],
            "axis": "x",
            "diameter": 35,
            "color": HOLE_HINGE,
            "label": "Petlya",
            "host": "panel:Chap yon",
        })
    return holes


def _hinge_holes_3d_right(width, y_positions):
    """O'ng yon panel uchun petlya teshiklari (ko'zgu)."""
    holes = []
    for y in y_positions:
        holes.append({
            "position": [width - SIDE_THICKNESS, y, HINGE_INSET],
            "axis": "x",
            "diameter": 35,
            "color": HOLE_HINGE,
            "label": "Petlya",
            "host": "panel:O'ng yon",
        })
    return holes


def _compute_door_layout(cab_type, height, with_door):
    """Eshiklarning y_offset va balandliklarini hisoblaydi.

    Qaytaradi: list of dict {"y_offset", "height", "sublabel"}.
    """
    if not with_door:
        return []
    if cab_type == "tall" and height > 1500:
        door_h_each = (height - 6) / 2
        return [
            {"y_offset": 2, "height": door_h_each, "sublabel": "past"},
            {"y_offset": 2 + door_h_each + 2, "height": door_h_each, "sublabel": "yuqori"},
        ]
    return [{"y_offset": 2, "height": height - 4, "sublabel": ""}]


def _hinge_y_positions_for_doors(doors_layout):
    """Eshiklarni ro'yxatdan har biri uchun yon paneldagi 2 ta petlya y pozitsiyasini qaytaradi."""
    positions = []
    for d in doors_layout:
        positions.append(d["y_offset"] + HINGE_FROM_TOP)
        positions.append(d["y_offset"] + d["height"] - HINGE_FROM_TOP)
    return positions


def _shelf_pin_holes_3d_left(height, depth, num_shelves):
    """Chap yon panelning ichki yuzasida polka shtiftlari."""
    if num_shelves <= 0:
        return []
    holes = []
    spacing = height / (num_shelves + 1)
    for i in range(1, num_shelves + 1):
        y = i * spacing
        for z in (SHELF_PIN_INSET, depth - SHELF_PIN_INSET):
            holes.append({
                "position": [SIDE_THICKNESS, y, z],
                "axis": "x",
                "diameter": SHELF_PIN_DIAMETER,
                "color": HOLE_SHELF_PIN,
                "label": "Polka shtifti",
                "host": "panel:Chap yon",
            })
    return holes


def _shelf_pin_holes_3d_right(width, height, depth, num_shelves):
    """O'ng yon panelning ichki yuzasida polka shtiftlari (ko'zgu)."""
    if num_shelves <= 0:
        return []
    holes = []
    spacing = height / (num_shelves + 1)
    for i in range(1, num_shelves + 1):
        y = i * spacing
        for z in (SHELF_PIN_INSET, depth - SHELF_PIN_INSET):
            holes.append({
                "position": [width - SIDE_THICKNESS, y, z],
                "axis": "x",
                "diameter": SHELF_PIN_DIAMETER,
                "color": HOLE_SHELF_PIN,
                "label": "Polka shtifti",
                "host": "panel:O'ng yon",
            })
    return holes


def _confirmat_holes_3d_top(width, height, depth):
    """Ust panelning chetlarida (yon panellar bilan birikish) konfirmat."""
    holes = []
    for x_local in (SIDE_THICKNESS, width - SIDE_THICKNESS):
        for z in (depth / 3, 2 * depth / 3):
            holes.append({
                "position": [x_local, height - SIDE_THICKNESS, z],
                "axis": "y",
                "diameter": 8,
                "color": HOLE_CONFIRMAT,
                "label": "Konfirmat",
                "host": "panel:Ust",
            })
    return holes


def _confirmat_holes_3d_bottom(width, depth):
    """Past panelning chetlarida konfirmat."""
    holes = []
    for x_local in (SIDE_THICKNESS, width - SIDE_THICKNESS):
        for z in (depth / 3, 2 * depth / 3):
            holes.append({
                "position": [x_local, SIDE_THICKNESS, z],
                "axis": "y",
                "diameter": 8,
                "color": HOLE_CONFIRMAT,
                "label": "Konfirmat",
                "host": "panel:Past",
            })
    return holes


def _door_cup_holes_3d(width, height, door_offset_y, door_h, door_z, door_index=0):
    """Eshikning ichki yuzasida chashka teshiklari (35mm).

    host = "door:<index>" — explode/rotation paytida eshik bilan birga harakatlanadi.
    """
    holes = []
    cup_x = HINGE_INSET / 2 + 11 + 2  # eshik chap chetidan 28.5mm
    for y_offset in (HINGE_FROM_TOP, door_h - HINGE_FROM_TOP):
        holes.append({
            "position": [cup_x, door_offset_y + y_offset, door_z],
            "axis": "z",
            "diameter": 35,
            "color": HOLE_DOOR_CUP,
            "label": "Chashka",
            "host": f"door:{door_index}",
        })
    return holes


def _build_panels_for_cabinet(cabinet_cfg):
    """Bitta kabinet uchun 3D panellar va teshiklar ro'yxatini hisoblaydi."""
    cab_type = cabinet_cfg.get("type", "wall")
    defs = CABINET_TYPE_DEFAULTS[cab_type]

    width = cabinet_cfg["width"]
    height = cabinet_cfg.get("height", defs["height"])
    depth = cabinet_cfg.get("depth", defs["depth"])
    num_shelves = cabinet_cfg.get("num_shelves", defs["num_shelves"])
    with_door = cabinet_cfg.get("with_door", True)
    has_top = defs["has_top"]
    has_bottom = defs["has_bottom"]

    panels = []
    holes_all = []
    doors = []  # alohida ro'yxat (rotation pivot bilan)

    # Eshiklar layoutini avval hisoblaymiz — yon panel petlyalarini har bir eshikka mos qilish uchun
    doors_layout = _compute_door_layout(cab_type, height, with_door)
    hinge_ys = _hinge_y_positions_for_doors(doors_layout)

    # 1) Chap yon
    panels.append({
        "name": "Chap yon",
        "size": [SIDE_THICKNESS, height, depth],
        "position": [0, 0, 0],
        "color": COLOR_WOOD,
        "category": "body",
    })
    if hinge_ys:
        holes_all.extend(_hinge_holes_3d_left(hinge_ys))
    holes_all.extend(_shelf_pin_holes_3d_left(height, depth, num_shelves))

    # 2) O'ng yon
    panels.append({
        "name": "O'ng yon",
        "size": [SIDE_THICKNESS, height, depth],
        "position": [width - SIDE_THICKNESS, 0, 0],
        "color": COLOR_WOOD,
        "category": "body",
    })
    if hinge_ys:
        holes_all.extend(_hinge_holes_3d_right(width, hinge_ys))
    holes_all.extend(_shelf_pin_holes_3d_right(width, height, depth, num_shelves))

    # 3) Past panel
    if has_bottom:
        panels.append({
            "name": "Past",
            "size": [width - 2 * SIDE_THICKNESS, SIDE_THICKNESS, depth],
            "position": [SIDE_THICKNESS, 0, 0],
            "color": COLOR_WOOD,
            "category": "body",
        })
        holes_all.extend(_confirmat_holes_3d_bottom(width, depth))

    # 4) Ust panel (yo'q bo'lsa stretcherlar)
    if has_top:
        panels.append({
            "name": "Ust",
            "size": [width - 2 * SIDE_THICKNESS, SIDE_THICKNESS, depth],
            "position": [SIDE_THICKNESS, height - SIDE_THICKNESS, 0],
            "color": COLOR_WOOD,
            "category": "body",
        })
        holes_all.extend(_confirmat_holes_3d_top(width, height, depth))
    else:
        for label, z_pos in (("Stretcher old", 0), ("Stretcher orqa", depth - SIDE_THICKNESS)):
            panels.append({
                "name": label,
                "size": [width - 2 * SIDE_THICKNESS, 100, SIDE_THICKNESS],
                "position": [SIDE_THICKNESS, height - 100, z_pos],
                "color": COLOR_WOOD,
                "category": "body",
            })

    # 5) Orqa devor
    panels.append({
        "name": "Orqa (HDF)",
        "size": [width, height, BACK_THICKNESS],
        "position": [0, 0, depth - BACK_THICKNESS],
        "color": COLOR_BACK,
        "category": "back",
    })

    # 6) Polkalar
    inner_h = height - (SIDE_THICKNESS if has_top else 0) - (SIDE_THICKNESS if has_bottom else 0)
    inner_y_start = SIDE_THICKNESS if has_bottom else 0
    if num_shelves > 0:
        spacing = inner_h / (num_shelves + 1)
        for i in range(1, num_shelves + 1):
            panels.append({
                "name": f"Polka {i}",
                "size": [width - 2 * SIDE_THICKNESS, SIDE_THICKNESS, depth - 10],
                "position": [
                    SIDE_THICKNESS,
                    inner_y_start + i * spacing - SIDE_THICKNESS / 2,
                    0,
                ],
                "color": COLOR_WOOD,
                "category": "shelf",
            })

    # 7) Eshik(lar) — doors_layout dan foydalanamiz (yuqorida hisoblangan)
    if doors_layout:
        door_thickness = SIDE_THICKNESS
        door_z_back = -0.5

        for idx, dlayout in enumerate(doors_layout):
            y_offset = dlayout["y_offset"]
            door_h = dlayout["height"]
            sublabel = dlayout["sublabel"]
            door_idx = idx
            name = f"Eshik {idx + 1}" + (f" ({sublabel})" if sublabel else "")
            if len(doors_layout) == 1:
                name = "Eshik"
            doors.append({
                "name": name,
                "size": [width - 4, door_h, door_thickness],
                "hinge_position": [2, y_offset, door_z_back],
                "color": COLOR_DOOR,
                "category": "door",
                "index": door_idx,
            })
            holes_all.extend(_door_cup_holes_3d(
                width, height, y_offset, door_h, door_z_back, door_index=door_idx
            ))

    return panels, doors, holes_all, {"width": width, "height": height, "depth": depth}


def _layout_kitchen(cabinets_config):
    """Kabinetlarni kuxnya layoutiga joylashtiradi.

    Wall hanging height dinamik: agar loyihada tall kabinet bo'lsa,
    devor kabinetlarning ustki qismi tall ustki qismi bilan tekislanadi.
    """
    # Eng baland tall kabinet ustini topish
    tall_max_top = 0
    for cfg in cabinets_config:
        if cfg.get("type") == "tall":
            defs = CABINET_TYPE_DEFAULTS["tall"]
            h = cfg.get("height", defs["height"])
            tall_max_top = max(tall_max_top, h)

    # Devor kabinetining balandligini topish (loyihadagi birinchisidan)
    wall_h = None
    for cfg in cabinets_config:
        if cfg.get("type") == "wall":
            defs = CABINET_TYPE_DEFAULTS["wall"]
            wall_h = cfg.get("height", defs["height"])
            break

    # Wall hang height: tall kabinet bilan tekislash, yoki default
    if tall_max_top > 0 and wall_h is not None:
        wall_hang = max(tall_max_top - wall_h, 1300)  # minimal 1300mm (countertop+gap)
    else:
        wall_hang = WALL_HANG_HEIGHT

    scene_cabinets = []
    floor_x = 0
    wall_x = 0

    for cfg in cabinets_config:
        cab_type = cfg.get("type", "wall")
        cab_id = cfg.get("id", "?")

        panels, doors, holes, dims = _build_panels_for_cabinet(cfg)

        if cab_type == "wall":
            origin = [wall_x, wall_hang, 0]
            wall_x += dims["width"] + CABINET_GAP
        else:
            origin = [floor_x, 0, 0]
            floor_x += dims["width"] + CABINET_GAP

        scene_cabinets.append({
            "id": cab_id,
            "type": cab_type,
            "origin": origin,
            "dimensions": dims,
            "panels": panels,
            "doors": doors,
            "holes": holes,
        })

    max_x = max(
        (c["origin"][0] + c["dimensions"]["width"] for c in scene_cabinets),
        default=1000,
    )
    max_y = max(
        (c["origin"][1] + c["dimensions"]["height"] for c in scene_cabinets),
        default=1000,
    )
    max_z = max(
        (c["origin"][2] + c["dimensions"]["depth"] for c in scene_cabinets),
        default=600,
    )

    return {
        "cabinets": scene_cabinets,
        "bounds": {"max_x": max_x, "max_y": max_y, "max_z": max_z},
        "config": {
            "wall_hang_height": WALL_HANG_HEIGHT,
            "floor_color": COLOR_FLOOR,
        },
    }


def generate_3d_preview(cabinets_config, project_id="demo", output_dir=None):
    scene_data = _layout_kitchen(cabinets_config)

    if output_dir is None:
        output_dir = f"output/project_{project_id}"
    os.makedirs(output_dir, exist_ok=True)
    html_path = os.path.join(output_dir, "3d_preview.html")

    html = _render_html(scene_data, project_id)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    return html_path


def _render_html(scene_data, project_id):
    scene_json = json.dumps(scene_data, ensure_ascii=False)
    return f"""<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="utf-8">
<title>3D Preview — {project_id}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Segoe UI', Tahoma, sans-serif; background: #1a1a1a; color: #fff; overflow: hidden; }}
  #app {{ position: relative; width: 100vw; height: 100vh; }}
  canvas {{ display: block; }}

  .panel {{
    position: absolute; background: rgba(20, 20, 20, 0.88);
    backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 14px 16px;
  }}
  #info {{ top: 16px; left: 16px; min-width: 240px; }}
  #info h1 {{ font-size: 16px; margin-bottom: 8px; color: #4dabf7; }}
  #info .stats {{ font-size: 13px; line-height: 1.6; color: #ced4da; }}
  #info .stats span {{ color: #fff; font-weight: 600; }}

  #controls {{ top: 16px; right: 16px; min-width: 280px; max-height: 90vh; overflow-y: auto; }}
  #controls h2 {{ font-size: 14px; margin-bottom: 10px; color: #4dabf7; }}
  .ctrl-row {{ display: flex; align-items: center; margin-bottom: 8px; font-size: 13px; gap: 8px; }}
  .ctrl-row label {{ flex: 1; color: #ced4da; }}
  .ctrl-row input[type="checkbox"] {{ width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; }}
  .ctrl-row input[type="range"] {{ width: 110px; flex-shrink: 0; }}
  .ctrl-row .val {{ color: #4dabf7; font-size: 11px; min-width: 32px; text-align: right; }}
  .group-title {{ color: #4dabf7; font-size: 12px; font-weight: 600;
                  text-transform: uppercase; letter-spacing: 0.5px; margin: 12px 0 6px; }}
  button {{ background: #0066cc; color: white; border: none; padding: 6px 12px;
           border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 4px; margin-bottom: 4px; }}
  button:hover {{ background: #004fa3; }}

  #legend {{ bottom: 16px; left: 16px; max-width: 320px; font-size: 12px; }}
  #legend h2 {{ font-size: 14px; margin-bottom: 8px; color: #4dabf7; }}
  .leg-item {{ display: flex; align-items: center; margin-bottom: 4px; color: #ced4da; }}
  .leg-color {{ width: 14px; height: 14px; border-radius: 2px; margin-right: 8px; flex-shrink: 0; }}
  .leg-color.circle {{ border-radius: 50%; }}

  #help {{ bottom: 16px; right: 16px; font-size: 12px; color: #adb5bd; max-width: 240px; }}
  #help h2 {{ font-size: 13px; margin-bottom: 6px; color: #4dabf7; }}
  #help kbd {{ background: #444; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 11px; }}
</style>
</head>
<body>
<div id="app">
  <div id="info" class="panel">
    <h1>🏭 {project_id}</h1>
    <div class="stats">
      <div>Kabinet: <span id="cab-count">—</span></div>
      <div>Panel:   <span id="panel-count">—</span></div>
      <div>Teshik:  <span id="hole-count">—</span></div>
      <div>Kenglik: <span id="dim-w">—</span></div>
      <div>Balandl: <span id="dim-h">—</span></div>
      <div>Chuqurl: <span id="dim-d">—</span></div>
    </div>
  </div>

  <div id="controls" class="panel">
    <h2>⚙️ Boshqaruv</h2>

    <div class="group-title">Ko'rinish</div>
    <div class="ctrl-row">
      <label>Korpus shaffofligi</label>
      <input type="range" id="body-opacity" min="0" max="100" value="100">
      <span class="val" id="body-opacity-val">100%</span>
    </div>
    <div class="ctrl-row">
      <label>Eshik shaffofligi</label>
      <input type="range" id="door-opacity" min="0" max="100" value="100">
      <span class="val" id="door-opacity-val">100%</span>
    </div>
    <div class="ctrl-row">
      <label>Eshik ochilganligi</label>
      <input type="range" id="door-open" min="0" max="110" value="0">
      <span class="val" id="door-open-val">0°</span>
    </div>
    <div class="ctrl-row">
      <label>Explode (panellar)</label>
      <input type="range" id="explode" min="0" max="100" value="0">
      <span class="val" id="explode-val">0%</span>
    </div>

    <div class="group-title">Ko'rsatish</div>
    <div class="ctrl-row">
      <label>Eshiklar</label>
      <input type="checkbox" id="show-doors" checked>
    </div>
    <div class="ctrl-row">
      <label>Orqa devorlar</label>
      <input type="checkbox" id="show-back" checked>
    </div>
    <div class="ctrl-row">
      <label>Teshiklar (markerlar)</label>
      <input type="checkbox" id="show-holes" checked>
    </div>
    <div class="ctrl-row">
      <label>Kabinet ID labellari</label>
      <input type="checkbox" id="show-labels" checked>
    </div>

    <div class="group-title">Kamera</div>
    <div>
      <button id="reset-view">📷 3/4</button>
      <button id="front-view">▶ Old</button>
      <button id="top-view">🔝 Yuqori</button>
      <button id="side-view">◀ Yon</button>
    </div>
  </div>

  <div id="legend" class="panel">
    <h2>📋 Belgilar</h2>
    <div class="leg-item"><div class="leg-color" style="background:#d4a373"></div>LDSP korpus</div>
    <div class="leg-item"><div class="leg-color" style="background:#a87544"></div>Eshik</div>
    <div class="leg-item"><div class="leg-color" style="background:#8b6f47"></div>Orqa devor (HDF)</div>
    <div class="leg-item"><div class="leg-color circle" style="background:#22c55e"></div>Petlya / Chashka (35mm)</div>
    <div class="leg-item"><div class="leg-color circle" style="background:#eab308"></div>Konfirmat (8mm)</div>
    <div class="leg-item"><div class="leg-color circle" style="background:#a855f7"></div>Polka shtifti (5mm)</div>
  </div>

  <div id="help" class="panel">
    <h2>🖱 Sichqoncha</h2>
    <div><kbd>LMB</kbd> sudrang — aylantirish</div>
    <div><kbd>Wheel</kbd> — yaqinlashtirish</div>
    <div><kbd>RMB</kbd> sudrang — surish</div>
    <div style="margin-top:6px;color:#22c55e;">💡 Korpus shaffofligini sliderdan o'zgartirib ichidagi teshik va detallarni ko'ring</div>
  </div>
</div>

<script type="importmap">
{{
  "imports": {{
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }}
}}
</script>

<script type="module">
import * as THREE from 'three';
import {{ OrbitControls }} from 'three/addons/controls/OrbitControls.js';

const SCENE_DATA = {scene_json};

// === Scene setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2a2a);
scene.fog = new THREE.Fog(0x2a2a2a, 5000, 18000);

const bounds = SCENE_DATA.bounds;
const sceneSize = Math.max(bounds.max_x, bounds.max_y, bounds.max_z);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 30000);
// Default kamera oldindan-o'ngdan-yuqoridan (eshiklar z=0 dan oldinga ko'rinadi)
camera.position.set(sceneSize * 1.0, sceneSize * 0.9, -sceneSize * 1.4);
const center = new THREE.Vector3(bounds.max_x / 2, bounds.max_y / 2, bounds.max_z / 2);

const renderer = new THREE.WebGLRenderer({{ antialias: true }});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(center);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.update();

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
scene.add(hemi);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
// Yorug'lik kamera tomondan (oldindan), shunda eshik va front faces yorug' bo'ladi
dirLight.position.set(sceneSize * 0.5, sceneSize * 1.2, -sceneSize * 0.7);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -sceneSize;
dirLight.shadow.camera.right = sceneSize;
dirLight.shadow.camera.top = sceneSize;
dirLight.shadow.camera.bottom = -sceneSize;
dirLight.shadow.camera.near = 100;
dirLight.shadow.camera.far = sceneSize * 5;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight2.position.set(-sceneSize, sceneSize * 0.5, sceneSize);
scene.add(dirLight2);

// Floor
const floorGeom = new THREE.PlaneGeometry(sceneSize * 5, sceneSize * 5);
const floorMat = new THREE.MeshStandardMaterial({{ color: 0xe9ecef, roughness: 0.9 }});
const floor = new THREE.Mesh(floorGeom, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(sceneSize * 5, 50, 0x666666, 0x333333);
grid.position.y = 0.5;
scene.add(grid);

// === Build cabinets ===
const cabinetGroups = [];
const bodyMeshes = [];   // korpus paneller (chap, o'ng, ust, past, polka)
const backMeshes = [];   // orqa devorlar
const doorGroups = [];   // eshik groupsi (rotation pivot bilan)
const doorMeshes = [];   // eshik meshlari (shaffoflik uchun)
const holeMeshes = [];   // teshik markerlari
const labelSprites = [];
const explodeAnchors = []; // explode rejim uchun panel original pozitsiyalari

let totalPanels = 0;
let totalHoles = 0;

SCENE_DATA.cabinets.forEach(cab => {{
  const cabGroup = new THREE.Group();
  cabGroup.position.set(...cab.origin);
  cabGroup.userData = {{ id: cab.id, type: cab.type, dims: cab.dimensions }};
  scene.add(cabGroup);
  cabinetGroups.push(cabGroup);

  const cabCenter = new THREE.Vector3(
    cab.dimensions.width / 2, cab.dimensions.height / 2, cab.dimensions.depth / 2
  );

  // Har kabinet uchun explode masofasi — eng katta o'lchamning 35%
  const cabMaxDim = Math.max(
    cab.dimensions.width, cab.dimensions.height, cab.dimensions.depth
  );
  const explodeScale = cabMaxDim * 0.35;

  // Host objektlarni xaritada saqlaymiz (teshiklarni tegishli paneliga bog'lash uchun)
  const panelMap = {{}};   // "Chap yon" → mesh
  const doorMap = {{}};    // 0 → doorGroup

  // Yo'nalish hisoblash — markazda (NaN) bo'lsa, default Y axis
  function safeDir(origPos, fallback) {{
    const v = origPos.clone().sub(cabCenter);
    if (v.lengthSq() < 0.01) {{
      return (fallback || new THREE.Vector3(0, 1, 0)).clone();
    }}
    return v.normalize();
  }}

  // --- Body panellar ---
  cab.panels.forEach(panel => {{
    const [w, h, d] = panel.size;
    const [px, py, pz] = panel.position;
    const geom = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({{
      color: panel.color,
      roughness: 0.7,
      metalness: 0.05,
      transparent: true,
      opacity: 1.0,
    }});
    const mesh = new THREE.Mesh(geom, mat);
    const origPos = new THREE.Vector3(px + w / 2, py + h / 2, pz + d / 2);
    mesh.position.copy(origPos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {{ panelName: panel.name, cabinetId: cab.id, category: panel.category }};
    cabGroup.add(mesh);
    panelMap[panel.name] = mesh;

    // Yo'nalish: panel markazidan kabinet markaziga.
    // Polkalar markazga teng → safeDir Y axisga (yuqoriga) tashlaydi.
    const fallback = panel.category === 'shelf'
      ? new THREE.Vector3(0, 0, -1)  // shelves go forward
      : new THREE.Vector3(0, 1, 0);
    const dirFromCenter = safeDir(origPos, fallback);
    explodeAnchors.push({{
      object: mesh, origPos: origPos.clone(),
      dir: dirFromCenter, scale: explodeScale,
    }});

    if (panel.category === 'back') backMeshes.push(mesh);
    else bodyMeshes.push(mesh);

    totalPanels++;
  }});

  // --- Eshiklar (alohida group bilan, petlya pivot) ---
  cab.doors.forEach(door => {{
    const [w, h, d] = door.size;
    const [hx, hy, hz] = door.hinge_position;

    // Geometriyani translate qilamiz, shunda pivot chap-old-past burchakda
    const geom = new THREE.BoxGeometry(w, h, d);
    geom.translate(w / 2, h / 2, -d / 2);

    const mat = new THREE.MeshStandardMaterial({{
      color: door.color,
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
    }});
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {{ panelName: door.name, cabinetId: cab.id, category: 'door' }};

    const doorGroup = new THREE.Group();
    const groupOrigPos = new THREE.Vector3(hx, hy, hz);
    doorGroup.position.copy(groupOrigPos);
    doorGroup.add(mesh);
    cabGroup.add(doorGroup);

    doorMap[door.index] = doorGroup;
    doorGroups.push(doorGroup);
    doorMeshes.push(mesh);

    // Eshikning markazi (explode uchun yo'nalish hisoblash)
    const doorCenter = groupOrigPos.clone().add(new THREE.Vector3(w / 2, h / 2, -d / 2));
    const dirFromCenter = safeDir(doorCenter, new THREE.Vector3(0, 0, -1));
    explodeAnchors.push({{
      object: doorGroup, origPos: groupOrigPos.clone(),
      dir: dirFromCenter, scale: explodeScale,
    }});

    totalPanels++;
  }});

  // --- Teshik markerlari (host parenting bilan) ---
  cab.holes.forEach(hole => {{
    const [hx, hy, hz] = hole.position;
    const radius = hole.diameter / 2;
    const cyl = new THREE.CylinderGeometry(radius, radius, 4, 24, 1, false);
    const mat = new THREE.MeshStandardMaterial({{
      color: hole.color,
      roughness: 0.4,
      metalness: 0.5,
      emissive: hole.color,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 1.0,
    }});
    const cylMesh = new THREE.Mesh(cyl, mat);

    if (hole.axis === 'x') {{
      cylMesh.rotation.z = Math.PI / 2;
    }} else if (hole.axis === 'z') {{
      cylMesh.rotation.x = Math.PI / 2;
    }}
    cylMesh.userData = {{ holeLabel: hole.label, cabinetId: cab.id }};

    // Host topish va parenting
    const host = hole.host || "";
    let parent = cabGroup;
    let localPos = new THREE.Vector3(hx, hy, hz);

    if (host.startsWith("panel:")) {{
      const panelName = host.substring(6);
      const hostMesh = panelMap[panelName];
      if (hostMesh) {{
        parent = hostMesh;
        // Host mesh world position = cabGroup + hostMesh.position
        // Local position = hole_world (cabinet local) - hostMesh.position
        localPos = new THREE.Vector3(hx, hy, hz).sub(hostMesh.position);
      }}
    }} else if (host.startsWith("door:")) {{
      const doorIdx = parseInt(host.substring(5), 10);
      const hostDoorGroup = doorMap[doorIdx];
      if (hostDoorGroup) {{
        parent = hostDoorGroup;
        // doorGroup pozitsiyasi cabinet local da
        localPos = new THREE.Vector3(hx, hy, hz).sub(hostDoorGroup.position);
      }}
    }}

    cylMesh.position.copy(localPos);
    parent.add(cylMesh);
    holeMeshes.push(cylMesh);
    totalHoles++;
  }});

  // --- Kabinet ID label ---
  const sprite = makeLabel(cab.id, cab.type);
  sprite.position.set(
    cab.dimensions.width / 2,
    cab.dimensions.height + 50,
    cab.dimensions.depth / 2
  );
  cabGroup.add(sprite);
  labelSprites.push(sprite);
}});

function makeLabel(id, type) {{
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0066cc';
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 56px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(id, 128, 36);
  ctx.font = '20px Segoe UI, sans-serif';
  ctx.fillText(type, 128, 76);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({{ map: texture, transparent: true }});
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(220, 82, 1);
  return sprite;
}}

// === UI bog'lash ===
document.getElementById('cab-count').textContent = SCENE_DATA.cabinets.length;
document.getElementById('panel-count').textContent = totalPanels;
document.getElementById('hole-count').textContent = totalHoles;
document.getElementById('dim-w').textContent = bounds.max_x.toFixed(0) + ' mm';
document.getElementById('dim-h').textContent = bounds.max_y.toFixed(0) + ' mm';
document.getElementById('dim-d').textContent = bounds.max_z.toFixed(0) + ' mm';

function setOpacity(meshes, value) {{
  meshes.forEach(m => {{
    m.material.opacity = value;
    m.material.transparent = value < 1.0;
    m.material.depthWrite = value >= 0.99;
  }});
}}

document.getElementById('body-opacity').addEventListener('input', e => {{
  const v = e.target.value / 100;
  setOpacity(bodyMeshes, v);
  setOpacity(backMeshes, v);
  document.getElementById('body-opacity-val').textContent = e.target.value + '%';
}});
document.getElementById('door-opacity').addEventListener('input', e => {{
  const v = e.target.value / 100;
  setOpacity(doorMeshes, v);
  document.getElementById('door-opacity-val').textContent = e.target.value + '%';
}});
document.getElementById('door-open').addEventListener('input', e => {{
  // Eshik petlya bo'ylab aylanadi (Y axis), pivot chap chet va orqa
  const angle = (e.target.value / 100) * (Math.PI / 2);
  doorGroups.forEach(g => g.rotation.y = angle);
  document.getElementById('door-open-val').textContent = (angle * 180 / Math.PI).toFixed(0) + '°';
}});
document.getElementById('explode').addEventListener('input', e => {{
  const factor = e.target.value / 100;
  explodeAnchors.forEach(a => {{
    // Har kabinet o'z hajmiga moslab portlatadi (kichik kabinet kichik, katta — katta)
    const distance = (a.scale || 250) * factor;
    a.object.position.copy(a.origPos).add(a.dir.clone().multiplyScalar(distance));
  }});
  document.getElementById('explode-val').textContent = e.target.value + '%';
}});

document.getElementById('show-doors').addEventListener('change', e => {{
  doorGroups.forEach(g => g.visible = e.target.checked);
}});
document.getElementById('show-back').addEventListener('change', e => {{
  backMeshes.forEach(m => m.visible = e.target.checked);
}});
document.getElementById('show-holes').addEventListener('change', e => {{
  holeMeshes.forEach(m => m.visible = e.target.checked);
}});
document.getElementById('show-labels').addEventListener('change', e => {{
  labelSprites.forEach(s => s.visible = e.target.checked);
}});

document.getElementById('reset-view').addEventListener('click', () => {{
  camera.position.set(sceneSize * 1.0, sceneSize * 0.9, -sceneSize * 1.4);
  controls.target.copy(center);
  controls.update();
}});
document.getElementById('top-view').addEventListener('click', () => {{
  camera.position.set(center.x, sceneSize * 2.5, center.z);
  controls.target.copy(center);
  controls.update();
}});
document.getElementById('front-view').addEventListener('click', () => {{
  // Front = -z tomondan (chunki eshiklar -z ga qaragan)
  camera.position.set(center.x, center.y, -sceneSize * 2.0);
  controls.target.copy(center);
  controls.update();
}});
document.getElementById('side-view').addEventListener('click', () => {{
  camera.position.set(-sceneSize * 2.0, center.y, center.z);
  controls.target.copy(center);
  controls.update();
}});

window.addEventListener('resize', () => {{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}});

function animate() {{
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}}
animate();
</script>
</body>
</html>
"""
