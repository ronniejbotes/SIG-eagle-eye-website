#!/usr/bin/env python3
"""
SIG Eagle Eye: build the social share cards (Open Graph images).

Each page's og:image points at /assets/img/og/og-<page>.jpg. This script draws
those 1200 x 630 cards from the site's own photos and fonts, so they always
match the website. Re-run it after changing a headline or a hero photo:

    python3 tools/og.py

Needs Pillow and NumPy (pip install Pillow numpy). Everything else comes from
this repository.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"
FONTS = ROOT / "assets" / "fonts"
OUT = IMG / "og"
W, H = 1200, 630

NAVY = (2, 10, 28)
GOLD = (214, 178, 107)
WHITE = (255, 255, 255)

# file, photo, focus (x, y) of the subject, zoom, mirror, eyebrow, headline, serif line
CARDS = [
    ("og-home.jpg", "hero-warehouse-floor-2400.webp", (0.72, 0.55), 1.0, False, "SIG Eagle Eye", "Proactive labour intelligence", "for South African employers."),
    ("og-manufacturing.jpg", "mfg-welder-2200.webp", (0.5, 0.42), 1.0, False, "Manufacturing", "Safer lines. Fairer discipline.", "Labour intelligence for manufacturing."),
    ("og-logistics-fleet.jpg", "log-loading-docks-2400.webp", (0.6, 0.5), 1.0, False, "Logistics & fleet", "Every bay, every load,", "every handover."),
    ("og-mining-earthmoving.jpg", "mine-open-pit-2400.webp", (0.55, 0.5), 1.0, False, "Mining & earthmoving", "Zero Harm needs", "early warnings."),
    ("og-healthcare.jpg", "health-corridor-2000.webp", (0.5, 0.5), 1.0, False, "Healthcare facilities", "Care for patients.", "Fairness for staff."),
    ("og-retail-warehousing.jpg", "retail-store-tills-2200.webp", (0.6, 0.55), 1.0, False, "Retail & warehousing", "Shrinkage has a pattern.", "So does fairness."),
    ("og-security-operations.jpg", "sec-gatehouse-night-2000.webp", (0.68, 0.5), 1.0, False, "Security operations", "Who watches the watchers?", "Eagle Eye does."),
    ("og-industries.jpg", "wh-line-aerial-2200.webp", (0.6, 0.5), 1.0, False, "Industries", "One method.", "Six very different workplaces."),
    ("og-how-it-works.jpg", "review-desk-2000.webp", (0.5, 0.45), 1.0, True, "How it works", "Five stages.", "A person decides, every time."),
    ("og-compliance.jpg", "fair-hearing-1400.webp", (0.55, 0.45), 1.0, True, "Legal & ethical compliance", "The law is in the design.", "Not in the small print."),
    ("og-for-employees.jpg", "team-briefing-2000.webp", (0.62, 0.42), 1.18, False, "For employees", "What Eagle Eye means", "for you at work."),
    ("og-faq.jpg", "wh-panorama-2400.webp", (0.62, 0.5), 1.0, False, "Frequently asked questions", "Ask us anything.", "Straight answers."),
    ("og-contact.jpg", "site-assessment-walk-2000.webp", (0.5, 0.45), 1.0, True, "Book a site assessment", "Show us your site.", "We'll walk it with you."),
    ("og-privacy-policy.jpg", None, (0.5, 0.5), 1.0, False, "Privacy policy", "Your information,", "handled the way we'd advise."),
]


def font(name, size, weight=None):
    f = ImageFont.truetype(str(FONTS / name), size)
    if weight is not None:
        try:
            f.set_variation_by_axes([weight])
        except OSError:
            pass
    return f


def cover(photo, focus, zoom, mirror):
    """Scale the photo to cover the card and place its subject right of centre."""
    im = Image.open(IMG / photo).convert("RGB")
    if mirror:
        im = ImageOps.mirror(im)
        focus = (1 - focus[0], focus[1])
    scale = max(W / im.width, H / im.height) * zoom
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    fx, fy = focus[0] * im.width, focus[1] * im.height
    left = min(max(fx - W * 0.7, 0), im.width - W)
    top = min(max(fy - H * 0.5, 0), im.height - H)
    im = im.crop((round(left), round(top), round(left) + W, round(top) + H))
    # The site's brand grade: cooler and calmer, so every photo reads as one set.
    im = ImageEnhance.Color(im).enhance(0.72)
    im = ImageEnhance.Contrast(im).enhance(1.06)
    return ImageEnhance.Brightness(im).enhance(0.9)


def shade(card):
    """A navy fade from the left, so the words always sit on calm ground."""
    t = np.linspace(0, 1, W)[None, :]
    v = np.linspace(0, 1, H)[:, None]
    alpha = np.clip(np.maximum(0.3, 0.96 - 0.9 * t ** 1.3) + 0.35 * v ** 2, 0, 1)
    layer = np.zeros((H, W, 4), dtype=np.uint8)
    layer[..., :3] = NAVY
    layer[..., 3] = (alpha * 255).astype(np.uint8)
    return Image.alpha_composite(card.convert("RGBA"), Image.fromarray(layer))


def plain():
    """For pages without a photo: deep navy with a soft blue glow."""
    card = Image.new("RGB", (W, H), NAVY)
    glow = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(glow)
    for r in range(520, 0, -8):
        d.ellipse((980 - r, 120 - r, 980 + r, 120 + r), fill=int(70 * (1 - r / 520)))
    blue = Image.new("RGB", (W, H), (36, 102, 174))
    return Image.composite(blue, card, glow)


def wrap(draw, text, fnt, width):
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=fnt) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines


def spaced(draw, xy, text, fnt, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + tracking
    return x


def build(card_spec):
    name, photo, focus, zoom, mirror, eyebrow, headline, serif_line = card_spec
    card = shade(cover(photo, focus, zoom, mirror)) if photo else plain().convert("RGBA")
    d = ImageDraw.Draw(card)

    # Brand: shield and wordmark.
    shield = Image.open(IMG / "brand" / "shield-200.png").convert("RGBA")
    shield = shield.resize((round(shield.width * 62 / shield.height), 62), Image.LANCZOS)
    card.alpha_composite(shield, (64, 52))
    word = font("eb-garamond-normal-500-700.woff2", 34, 700)
    x = 64 + shield.width + 16
    d.text((x, 64), "SIG", font=word, fill=WHITE)
    d.text((x + d.textlength("SIG ", font=word), 64), "EAGLE EYE", font=word, fill=GOLD)

    # Eyebrow with the gold reticle.
    mono = font("ibm-plex-mono-normal-500.woff2", 19)
    ey = 212
    d.ellipse((64, ey + 3, 80, ey + 19), outline=GOLD, width=2)
    d.ellipse((70, ey + 9, 74, ey + 13), fill=GOLD)
    spaced(d, (94, ey), eyebrow.upper(), mono, (226, 232, 242), 3.2)

    # Headline in Montserrat ExtraBold, the serif line in EB Garamond italic.
    size = 66
    head = font("montserrat-normal-300-900.woff2", size, 800)
    lines = wrap(d, headline.upper(), head, 700)
    while len(lines) > 2 and size > 48:
        size -= 4
        head = font("montserrat-normal-300-900.woff2", size, 800)
        lines = wrap(d, headline.upper(), head, 700)
    y = ey + 44
    for line in lines:
        d.text((62, y), line, font=head, fill=WHITE)
        y += round(size * 1.02)
    # The serif line stays on one line if it can: shrink before wrapping,
    # so it never ends on a single orphaned word.
    s_size = round(size * 1.02)
    serif = font("eb-garamond-italic-500-700.woff2", s_size, 600)
    while d.textlength(serif_line, font=serif) > 900 and s_size > 44:
        s_size -= 2
        serif = font("eb-garamond-italic-500-700.woff2", s_size, 600)
    for line in wrap(d, serif_line, serif, 900):
        d.text((64, y + 2), line, font=serif, fill=GOLD)
        y += round(s_size * 1.05)

    # Footer rule and line.
    d.line((64, 548, 144, 548), fill=GOLD, width=3)
    small = font("ibm-plex-mono-normal-500.woff2", 17)
    spaced(d, (64, 566), "PROACTIVE LABOUR INTELLIGENCE · SOUTH AFRICA", small, (170, 180, 198), 2.4)

    OUT.mkdir(parents=True, exist_ok=True)
    card.convert("RGB").save(OUT / name, "JPEG", quality=84, optimize=True, progressive=True)
    return OUT / name


def main():
    for spec in CARDS:
        path = build(spec)
        print(f"{path.relative_to(ROOT)}  {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
