# SIG Eagle Eye website

Marketing website for SIG Eagle Eye: proactive labour intelligence for South African employers.

It is a plain static site: HTML, CSS and JavaScript with no build step and nothing running on the server except one small PHP script, `api/lead.php`, which emails SIG when someone asks to speak to us. Every page in this repository is complete and can be uploaded as it is. Motion uses GSAP, ScrollTrigger, SplitText and Lenis, which are included in `assets/js/vendor/`. Fonts are served from the site itself.

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
| `/contact/` | Sign-up funnel: count cameras and sites, pick an installation date, set up a debit order. "Want to speak to us first?" emails SIG instead |
| `/privacy-policy/` | POPIA privacy notice for the website |
| `/404.html` | Page-not-found |

## Preview locally

```bash
php -S 127.0.0.1:8811
```

Then open http://127.0.0.1:8811. Use a local server rather than opening files directly, because the site uses root paths such as `/assets/...`. PHP runs `api/lead.php`; on localhost it writes the email to the server log instead of sending it.

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

## Statistics and court cases

The homepage table "The record, industry by industry" (`#the-record`), the "In the courts" sections on the industry pages, the healthcare page's council figures (`#in-the-council`), the compliance page's cost timeline (`#cost`) and the FAQ answer on CCMA outcomes use these sources. Every figure is cited on the page next to it.

- **Cases a year, by industry**: CCMA Annual Report 2024/25, Figure 5 (the CCMA only publishes its eight biggest sectors). The CCMA usually publishes its next annual report in October, so refresh the table and the cost timeline when the 2025/26 report is out.
- **Who wins**: nobody publishes employer win or loss counts by industry. The CCMA's reports stopped at volumes, and the road freight, private security and metal industry councils publish none. The Public Health and Social Development Sectoral Bargaining Council is the exception (Annual Report 2024/25: 49 of 215 awards against the employer). The last national split is for 2011/12 (ILO Working Paper 47, 2013). Don't use the unsourced "63% of cases go to employees" figure that circulates online.
- **Latest employer losses in the table**: [2024] ZALCD 26 (security), [2026] ZALCJHB 50 (retail), [2025] ZALCJHB 587 (vehicle rental), [2026] ZALCJHB 215 (mining services) and [2026] 5 BLLR 495 (LC), a tyre maker. Check for newer judgments when you refresh the table.
- **Court cases**: summarised from the judgments on SAFLII and, where noted, GroundUp, IOL and De Rebus reports. Employer names are kept out of the copy; each case links to its judgment or report.
- **Other figures**: PSIRA Annual Report 2024/25 (security officers), RTMC State of Road Safety Report 2024 (crash factors), IRJEMS 4(4), April 2025 (Mangaung retail survey), and the Sunday Times, September 2026 (2026 mine deaths to 14 September).

## The sign-up funnel

`/contact/` opens with a picker: little camera tiles and site tiles, each with a number field for exact counts. Everyone signs up the same way, whatever the size:

- **Sign up online.** A pretend installation calendar (weekdays, two working days out, six weeks ahead, South African public holidays closed, some days and arrival windows shown as taken), then contact and site details, then a debit order for R400 per camera a month, approved through a simulated DebiCheck request in the customer's banking app. With more than one site, the date and address are for the first site.
- **Want to speak to us first?** A button in the left-hand column and under every sign-up step (and any link to `/contact/#speak`) leaves the sign-up for a short form about the business, then a call-back calendar: a weekday (from the next working day, three weeks ahead, public holidays closed) and morning (08:00–12:00) or afternoon (12:00–17:00). `api/lead.php` emails this to SIG. The visitor gets no email: their confirmation is on the page. If the send fails, they are offered their own email app instead.

The price is an attribute on the `<form>` in `contact/index.html`: `data-price` (rand per camera a month). The left-hand column of that page and the pricing answers on the home page and `/faq/` repeat it, so change them together. The behaviour lives in `assets/js/pages/contact.js` and the styles in `assets/css/page-contact.css`.

**The sign-up is a demo.** The calendars book nothing, the debit order creates no mandate (the bank fields have no `name` attribute), and nothing from the sign-up is emailed or saved. The page says so on the debit order step and on the confirmation.

## Languages

The globe in the header (and in the mobile menu) translates the whole site with Google Translate: English, the other ten written South African official languages, French and Portuguese. Add a language by adding an `<option>` to the picker in `tools/partials/header.html`. Google's script only loads after someone picks a language, and the footer says the English text is the official version. On a translated page, headings skip their line-by-line animation so that Google translates them whole, and `SIG Eagle Eye`, `DebiCheck`, `POPIA` and `CCMA` stay as they are (`NO_TRANSLATE` in `assets/js/site.js`).

## Deploying

Upload everything **except** `tools/`, `.git/` and `README.md` to the web root (on Hostinger, `public_html`). The included `.htaccess` serves the branded 404 page, forces HTTPS, sets security and caching headers, and blocks the maintenance files if they are uploaded by mistake. Uncomment the `www` rule in `.htaccess` once the domain points at the host.

## Before launch

- [ ] Confirm the domain and email (currently `https://www.sigeagleeye.co.za` and `info@sigeagleeye.co.za`) and run the `--set-domain` / `--set-email` commands if they differ.
- [ ] Add the registered company name, registration number and physical address to `/privacy-policy/`, and name the Information Officer.
- [ ] Confirm whether the R400 per camera price includes VAT (Keegan gave it as "roughly R400" on 10 Nov 2026).
- [ ] Create the info@ mailbox on Hostinger, then send one real "Want to speak to us first?" request and check it arrives. Until the mailbox exists those requests go nowhere.
- [ ] Before `/contact/` takes real sign-ups: replace the simulated calendar and debit order with real ones (a booking calendar and a DebiCheck provider), and confirm whether R400 per camera a month includes VAT.
- [ ] Have the legal copy on `/compliance/`, `/for-employees/` and `/faq/`, and the court case summaries on the homepage and industry pages, checked by the SIG labour law team. It reflects the law as at September 2026 and is written as general information.
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
