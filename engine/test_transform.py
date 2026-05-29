"""
apply_transform() formulasini barcha 4 ta burilish uchun tekshirish.

Panel: 720 x 580 mm. Local teshik: x=35, y=100.
"""

from dxf_generator import apply_transform


PANEL_W = 720
PANEL_H = 580


def t(rot, sx=0, sy=0):
    return {"x_mm": sx, "y_mm": sy, "rot_deg": rot}


def check(actual, expected, label):
    if actual == expected:
        print(f"  OK  {label}: {actual}")
    else:
        print(f"  XATO {label}: kutilgan {expected}, lekin {actual}")
        raise AssertionError(label)


print("Transform tests (panel 720x580, local hole at x=35, y=100):")

# 0 daraja - hech narsa o'zgarmaydi
check(apply_transform(35, 100, PANEL_W, PANEL_H, t(0)), (35.0, 100.0), "rot=0")

# 90 daraja: x=sy+(h-y_local), y=sx+x_local  =>  (580-100, 35) = (480, 35)
check(apply_transform(35, 100, PANEL_W, PANEL_H, t(90)), (480.0, 35.0), "rot=90")

# 180 daraja: (w-x, h-y) = (685, 480)
check(apply_transform(35, 100, PANEL_W, PANEL_H, t(180)), (685.0, 480.0), "rot=180")

# 270 daraja: (y, w-x) = (100, 685)
check(apply_transform(35, 100, PANEL_W, PANEL_H, t(270)), (100.0, 685.0), "rot=270")

# Sheet offset bilan: 90 daraja, sx=1000, sy=500
check(
    apply_transform(35, 100, PANEL_W, PANEL_H, t(90, sx=1000, sy=500)),
    (1480.0, 535.0),
    "rot=90 + offset(1000,500)",
)

# Burchak nuqta (0,0): hamma rot da panel chegarasidan tashqariga chiqmaslik kerak
print("\nCorner check (local 0,0):")
check(apply_transform(0, 0, PANEL_W, PANEL_H, t(0)), (0.0, 0.0), "rot=0   corner")
check(apply_transform(0, 0, PANEL_W, PANEL_H, t(90)), (580.0, 0.0), "rot=90  corner")
check(apply_transform(0, 0, PANEL_W, PANEL_H, t(180)), (720.0, 580.0), "rot=180 corner")
check(apply_transform(0, 0, PANEL_W, PANEL_H, t(270)), (0.0, 720.0), "rot=270 corner")

print("\nBarcha testlar muvaffaqiyatli o'tdi.")
