# Cyclelava

Website for **Cyclelava / The Cycling Point**, F-8 Markaz, Islamabad, and the **Hikencyc** cycling community (rides every Friday night and Sunday morning).

Static HTML/CSS/JS. No build step. Deployed to GitHub Pages on every push to `master` (see `.github/workflows/deploy.yml`, custom domain in `CNAME`).

## Pages
`/` Home · `/about/` · `/events/` (rides) · `/rentals/` · `/shop/` · `/app/` (coming soon) · `/contact/`

## Details to keep in sync
- WhatsApp / phone: `+92 302 8001000` (`wa.me/923028001000`), also set in `assets/js/main.js`
- Instagram: `@cyclelava`
- SEO: per-page title/description/canonical/Open Graph, JSON-LD (BikeStore, Person, FAQ, Breadcrumb), `sitemap.xml`, `robots.txt`

## Local preview
```
python -m http.server 8000
```
Open http://localhost:8000 (pages use root-relative links, so a server is required).
