"""Render existing supplied layers for review. No art generation or retouching."""
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
data = json.loads(subprocess.check_output([
    "node", "--input-type=module", "-e",
    'import {FACE_CATALOG} from "./src/conversation/face/catalog.mjs";'
    'import {FACE_PRESETS,FACE_LAYER_ORDER} from "./src/conversation/face/presets.mjs";'
    'console.log(JSON.stringify({catalog:FACE_CATALOG,presets:FACE_PRESETS,layers:FACE_LAYER_ORDER}));'
], cwd=ROOT))
catalog = data["catalog"]
assets = {asset["assetId"]: asset for asset in catalog["assets"]}
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
heading = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 19)
cell_w, cell_h, cols = 230, 326, 5
sheet = Image.new("RGB", (cell_w * cols, 60 + cell_h * 3), "#101923")
draw = ImageDraw.Draw(sheet)
draw.text((16, 10), "MARCUS / FORWARD-EYE COMPOSITIONS", font=heading, fill="#50e5e5")
draw.text((16, 36), "13 authored states / 27 supplied overlays / local review candidates; owner approval pending", font=font, fill="white")

for index, preset in enumerate(data["presets"].values()):
    portrait = Image.new("RGBA", (round(catalog["canvas"]["width"] * 2), round(catalog["canvas"]["height"] * 2)))
    layers = [catalog["base"]] + [assets[preset["targets"][slot]] for slot in data["layers"] if preset["targets"][slot]]
    for layer in layers:
        picture = Image.open(ROOT / "public/encounter" / layer["src"].lstrip("/")).convert("RGBA")
        picture = picture.resize((round(layer["width"] * 2), round(layer["height"] * 2)), Image.Resampling.LANCZOS)
        portrait.alpha_composite(picture, (round(layer["x"] * 2), round(layer["y"] * 2)))
    portrait.thumbnail((220, 278), Image.Resampling.LANCZOS)
    x, y = (index % cols) * cell_w, 60 + (index // cols) * cell_h
    sheet.paste(portrait, (x + (cell_w - portrait.width) // 2, y), portrait)
    draw.text((x + 8, y + 282), preset["id"], font=font, fill="#f5de8d")
    draw.text((x + 8, y + 300), "BASE" if preset["id"] == "COMPOSED_BASE" else "G13 centered eyes", font=font, fill="#b9c4cf")

target = ROOT / "docs/conversation-system-v01/marcus-forward-eyes-contact-sheet.png"
sheet.save(target)
print(target)
