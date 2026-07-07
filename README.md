# Made Possible — Single-Page Website

Single-page site for **Made Possible**, a 3D printing maker business on the Waterside, New Forest, Hampshire. Founder: Leanne. Built as an **information and communication tool, not a sales channel**.

Everything lives in `index.html` (embedded CSS + JS, no build step, no dependencies beyond Google Fonts).

## Brand quick reference

| Element | Value |
|---|---|
| Tagline | "Proudly Local" |
| Primary | Forest Green `#2D5E40` |
| Secondary | Coast Blue `#3A7CA5` |
| Accents | Sandstone `#C8A97E`, Driftwood `#8B7355` |
| Background | Off-White `#F5F2EC` |
| Display font | Montserrat Bold |
| Body font | Inter |
| Accent font | Playfair Display Italic |

## Content rules — do not undo these

These were deliberate corrections; keep them intact when editing copy:

1. **No overstated sustainability claims.** PLA is plant-based but only industrially compostable, which most UK households can't access via kerbside collection. Never say "compostable" as a product benefit, "goes back to the earth", "biodegradable", or "less plastic". The approved framing is **"creating responsibly when adding material/plastic to the world"** — plant-based feedstock, waste-conscious design, remelting offcuts, durable keepers. The "Being straight about our materials" box must stay.
2. **Local leads, sustainability second.** Pillar order and mission wording reflect this on purpose.
3. **Commissions are considered, not excluded.** Don't reintroduce "no custom orders / no print-on-demand" absolutes. But this is not a print-on-demand service either — the range of Leanne's own designs is the headline.
4. **No photo of Leanne.** The About section is text-only at her request. Don't add a portrait slot back.
5. **Gallery, not shop.** The "Designs" section is a photo gallery, not a product grid — no prices, product names, or buy buttons.

## Remaining work (TODO)

- [ ] **Public contact email**: the form currently posts to a private Formspree destination that is *not* shown anywhere on the page. Once a proper business email exists, consider adding it back to the "Find us in person" contact block and switching the Formspree destination over.
- [ ] **Confirm with Leanne**: the materials box invites customers to return end-of-life pieces "back into the loop" — confirm she's happy to honour returns, or cut that sentence.
- [ ] **Blog (later)**: footer teases "a journal of new pieces and market dates". When added, keep the single-page structure and link out, or convert to a small static site generator.
- [ ] **Formspree activation**: the very first form submission after deploy triggers a one-time confirmation email to the Formspree destination address — it must be clicked before messages start delivering.
- [ ] **Review gallery `alt` text**: descriptions were inferred from photo filenames (e.g. `foexes.jpg` → "fox figurines"), not written by Leanne — worth a pass to confirm accuracy and add any product-specific detail.

## Done

- [x] **Photos**: gallery wired up with 13 real photos from `images/` as `<img>` tags with descriptive `alt` text (masonry desktop / swipe carousel mobile, both automatic).
- [x] **Contact form wired**: submits via `fetch` to Formspree (no page reload), with a honeypot field and real inline success/error messaging.
- [x] **Favicon + social meta**: `favicon.svg` added; `og:title`, `og:description`, `og:image`, and Twitter card meta added, pointing at the GitHub Pages URL.

## Layout notes

- Responsive breakpoints: nav collapses ≤760px; "The Loop" is a horizontal track >980px, compact 761–980px, centred vertical timeline ≤760px; gallery is 3-col masonry >900px, 2-col 701–900px, swipe carousel (scroll-snap, square tiles, hidden scrollbar, swipe hint) ≤700px.
- Scroll-reveal animations respect `prefers-reduced-motion`.
- No JS frameworks; keep it dependency-free.

## Local preview

Open `index.html` in a browser, or `python3 -m http.server` in this folder.
