# Cyclelava

Website for **Cyclelava / The Cycling Point**, F-8 Markaz, Islamabad, and the **Hikencyc** cycling community (rides every Friday night and Sunday morning).

Static HTML/CSS/JS. No build step. Deployed to GitHub Pages on every push to `master` (see `.github/workflows/deploy.yml`, custom domain in `CNAME`).

## Pages
`/` Home · `/about/` · `/events/` (rides) · `/rentals/` · `/shop/` · `/app/` (coming soon) · `/contact/`

## Details to keep in sync
- WhatsApp / phone: `+92 300 1294738` (`wa.me/923001294738`), also set in `assets/js/main.js`
- Instagram: `@cyclelava`
- SEO: per-page title/description/canonical/Open Graph, JSON-LD (BikeStore, Person, FAQ, Breadcrumb), `sitemap.xml`, `robots.txt`

## Event booking
`/events/` and the home hero ("Book an event" toggle) list upcoming events and take bookings without an account, through the Hikencyc portal's public API (`/api/public/events`, URL set at the top of `assets/js/events.js`). A booking lands in the portal under Admin > Pending Invoices (source "web"); once approved, the visitor's QR ticket shows on the site via their private link (`/events/?booking=<token>`, also remembered in the browser).

## Local preview
```
python -m http.server 8000
```
Open http://localhost:8000 (pages use root-relative links, so a server is required).
