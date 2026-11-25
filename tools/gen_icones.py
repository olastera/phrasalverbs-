#!/usr/bin/env python3
"""Genera les icones PWA de Phrasal Hero (Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ARREL = Path(__file__).resolve().parent.parent
FONS = (18, 10, 46)  # #120a2e
NEO = (0, 229, 255)  # cian neó
ROSA = (255, 46, 151)


def genera(mida: int, nom: str) -> None:
    img = Image.new('RGBA', (mida, mida), FONS + (255,))
    # resplendor suau de fons
    glow_bg = Image.new('RGBA', (mida, mida), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow_bg)
    r = int(mida * 0.28)
    cx = cy = mida // 2
    gdraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=NEO + (45,))
    glow_bg = glow_bg.filter(ImageFilter.GaussianBlur(radius=max(1, mida // 12)))
    img = Image.alpha_composite(img, glow_bg)

    # lletra P en pixel-art (5x7 caselles) dins el 60 % central: no depèn de cap font
    # (Pillow no llegeix .woff2 i la font per defecte la deformava)
    patro = [
        'XXXX.',
        'X...X',
        'X...X',
        'XXXX.',
        'X....',
        'X....',
        'X....',
    ]
    zona = mida * 0.6
    cel = zona / len(patro)
    x0 = (mida - cel * len(patro[0])) / 2
    y0 = (mida - zona) / 2

    def pinta(capa, color, desp=0.0):
        d = ImageDraw.Draw(capa)
        for fila, linia in enumerate(patro):
            for col, c in enumerate(linia):
                if c == 'X':
                    x = x0 + col * cel + desp
                    y = y0 + fila * cel + desp
                    d.rectangle([x, y, x + cel - 1, y + cel - 1], fill=color)

    # ombra rosa i resplendor cian
    sc = Image.new('RGBA', (mida, mida), (0, 0, 0, 0))
    pinta(sc, ROSA + (150,), desp=mida * 0.025)
    img = Image.alpha_composite(img, sc.filter(ImageFilter.GaussianBlur(radius=max(1, mida // 60))))
    for blur, alpha in [(mida // 16, 120), (mida // 40, 180)]:
        gc = Image.new('RGBA', (mida, mida), (0, 0, 0, 0))
        pinta(gc, NEO + (alpha,))
        img = Image.alpha_composite(img, gc.filter(ImageFilter.GaussianBlur(radius=max(1, blur))))

    # lletra principal
    lc = Image.new('RGBA', (mida, mida), (0, 0, 0, 0))
    pinta(lc, NEO + (255,))
    img = Image.alpha_composite(img, lc)

    img.convert('RGB').save(ARREL / nom, 'PNG')
    print(f'generat {nom} ({mida}x{mida})')


if __name__ == '__main__':
    genera(192, 'icon-192.png')
    genera(512, 'icon-512.png')
    genera(180, 'apple-touch-icon.png')
