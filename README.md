# Cyclelava - Cycling Point F-8 Markaz & Hikencyc Community Website

A modern, high-performance website featuring motion graphics, dynamic particle canvas effects, bicycle rentals calculator, Strava-like mobile app preview, and Hikencyc Sunday events registration.

---

## 🌟 Key Features
- **Interactive Motion Graphics**: Canvas particle system simulating lava sparks and cycling velocity trails.
- **Hikencyc Sunday Events**: Live countdown timer to the upcoming Sunday 6:00 AM Margalla rally with one-click WhatsApp RSVP.
- **Cycling Point (F-8 Markaz, Islamabad)**: Store showcase, repair workshop details, and contact for Habib-ur-Rehman (`0302800100`).
- **Fleet Catalog & Rental Price Calculator**: Dynamic price estimator for MTBs, Road Racers, Hybrids & E-Bikes.
- **Strava-like Cyclelava App Showcase**: 3D interactive phone preview with simulated live GPS route, animated speed gauge, cadence, and leaderboard ranking.
- **100% Free Hosting Ready on GitHub Pages**: Zero backend required, instant deployment, custom domain `CNAME` included.
- **Complete SEO & Schema.org**: Rich metadata, OpenGraph, Twitter Cards, Geotags for Islamabad, and `BikeStore` JSON-LD schema.

---

## 🚀 GitHub Pages Free Hosting Deploy Guide (GitHub par Free Deploy Kaise Karein)

### Step 1: GitHub par nayi Repository banayein
1. [github.com](https://github.com) par jayein aur **New repository** par click karein.
2. Repository ka naam rakhein: `cyclelava` (ya jo bhi aap chahein).
3. Public select karein aur repository create karein.

### Step 2: Code push karein
Apne project folder (`c:\Zuggo\cyclelava`) me Git terminal se yeh commands chalayein:

```bash
git init
git add .
git commit -m "Initial commit for Cyclelava with motion graphics"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cyclelava.git
git push -u origin main
```

*(Note: `YOUR_USERNAME` ki jagah apna GitHub username likhein)*

### Step 3: GitHub Pages Enable karein
1. GitHub repository ke **Settings** tab me jayein.
2. Left side menu se **Pages** par click karein.
3. **Build and deployment > Source** me **Deploy from a branch** chunein.
4. Branch me `main` aur folder me `/(root)` select karke **Save** par click karein.
5. 1 se 2 minute me aapki website live ho jayegi!

### Step 4: Custom Domain (`cyclelava.com`) Connect karna
1. Repository Settings > Pages me jayein.
2. **Custom domain** box me `cyclelava.com` enter karein.
3. Apne domain registrar (Namecheap, GoDaddy, Cloudflare wagera) par DNS settings me yeh A-Records add karein:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. "Enforce HTTPS" ko check karein.
