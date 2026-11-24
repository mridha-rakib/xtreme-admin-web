import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIGMA_DIR = os.path.join(BASE_DIR, "figma")
BROWSER_DIR = os.path.join(BASE_DIR, "browser")
DIFF_DIR = os.path.join(BASE_DIR, "diff")

os.makedirs(DIFF_DIR, exist_ok=True)

SCREENS = [
    {
        "id": "CC-AUTH-01",
        "figma": "CC-AUTH-01_77-2.png",
        "browser": "CC-AUTH-01_browser.png",
        "title": "CC-AUTH-01: Command Center Sign In (Figma 77:2)",
    },
    {
        "id": "CC-HOME-01",
        "figma": "CC-HOME-01_77-26.png",
        "browser": "CC-HOME-01_browser.png",
        "title": "CC-HOME-01: Super Admin Dashboard (Figma 77:26)",
    },
    {
        "id": "CC-CUS-01",
        "figma": "CC-CUS-01_77-239.png",
        "browser": "CC-CUS-01_browser.png",
        "title": "CC-CUS-01: Customers List (Figma 77:239)",
    },
    {
        "id": "CC-CUS-02",
        "figma": "CC-CUS-02_77-341.png",
        "browser": "CC-CUS-02_browser.png",
        "title": "CC-CUS-02: Customer Detail (Figma 77:341)",
    },
    {
        "id": "CC-CUS-03",
        "figma": "CC-CUS-03_77-402.png",
        "browser": "CC-CUS-03_browser.png",
        "title": "CC-CUS-03: Edit Customer Basic Profile (Figma 77:402)",
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

    # Resize both to standard 1440 width if needed, preserving aspect ratio
    target_w = 1440
    if img_f.width != target_w:
        ratio = target_w / img_f.width
        img_f = img_f.resize((target_w, int(img_f.height * ratio)), Image.Resampling.LANCZOS)
    if img_b.width != target_w:
        ratio = target_w / img_b.width
        img_b = img_b.resize((target_w, int(img_b.height * ratio)), Image.Resampling.LANCZOS)

    content_h = max(img_f.height, img_b.height)

    # Pad images to content_h if one is shorter
    if img_f.height < content_h:
        padded_f = Image.new("RGB", (target_w, content_h), (250, 248, 244))
        padded_f.paste(img_f, (0, 0))
        img_f = padded_f
    if img_b.height < content_h:
        padded_b = Image.new("RGB", (target_w, content_h), (250, 248, 244))
        padded_b.paste(img_b, (0, 0))
        img_b = padded_b

    # Create composite side-by-side canvas: 2 * target_w wide, content_h + HEADER_HEIGHT tall
    total_w = target_w * 2
    total_h = content_h + HEADER_HEIGHT

    comp = Image.new("RGB", (total_w, total_h), (11, 12, 14))
    draw = ImageDraw.Draw(comp)

    # Draw header banners
    # Left header: Figma Reference
    draw.rectangle([0, 0, target_w - 1, HEADER_HEIGHT], fill=(23, 25, 29))
    # Right header: Implemented Web
    draw.rectangle([target_w, 0, total_w, HEADER_HEIGHT], fill=(168, 131, 67))

    # Text titles
    font = None
    try:
        font = ImageFont.truetype("arial.ttf", 22)
    except:
        font = ImageFont.load_default()

    draw.text((24, 18), f"FIGMA APPROVED DESIGN: {s['title']}", fill=(240, 240, 240), font=font)
    draw.text((target_w + 24, 18), f"CHROMIUM IMPLEMENTATION (1440x900): {s['id']}", fill=(255, 255, 255), font=font)

    # Paste images
    comp.paste(img_f, (0, HEADER_HEIGHT))
    comp.paste(img_b, (target_w, HEADER_HEIGHT))

    # Optional: Draw divider line
    draw.line([(target_w, 0), (target_w, total_h)], fill=(180, 135, 55), width=3)

    comp.save(out_path, quality=92)
    print(f"Generated comparison: {out_path} ({total_w}x{total_h})")

print("All comparisons generated successfully.")
