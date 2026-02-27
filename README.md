# Seoul Spice Market (Consumer Demo)

A Korean-theme consumer ordering website inspired by Swiggy-style flows.

## Features
- Product catalog with images, descriptions, categories, and prices
- Search + category filtering
- Cart management with quantity controls and bill calculation
- Login/signup modal before checkout
- Checkout form with contact + address
- Real-time payment portal simulation with progress timeline
- Live order tracking updates after placement
- Korean-inspired light/dark color palettes

## Run locally
```bash
python3 -m http.server 4173
# then open http://localhost:4173
```

## Deploy on Render
Use a **Web Service** (Node) with:
- Build command: `yarn build`
- Start command: `yarn start`

This repository now includes a `package.json` and lightweight Node static server (`server.js`) so Render no longer fails with missing `package.json`.

## Tech
- HTML5
- CSS3 (responsive)
- Vanilla JavaScript

## Product photos
- The storefront now looks first for real product photos at `assets/photos/*.png` for the 5 SKUs (`k-start`, `k-bold`, `k-fire`, `k-bold-x2`, `k-fire-cup`).
- If a PNG is missing, it automatically falls back to the existing SVG in the same folder.
