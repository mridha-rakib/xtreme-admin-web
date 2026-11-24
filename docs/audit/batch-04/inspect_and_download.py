import os
import re
import urllib.request
import json

batch_dir = r"C:\Users\rakib_bro\sta-projects\xtream\xtreme-admin-web\docs\audit\batch-04"
figma_dir = os.path.join(batch_dir, "figma")
browser_dir = os.path.join(batch_dir, "browser")
diff_dir = os.path.join(batch_dir, "diff")
dest_dir = r"C:\Users\rakib_bro\sta-projects\xtream\xtreme-admin-web\public\figma-assets"

os.makedirs(figma_dir, exist_ok=True)
os.makedirs(browser_dir, exist_ok=True)
os.makedirs(diff_dir, exist_ok=True)
os.makedirs(dest_dir, exist_ok=True)

# 1. Download Figma Screenshots
screenshots = {
    "CC-CON-01_83-1347.png": "https://www.figma.com/api/mcp/asset/f1d9f8cc-e297-4964-8fb7-9976ee57ac5a.png",
    "CC-CON-02_83-1455.png": "https://www.figma.com/api/mcp/asset/31b3b0c3-45d5-452c-b684-49f14a189715.png",
    "CC-CON-03_83-1533.png": "https://www.figma.com/api/mcp/asset/0d5e1e60-c7b2-4f32-a70a-fcb26c9d3a68.png",
    "CC-CON-04_83-1633.png": "https://www.figma.com/api/mcp/asset/481d594a-3347-420b-9c39-8e860ac7f471.png",
    "CC-CON-05_83-1698.png": "https://www.figma.com/api/mcp/asset/7de36fd7-f1c6-421c-be15-ed11305d283d.png",
}

for fname, url in screenshots.items():
    tpath = os.path.join(figma_dir, fname)
    if not os.path.exists(tpath):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req) as resp:
                data = resp.read()
            with open(tpath, "wb") as f:
                f.write(data)
            print(f"Downloaded screenshot: {fname} ({len(data)} bytes)")
        except Exception as e:
            print(f"Error downloading {fname}: {e}")

# 2. Save Contexts & Download Assets
step_files = {
    "CC-CON-01": r"C:\Users\rakib_bro\.gemini\antigravity\brain\21653daa-a859-4e78-9fd0-d16d6235bd4c\.system_generated\steps\6268\output.txt",
    "CC-CON-02": r"C:\Users\rakib_bro\.gemini\antigravity\brain\21653daa-a859-4e78-9fd0-d16d6235bd4c\.system_generated\steps\6269\output.txt",
    "CC-CON-03": r"C:\Users\rakib_bro\.gemini\antigravity\brain\21653daa-a859-4e78-9fd0-d16d6235bd4c\.system_generated\steps\6270\output.txt",
    "CC-CON-04": r"C:\Users\rakib_bro\.gemini\antigravity\brain\21653daa-a859-4e78-9fd0-d16d6235bd4c\.system_generated\steps\6271\output.txt",
    "CC-CON-05": r"C:\Users\rakib_bro\.gemini\antigravity\brain\21653daa-a859-4e78-9fd0-d16d6235bd4c\.system_generated\steps\6272\output.txt",
}

downloaded = 0
url_to_local = {}

for name, path in step_files.items():
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    ref_path = os.path.join(batch_dir, f"{name}_context.txt")
    with open(ref_path, "w", encoding="utf-8") as rf:
        rf.write(content)

    matches = re.findall(r'(https://www\.figma\.com/api/mcp/asset/([a-zA-Z0-9\-_.]+)\.([a-z0-9]+))', content)
    for full_url, asset_id, ext in matches:
        local_name = f"b4_{asset_id[:12]}.{ext}"
        target_file = os.path.join(dest_dir, local_name)
        url_to_local[full_url] = f"/figma-assets/{local_name}"
        if not os.path.exists(target_file):
            try:
                req = urllib.request.Request(full_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req) as resp:
                    data = resp.read()
                with open(target_file, "wb") as tf:
                    tf.write(data)
                downloaded += 1
            except Exception as e:
                print(f"Error downloading {full_url}: {e}")

print(f"Downloaded {downloaded} new assets to public/figma-assets")
print(f"Total mapped assets: {len(url_to_local)}")

with open(os.path.join(batch_dir, "asset_map.json"), "w", encoding="utf-8") as jf:
    json.dump(url_to_local, jf, indent=2)

print("Batch 4 setup completed.")
