import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIGMA_DIR = os.path.join(BASE_DIR, "figma")
BROWSER_DIR = os.path.join(BASE_DIR, "browser")
DIFF_DIR = os.path.join(BASE_DIR, "diff")

SCREENS = [
    {
        "id": "CC-CON-01",
        "name": "Concierge Requests List",
        "figma_file": "CC-CON-01_83-1347.png",
        "browser_file": "CC-CON-01_browser.png",
        "output_file": "CC-CON-01_diff.png",
    },
    {
        "id": "CC-CON-02",
        "name": "Concierge Request Detail / Management",
        "figma_file": "CC-CON-02_83-1455.png",
        "browser_file": "CC-CON-02_browser.png",
        "output_file": "CC-CON-02_diff.png",
    },
    {
        "id": "CC-CON-03",
        "name": "Concierge Conversation Inbox",
        "figma_file": "CC-CON-03_83-1533.png",
        "browser_file": "CC-CON-03_browser.png",
        "output_file": "CC-CON-03_diff.png",
    },
    {
        "id": "CC-CON-04",
        "name": "Concierge Conversation Detail",
        "figma_file": "CC-CON-04_83-1633.png",
        "browser_file": "CC-CON-04_browser.png",
        "output_file": "CC-CON-04_diff.png",
    },
    {
        "id": "CC-CON-05",
        "name": "Create Concierge Request on Behalf",
        "figma_file": "CC-CON-05_83-1698.png",
        "browser_file": "CC-CON-05_browser.png",
        "output_file": "CC-CON-05_diff.png",
    },
]

def make_stitched_comparison(screen):
    figma_path = os.path.join(FIGMA_DIR, screen["figma_file"])
    browser_path = os.path.join(BROWSER_DIR, screen["browser_file"])
    out_path = os.path.join(DIFF_DIR, screen["output_file"])

    if not os.path.exists(figma_path) or not os.path.exists(browser_path):
        print(f"Skipping {screen['id']}: missing figma or browser capture.")
        return

    img_figma = Image.open(figma_path).convert("RGB")
    img_browser = Image.open(browser_path).convert("RGB")

    target_w = 1440
    # Rescale figma if needed to 1440
    if img_figma.width != target_w:
        ratio = target_w / float(img_figma.width)
        new_h = int(img_figma.height * ratio)
        img_figma = img_figma.resize((target_w, new_h), Image.Resampling.LANCZOS)

    # Rescale browser if needed to 1440
    if img_browser.width != target_w:
        ratio = target_w / float(img_browser.width)
        new_h = int(img_browser.height * ratio)
        img_browser = img_browser.resize((target_w, new_h), Image.Resampling.LANCZOS)

    max_h = max(img_figma.height, img_browser.height)
    header_h = 70
    canvas_w = target_w * 2 + 30
    canvas_h = max_h + header_h + 20

    canvas = Image.new("RGB", (canvas_w, canvas_h), (24, 24, 27))
    draw = ImageDraw.Draw(canvas)

    try:
        font_title = ImageFont.truetype("arial.ttf", 24)
        font_sub = ImageFont.truetype("arial.ttf", 16)
    except IOError:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    # Draw titles
    draw.text((20, 15), f"Figma Reference (Authoritative Design): {screen['id']} - {screen['name']}", fill=(244, 244, 245), font=font_title)
    draw.text((target_w + 30, 15), f"Implemented Next.js 14 Screen (1440x900 viewport capture)", fill=(52, 211, 153), font=font_title)

    # Paste images
    canvas.paste(img_figma, (10, header_h))
    canvas.paste(img_browser, (target_w + 20, header_h))

    os.makedirs(DIFF_DIR, exist_ok=True)
    canvas.save(out_path, format="PNG")
    print(f"Generated side-by-side comparison for {screen['id']}: {out_path}")

def main():
    os.makedirs(DIFF_DIR, exist_ok=True)
    for s in SCREENS:
        make_stitched_comparison(s)

if __name__ == "__main__":
    main()
