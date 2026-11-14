# ASTRA — redesigned interface

This package contains the redesigned ASTRA React frontend and the original FastAPI/SQLite backend. The existing feature pages and API integrations are retained; the new Overview dashboard is the default entry point.

## Start (Kali Linux / Debian / Ubuntu)

1. Install Python 3.10+ and Node.js 20+.
2. Backend:
   ```bash
   cd astra-backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python main.py
   ```
3. In another terminal, frontend:
   ```bash
   cd astra-frontend
   npm install
   npm run dev -- --host 0.0.0.0
   ```
4. Open `http://localhost:5173`.

Alternatively, after installing dependencies, run `./start.sh` from this project directory. The launcher no longer deletes the SQLite database or automatically re-seeds it on every start.

## Overview

- Cinematic generated deep-space hero artwork and custom ASTRA orbital mark.
- Responsive left navigation with seven original modules plus Overview.
- Mission snapshot cards, module launch cards and demo-data initialization.
- Existing Live, Predict, Twin, Mind, Shield, Copilot and Command pages remain wired to the original API.
- Refined responsive styling, typography, spacing, visual hierarchy and status treatments.
- Premium motion layer: drifting starfield, orbital ambient glow, animated hero light sweep, staggered card entrances, hover lift, soft status pulses and reduced-motion accessibility.
- Three original AI-generated space artworks for the hero, ambient page background and mission banner.

Generated artwork is stored in `astra-frontend/public/`: `space-hero.png`, `orbit-station.png`, `nebula-depth.png`, and `astra-command-art.png`.

## Notes

- The frontend API client currently targets `http://localhost:8000` in `src/services/api.js`, matching the local development setup.
- Values shown by the app depend on data in the SQLite database. Use **Load demo mission** on the Overview page to populate sample data.
- This is a demonstration/decision-support project, not a substitute for professional medical assessment.
