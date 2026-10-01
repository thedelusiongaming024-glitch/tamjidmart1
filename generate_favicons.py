import os
from collections import deque
from PIL import Image

src = r'C:\Users\arkoh\.gemini\antigravity\brain\b14e40fb-c67e-413b-844a-845cd2f61c8f\.user_uploaded\media_1790795551922.jpg'
im = Image.open(src).convert('RGBA')
w, h = im.size

# Floodfill light background from the corners
visited = set()
q = deque([(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)])
for pt in q:
    visited.add(pt)

pixels = im.load()

def is_bg(r, g, b):
    # Check if light background: bright and neutral (not green)
    return r > 225 and g > 225 and b > 225 and abs(r - g) < 30 and abs(g - b) < 30

while q:
    x, y = q.popleft()
    r, g, b, a = pixels[x, y]
    if is_bg(r, g, b):
        pixels[x, y] = (0, 0, 0, 0)
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                visited.add((nx, ny))
                q.append((nx, ny))

bbox = im.getbbox()
cropped = im.crop(bbox)

# Create a clean square canvas (512x512)
target_size = 512
canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))

# Scale cropped squircle with slight padding (480x480 max)
max_dim = 486
ratio = min(max_dim / cropped.width, max_dim / cropped.height)
new_w = int(cropped.width * ratio)
new_h = int(cropped.height * ratio)
scaled = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

offset = ((target_size - new_w) // 2, (target_size - new_h) // 2)
canvas.paste(scaled, offset, scaled)

# Target directories
dirs = ['public', 'dist', 'uploads']
for d in dirs:
    os.makedirs(d, exist_ok=True)
    # Save standard PNGs
    canvas.save(os.path.join(d, 'favicon.png'), 'PNG')
    canvas.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(d, 'apple-touch-icon.png'), 'PNG')
    canvas.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(d, 'favicon-32x32.png'), 'PNG')
    canvas.resize((16, 16), Image.Resampling.LANCZOS).save(os.path.join(d, 'favicon-16x16.png'), 'PNG')
    
    # Save multi-resolution ICO (16, 32, 48)
    ico_img = canvas.resize((48, 48), Image.Resampling.LANCZOS)
    ico_img.save(
        os.path.join(d, 'favicon.ico'),
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48)]
    )

print("All favicon assets successfully generated across public, dist, and uploads!")
