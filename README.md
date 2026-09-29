# SIG Eagle Eye website

Marketing website for SIG Eagle Eye: proactive labour intelligence for South African employers.

It is a plain static site: HTML, CSS and JavaScript with no build step. Every page in this repository is complete and can be uploaded as it is. Motion uses GSAP, ScrollTrigger, SplitText and Lenis, which are included in `assets/js/vendor/`. Fonts are served from the site itself.

## Pages

| URL | What it is |
| --- | --- |
| `/` | Homepage |
| `/how-it-works/` | The five stages, with interactive examples |
| `/compliance/` | Legal and ethical compliance, act by act, plus a readiness check |
| `/for-employees/` | Plain-language page employers can share with their teams |
| `/industries/` | Industry hub and risk matrix |
| `/industries/manufacturing/` and five more | One page per industry, each with its own signature section |
| `/faq/` | Searchable FAQ |
| `/contact/` | Site assessment booking form |
| `/privacy-policy/` | POPIA privacy notice for the website |
| `/404.html` | Page-not-found |

## Preview locally

```bash
python3 -m http.server 8811
```

Then open http://localhost:8811. Use a local server rather than opening files directly, because the site uses root paths such as `/assets/...`.

## Editing

- **Page content** lives in each page's `index.html`.
- **Header, footer and the shared `<head>` tags** live in `tools/partials/`. Edit them there, then run the sync script so every page gets the change.
- **Styles**: `assets/css/site.css` is the design system, `inner.css` has shared inner-page blocks, and each page has its own stylesheet (`page-*.css` or `industry-*.css`).
- **Scripts**: `assets/js/site.js` handles navigation, tabs and forms, `motion.js` handles scroll animation, and `assets/js/pages/` has one script per page.

After any edit, run:

```bash
python3 tools/sync.py
```

It stamps the partials into every page, marks the current page in the navigation, adds a content hash to CSS and JS links so browsers fetch fresh files, and rewrites `sitemap.xml`.

To change the domain or the contact email everywhere:

```bash
python3 tools/sync.py --set-domain https://www.example.co.za
python3 tools/sync.py --set-email hello@example.co.za
```

Social share images (`assets/img/og/`) are drawn from the site's own photos and fonts. Rebuild them after changing a headline or a hero photo (needs Pillow and NumPy):

```bash
python3 tools/og.py
```

## The contact form

The form on `/contact/` validates in the browser and then does one of two things:

1. **If `data-endpoint` is set** on the `<form>` in `contact/index.html`, it posts the fields there. Any service that accepts a form `POST` works, for example FormSubmit (`https://formsubmit.co/ajax/you@yourdomain`), Web3Forms, or your own script.
2. **If it is empty (the current setting)**, it opens the visitor's email app with the request filled in, addressed to the contact email.

Setting an endpoint before launch is strongly recommended, so no enquiry depends on the visitor's email app.

## Deploying

Upload everything **except** `tools/`, `.git/` and `README.md` to the web root (on Hostinger, `public_html`). The included `.htaccess` serves the branded 404 page, forces HTTPS, sets security and caching headers, and blocks the maintenance files if they are uploaded by mistake. Uncomment the `www` rule in `.htaccess` once the domain points at the host.

## Before launch

- [ ] Confirm the domain and email (currently `https://www.sigeagleeye.co.za` and `info@sigeagleeye.co.za`) and run the `--set-domain` / `--set-email` commands if they differ.
- [ ] Add the registered company name, registration number and physical address to `/privacy-policy/`, and name the Information Officer.
- [ ] Set the contact form endpoint (see above).
- [ ] Have the legal copy on `/compliance/`, `/for-employees/` and `/faq/` checked by the SIG labour law team. It reflects the law as at September 2026 and is written as general information.
- [ ] Submit `sitemap.xml` in Google Search Console.

## Image sources

Stock photographs are public domain or CC0 and need no attribution. They are listed here for the record.

| Site image | Source | Licence |
| --- | --- | --- |
| `hero-warehouse-floor` | [US Department of Agriculture, Flickr](https://live.staticflickr.com/65535/50124075117_281b7b73b9_3k.jpg) | CC0 |
| `mfg-welder` | [US Department of Agriculture, Flickr](https://live.staticflickr.com/65535/49624908928_3aa3a65461_3k.jpg) | CC0 |
| `mfg-grinder-ppe` | [Flickr (US government)](https://live.staticflickr.com/65535/50918443448_741fd94057_k.jpg) | CC0 |
| `mfg-garment-line` | [US Embassy Ghana, Flickr](https://live.staticflickr.com/7328/27736952211_32c848ad22_3k.jpg) | CC0 |
| `log-loading-docks` | [US Department of Agriculture, Flickr](https://live.staticflickr.com/65535/49704703168_aa540cb556_3k.jpg) | CC0 |
| `log-cargo-forklift` | [US Customs and Border Protection, Flickr](https://live.staticflickr.com/65535/49716835622_7ec5d58f5a_3k.jpg) | Public domain (US government work) |
| `log-forklift-stack` | [US Department of Agriculture, Flickr](https://live.staticflickr.com/65535/50253732346_e58c1fd2fd_3k.jpg) | CC0 |
| `mine-open-pit` | [US Department of Agriculture, Flickr](https://live.staticflickr.com/4580/25005168488_52e31f2235_3k.jpg) | CC0 |
| `mine-haul-truck` | [US Department of Agriculture, Flickr](https://live.staticflickr.com/65535/48443663852_477ed6fac7_3k.jpg) | CC0 |
| `mine-dump-truck` | [USDA, Flickr](https://www.flickr.com/photos/41284017@N08/48443683507) | Public domain |
| `health-corridor` | [Navy Medicine, Flickr](https://www.flickr.com/photos/61270229@N05/50230497292) | Public domain |
| `health-medicine-store` | [Navy Medicine, Flickr](https://www.flickr.com/photos/61270229@N05/49898538112) | Public domain |
| `health-dispensary` | [Navy Medicine, Flickr](https://www.flickr.com/photos/61270229@N05/49746100666) | Public domain |
| `health-clinicians` | [Navy Medicine, Flickr](https://www.flickr.com/photos/61270229@N05/51975701629) | Public domain |
| `retail-store-tills` | [Flickr](https://live.staticflickr.com/1840/43091984125_9bfec6ce91_3k.jpg) | CC0 |
| `retail-cashiers` | [Daquella manera, Flickr](https://www.flickr.com/photos/62518311@N00/96148841) | CC0 |
| `sec-gate-night` | [US Department of Energy, Flickr](https://live.staticflickr.com/8481/8266056011_d30be30f63_3k.jpg) | CC0 |
| `sec-handler-dog` | [US Embassy Montevideo, Flickr](https://www.flickr.com/photos/41243200@N08/5240860229) | Public domain |
| `sec-officer-radio` | [US Forest Service, Flickr](https://live.staticflickr.com/7123/28030551261_44469526dd_k.jpg) | CC0 |
| `sec-camera-notice` | [Bhisittha, WordPress Photo Directory](https://wordpress.org/photos/photo/34663cd5a4/) | CC0 |
| `sec-entrance-blue` | [James Sutton, StockSnap](https://stocksnap.io/photo/people-girl-33H0YKXQQT) | CC0 |
| `wh-picker-hivis` | [US Department of Agriculture, Flickr](https://live.staticflickr.com/65535/49705661342_e3c843a6af_3k.jpg) | CC0 |
| `wh-packing` | [US Department of Agriculture, Flickr](https://live.staticflickr.com/65535/50252983278_0c62c82050_3k.jpg) | CC0 |
| `wh-line-aerial` | [US Department of Agriculture, Flickr](https://live.staticflickr.com/65535/50253633661_cda1b7b0a6_3k.jpg) | CC0 |
| `wh-panorama` | [US Department of Agriculture, Flickr](https://live.staticflickr.com/65535/50123322793_dd41341ebc_3k.jpg) | CC0 |
| `control-room`, `legal-stamp` | Cropped from the SIG Eagle Eye proposal deck | Client material |
| `sec-gatehouse-night`, `sec-perimeter-patrol`, `sec-control-room`, `review-desk`, `team-briefing`, `site-assessment-walk`, `fair-hearing`, `forklift-operator-portrait` | Generated for this site with Higgsfield (GPT Image 2.5). No real people are depicted. | Owned by the account that generated them |
