"""Build editorial portrait crops from the real studio photography on yahiafouad.com.

The article thumbnails (yf-a*.jpg) are studio portraits of Yahia with a headline
baked into the right side. We crop the portrait part only (no text) so the same
real photography can be reused as editorial imagery. Output -> src/assets/img/.
"""
from PIL import Image, ImageFilter
import os

SRC, OUT = "assets-src", "src/assets/img"
os.makedirs(OUT, exist_ok=True)

CROPS = {
    # name: (source, box)
    "portrait-thoughtful": ("yf-a4-1785536959.jpg", (40, 0, 760, 900)),   # hand on chin, seated
    "portrait-speaking":   ("yf-a3-1785536959.jpg", (0, 0, 700, 900)),    # gesturing, mid-sentence
    "portrait-open":       ("yf-a5-1785536960.jpg", (20, 0, 740, 900)),   # open hand, explaining
    "portrait-seated":     ("yf-a1-1785536958.jpg", (0, 0, 690, 900)),   # hands clasped
    "portrait-standing":   ("yf-a2-1785536959.jpg", (0, 0, 720, 900)),    # standing, arms relaxed
}

for name, (src, box) in CROPS.items():
    im = Image.open(os.path.join(SRC, src)).convert("RGB").crop(box)
    im.save(os.path.join(OUT, f"{name}.jpg"), quality=94, subsampling=0)
    print(name, im.size)

# Untouched real photos, normalised to high-quality JPEG
for name, src in {
    "portrait-chin": "portrait-chin.jpg",
    "portrait-dark-wide": "portrait-dark-wide.webp",
    "portrait-square": "portrait-square.jpg",
    "outdoor": "outdoor.jpg",
}.items():
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    im.save(os.path.join(OUT, f"{name}.jpg"), quality=94, subsampling=0)
    print(name, im.size)

for i in range(1, 7):
    im = Image.open(os.path.join(SRC, f"media-v{i}.webp")).convert("RGB")
    im.thumbnail((1600, 1600))
    im.save(os.path.join(OUT, f"media-v{i}.jpg"), quality=90)

# Logo mark -> single-colour alpha mask (recoloured in CSS via mask-image)
mk = Image.open(os.path.join(SRC, "logo-mark.png")).convert("RGBA")
mk = mk.crop(mk.getbbox())
alpha = mk.split()[3]
mask = Image.new("RGBA", mk.size, (0, 0, 0, 0))
mask.putalpha(alpha)
mask.thumbnail((256, 256))
mask.save("public/logo-mark.png", optimize=True)
# favicon / apple icon: mark on charcoal
for size, fn in ((180, "apple-touch-icon.png"), (512, "icon-512.png"), (32, "favicon-32.png")):
    bg = Image.new("RGBA", (size, size), (28, 27, 25, 255))
    m = Image.new("RGBA", mk.size, (246, 242, 236, 255)); m.putalpha(alpha)
    m.thumbnail((int(size * .66), int(size * .66)), Image.LANCZOS)
    bg.alpha_composite(m, ((size - m.size[0]) // 2, (size - m.size[1]) // 2))
    bg.convert("RGB").save(os.path.join("public", fn))
print("done")
