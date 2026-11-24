import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIGMA_DIR = os.path.join(BASE_DIR, "figma")
BROWSER_DIR = os.path.join(BASE_DIR, "browser")
DIFF_DIR = os.path.join(BASE_DIR, "diff")

os.makedirs(DIFF_DIR, exist_ok=True)

SCREENS = [
    {
        "id": "CC-BKG-01",
        "figma": "CC-BKG-01_81-260.png",
        "browser": "CC-BKG-01_browser.png",
        "title": "CC-BKG-01: Bookings List (Figma 81:260)",
    },
    {
        "id": "CC-BKG-02",
        "figma": "CC-BKG-02_81-362.png",
        "browser": "CC-BKG-02_browser.png",
        "title": "CC-BKG-02: Booking Detail / Operations (Figma 81:362)",
    },
    {
        "id": "CC-BKG-03",
        "figma": "CC-BKG-03_81-450.png",
        "browser": "CC-BKG-03_browser.png",
        "title": "CC-BKG-03: Create Booking on Behalf (Figma 81:450)",
    },
    {
        "id": "CC-BKG-04",
        "figma": "CC-BKG-04_81-542.png",
        "browser": "CC-BKG-04_browser.png",
        "title": "CC-BKG-04: Booking Change Requests (Figma 81:542)",
    },
    {
        "id": "CC-BKG-05",
        "figma": "CC-BKG-05_81-642.png",
        "browser": "CC-BKG-05_browser.png",
        "title": "CC-BKG-05: Resolve Booking Change / Cancellation (Figma 81:642)",
    },
]

HEADER_HEIGHT = 60

for s in SCREENS:
    f_path = os.path.join(FIGMA_DIR, s["figma"])
    b_path = os.path.join(BROWSER_DIR, s["browser"])
    out_path = os.path.join(DIFF_DIR, f"{s['id']}_comparison.png")

    if not os.path.exists(f_path) or not os.path.exists(b_path):
        print(f"Skipping {s['id']}: missing {f_path} or {b_path}")
        continue

    img_f = Image.open(f_path).convert("RGB")
    img_b = Image.open(b_path).convert("RGB")

    target_w = 1440
    if img_f.width != target_w:
        ratio = target_w / img_f.width
        img_f = img_f.resize((target_w, int(img_f.height * ratio)), Image.Resampling.LANCZOS)
    if img_b.width != target_w:
        ratio = target_w / img_b.width
        img_b = img_b.resize((target_w, int(img_b.height * ratio)), Image.Resampling.LANCZOS)

    content_h = max(img_f.height, img_b.height)

    if img_f.height < content_h:
        padded_f = Image.new("RGB", (target_w, content_h), (250, 248, 244))
        padded_f.paste(img_f, (0, 0))
        img_f = padded_f
    if img_b.height < content_h:
        padded_b = Image.new("RGB", (target_w, content_h), (250, 248, 244))
        padded_b.paste(img_b, (0, 0))
        img_b = padded_b

    total_w = target_w * 2
    total_h = content_h + HEADER_HEIGHT

    comp = Image.new("RGB", (total_w, total_h), (11, 12, 14))
    draw = ImageDraw.Draw(comp)

    # Headers
    draw.rectangle([0, 0, target_w - 1, HEADER_HEIGHT], fill=(23, 25, 29))
    draw.rectangle([target_w, 0, total_w, HEADER_HEIGHT], fill=(168, 131, 67))

    font = None
    try:
        font = ImageFont.truetype("arial.ttf", 22)
    except:
        font = ImageFont.load_default()

    draw.text((24, 18), f"FIGMA APPROVED DESIGN: {s['title']}", fill=(240, 240, 240), font=font)
    draw.text((target_w + 24, 18), f"CHROMIUM IMPLEMENTATION (1440x900): {s['id']}", fill=(255, 255, 255), font=font)

    comp.paste(img_f, (0, HEADER_HEIGHT))
    comp.paste(img_b, (target_w, HEADER_HEIGHT))

    draw.line([(target_w, 0), (target_w, total_h)], fill=(180, 135, 55), width=3)

    comp.save(out_path, quality=92)
    print(f"Generated comparison: {out_path} ({total_w}x{total_h})")

print("All comparisons generated successfully.")
