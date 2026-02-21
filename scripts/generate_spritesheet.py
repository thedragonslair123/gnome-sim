#!/usr/bin/env python3
"""
Generate raster sprite-sheets from SVG frame files listed in <name>_sprites.json.

Usage:
  python3 scripts/generate_spritesheet.py gnome
  python3 scripts/generate_spritesheet.py oldwoman

Requires: cairosvg, Pillow
"""
import sys
import json
from pathlib import Path

try:
    import cairosvg
    from PIL import Image
except Exception as e:
    print('Missing dependencies. Install with: pip install -r requirements.txt')
    raise

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'

def load_json(name):
    path = ASSETS / f'{name}_sprites.json'
    with open(path,'r',encoding='utf-8') as f:
        return json.load(f)

def render_svg_to_png(svg_path, out_path):
    cairosvg.svg2png(url=str(svg_path), write_to=str(out_path))

def generate(name, dprs=(1,)):
    data = load_json(name)
    frames = data.get('frames', [])
    if not frames:
        print('No frames found in', name)
        return
    # Render each DPR variant
    for dpr in dprs:
        pngs = []
        for i,src in enumerate(frames):
            src_path = ROOT / src
            out_png = ASSETS / f'{name}_frame_{i}{"@%dx"%dpr if dpr>1 else ""}.png'
            print('Rendering', src_path, '->', out_png, '(dpr=',dpr,')')
            # use scale for cairosvg to rasterize at higher DPR
            scale = dpr
            cairosvg.svg2png(url=str(src_path), write_to=str(out_png), scale=scale)
            pngs.append(out_png)
        # open PNGs and compose horizontal sheet
        imgs = [Image.open(p).convert('RGBA') for p in pngs]
        widths = [im.width for im in imgs]
        heights = [im.height for im in imgs]
        fw = max(widths); fh = max(heights)
        sheet_w = fw * len(imgs); sheet_h = fh
        sheet = Image.new('RGBA', (sheet_w, sheet_h), (0,0,0,0))
        frames_meta = []
        x = 0
        for im in imgs:
            sheet.paste(im, (x, (fh - im.height)//2), im)
            frames_meta.append({'x': x, 'y': 0, 'w': fw, 'h': fh})
            x += fw
        suffix = f'@{dpr}x' if dpr>1 else ''
        out_sheet = ASSETS / f'{name}_sheet{suffix}.png'
        sheet.save(out_sheet)
        # write updated JSON with sheet + frames
        data_out = {'sheet': str(Path('assets') / out_sheet.name), 'frames': frames_meta, 'frameRate': data.get('frameRate', 6), 'dpr': dpr}
        out_json = ASSETS / f'{name}_sprites_generated{suffix}.json'
        with open(out_json,'w',encoding='utf-8') as f:
            json.dump(data_out, f, indent=2)
        print('Wrote', out_sheet, 'and', out_json)

if __name__ == '__main__':
    if len(sys.argv)<2:
        print('Usage: generate_spritesheet.py <name> (e.g. gnome or oldwoman)')
        sys.exit(1)
    name = sys.argv[1]
    if len(sys.argv) > 2:
        try:
            dprs = tuple(int(x) for x in sys.argv[2:])
        except Exception:
            dprs = (1,)
    else:
        # default to generating multiple DPR variants including 4x for high-resolution (4K) assets
        dprs = (1,2,3,4)
    generate(name, dprs=dprs)
