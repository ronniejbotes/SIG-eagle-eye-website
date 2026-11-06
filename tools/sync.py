#!/usr/bin/env python3
"""
SIG Eagle Eye: keep the shared parts of every page in step.

The website is plain HTML. Every page is complete and deployable as it sits
in this repository; nothing needs building. This script is only a
maintenance helper for things that repeat across pages:

  * Stamps tools/partials/*.html into each page between markers:
        <!-- @include header -->  ...  <!-- /@include header -->
  * Marks the current page in the navigation (aria-current / is-current).
  * Adds a content hash to CSS and JS links (?v=...) so browsers fetch
    fresh files after a change, even with long cache headers.
  * Rewrites sitemap.xml from the pages that exist (the 404 page is left out).
  * Swaps the domain everywhere with:  python3 tools/sync.py --set-domain https://example.co.za
  * Swaps the contact email everywhere with:  python3 tools/sync.py --set-email hello@example.co.za

Run from anywhere:  python3 tools/sync.py
Standard library only (Python 3.8+).
"""
import datetime
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
PARTIALS = TOOLS / "partials"
CONFIG = TOOLS / "site.json"
SKIP_DIRS = {"tools", ".git", "node_modules", ".claude"}
NOT_IN_SITEMAP = {"/404.html"}
TEXT_SUFFIXES = {".html", ".xml", ".txt", ".webmanifest", ".json", ".php"}

SECTIONS = {
    "solution": ("/how-it-works/", "/compliance/", "/for-employees/"),
    "industries": ("/industries/",),
}


def load_config():
    return json.loads(CONFIG.read_text(encoding="utf-8"))


def pages():
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if rel.parts[0] in SKIP_DIRS:
            continue
        yield path


def url_path(path):
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def render_partial(name, cfg):
    text = (PARTIALS / f"{name}.html").read_text(encoding="utf-8").rstrip("\n")
    for key, value in cfg.items():
        text = text.replace("{{" + key.upper() + "}}", str(value))
    return text


def mark_current(html, current):
    """aria-current on links to this page; is-current on the parent nav button."""

    def link(match):
        tag = match.group(0)
        href = match.group(1)
        tag = re.sub(r'\saria-current="page"', "", tag)
        if href == current:
            tag = tag[:-1] + ' aria-current="page">'
        return tag

    html = re.sub(r'<a\b[^>]*\bhref="(/[^"]*)"[^>]*>', link, html)

    def button(match):
        tag = match.group(0)
        section = match.group(1)
        tag = tag.replace(" is-current", "")
        prefixes = SECTIONS.get(section, ())
        if any(current.startswith(p) for p in prefixes):
            tag = tag.replace('class="nav__link"', 'class="nav__link is-current"')
        return tag

    return re.sub(r'<button class="nav__link(?: is-current)?"[^>]*data-section="(\w+)"[^>]*>', button, html)


def stamp(html, cfg):
    def repl(match):
        indent, name = match.group(1), match.group(2)
        body = render_partial(name, cfg)
        body = "\n".join((indent + line) if line else line for line in body.split("\n"))
        return f"{indent}<!-- @include {name} -->\n{body}\n{indent}<!-- /@include {name} -->"

    return re.sub(
        r"([ \t]*)<!-- @include (\w+) -->.*?<!-- /@include \2 -->",
        repl,
        html,
        flags=re.S,
    )


_hashes = {}


def asset_hash(rel):
    if rel not in _hashes:
        file = ROOT / rel.lstrip("/")
        if not file.exists():
            return None
        _hashes[rel] = hashlib.md5(file.read_bytes()).hexdigest()[:8]
    return _hashes[rel]


def bust(html):
    def repl(match):
        rel = match.group(1)
        digest = asset_hash(rel)
        if not digest:
            return match.group(0)
        return f'"{rel}?v={digest}"'

    return re.sub(r'"(/assets/(?:css|js)/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"', repl, html)


def set_domain(new):
    cfg = load_config()
    old = cfg["domain"].rstrip("/")
    new = new.rstrip("/")
    changed = 0
    for path in list(ROOT.rglob("*")):
        if path.suffix not in {".html", ".xml", ".txt", ".webmanifest"}:
            continue
        if path.relative_to(ROOT).parts[0] in SKIP_DIRS:
            continue
        text = path.read_text(encoding="utf-8")
        if old in text:
            path.write_text(text.replace(old, new), encoding="utf-8")
            changed += 1
    cfg["domain"] = new
    CONFIG.write_text(json.dumps(cfg, indent=2) + "\n", encoding="utf-8")
    print(f"Domain {old} -> {new} in {changed} files")


def set_email(new):
    """Replace the contact email in every page, partial and config file."""
    cfg = load_config()
    old = cfg["email"]
    changed = 0
    for path in list(ROOT.rglob("*")):
        if path.suffix not in TEXT_SUFFIXES or not path.is_file():
            continue
        parts = path.relative_to(ROOT).parts
        if parts[0] in SKIP_DIRS and parts[:2] != ("tools", "partials"):
            continue
        text = path.read_text(encoding="utf-8")
        if old in text:
            path.write_text(text.replace(old, new), encoding="utf-8")
            changed += 1
    cfg["email"] = new
    CONFIG.write_text(json.dumps(cfg, indent=2) + "\n", encoding="utf-8")
    print(f"Email {old} -> {new} in {changed} files")


def write_sitemap(cfg):
    """sitemap.xml lists every public page, dated by when its file last changed."""
    domain = cfg["domain"].rstrip("/")
    rows = []
    for path in pages():
        url = url_path(path)
        if url in NOT_IN_SITEMAP:
            continue
        html = path.read_text(encoding="utf-8")
        if re.search(r'<meta name="robots" content="[^"]*noindex', html):
            continue
        day = datetime.date.fromtimestamp(path.stat().st_mtime).isoformat()
        rows.append(f"  <url>\n    <loc>{domain}{url}</loc>\n    <lastmod>{day}</lastmod>\n  </url>")
    rows.sort(key=lambda r: (r.count("/"), r))
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(rows)
        + "\n</urlset>\n"
    )
    target = ROOT / "sitemap.xml"
    if not target.exists() or target.read_text(encoding="utf-8") != xml:
        target.write_text(xml, encoding="utf-8")
    return len(rows)


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--set-domain":
        set_domain(sys.argv[2])
    if len(sys.argv) == 3 and sys.argv[1] == "--set-email":
        set_email(sys.argv[2])
    cfg = load_config()
    count = 0
    for path in pages():
        original = path.read_text(encoding="utf-8")
        html = stamp(original, cfg)
        html = mark_current(html, url_path(path))
        html = bust(html)
        if html != original:
            path.write_text(html, encoding="utf-8")
            count += 1
    print(f"Synced {count} page(s), sitemap lists {write_sitemap(cfg)} URLs")


if __name__ == "__main__":
    main()
