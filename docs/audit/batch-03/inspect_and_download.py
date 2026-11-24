import os
import re
import urllib.request
import json

step_files = {
    'CC-BKG-06': r'C:\Users\rakib_bro\.gemini\antigravity\brain\21653daa-a859-4e78-9fd0-d16d6235bd4c\.system_generated\steps\5926\output.txt',
    'CC-PAY-01': r'C:\Users\rakib_bro\.gemini\antigravity\brain\21653daa-a859-4e78-9fd0-d16d6235bd4c\.system_generated\steps\5927\output.txt',
    'CC-TRIP-01': r'C:\Users\rakib_bro\.gemini\antigravity\brain\21653daa-a859-4e78-9fd0-d16d6235bd4c\.system_generated\steps\5929\output.txt',
    'CC-TRIP-02': r'C:\Users\rakib_bro\.gemini\antigravity\brain\21653daa-a859-4e78-9fd0-d16d6235bd4c\.system_generated\steps\5930\output.txt',
    'CC-TRIP-03': r'C:\Users\rakib_bro\.gemini\antigravity\brain\21653daa-a859-4e78-9fd0-d16d6235bd4c\.system_generated\steps\5931\output.txt',
}

dest_dir = r'C:\Users\rakib_bro\sta-projects\xtream\xtreme-admin-web\public\figma-assets'
batch_dir = r'C:\Users\rakib_bro\sta-projects\xtream\xtreme-admin-web\docs\audit\batch-03'
os.makedirs(dest_dir, exist_ok=True)
os.makedirs(batch_dir, exist_ok=True)

downloaded = 0
url_to_local = {}

for name, path in step_files.items():
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    ref_path = os.path.join(batch_dir, f'{name}_context.txt')
    with open(ref_path, 'w', encoding='utf-8') as rf:
        rf.write(content)

    matches = re.findall(r'(https://www\.figma\.com/api/mcp/asset/([a-zA-Z0-9\-_.]+)\.([a-z0-9]+))', content)
    for full_url, asset_id, ext in matches:
        local_name = f'b3_{asset_id[:12]}.{ext}'
        target_file = os.path.join(dest_dir, local_name)
        url_to_local[full_url] = f'/figma-assets/{local_name}'
        if not os.path.exists(target_file):
            try:
                req = urllib.request.Request(full_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as resp:
                    data = resp.read()
                with open(target_file, 'wb') as tf:
                    tf.write(data)
                downloaded += 1
            except Exception as e:
                print('Error downloading:', full_url, e)

print(f'Downloaded {downloaded} new assets to public/figma-assets')
print(f'Total mapped assets: {len(url_to_local)}')

with open(os.path.join(batch_dir, 'asset_map.json'), 'w', encoding='utf-8') as jf:
    json.dump(url_to_local, jf, indent=2)

print('Asset map saved.')
