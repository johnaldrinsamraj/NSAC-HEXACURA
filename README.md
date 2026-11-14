# ASTRA

**Autonomous Spaceflight Tracking & Risk Assessment**

AI-powered astronaut health intelligence platform built for long-duration missions and Mission Control awareness.

[![Start locally](https://img.shields.io/badge/start-locally-7c3aed?logo=terminal&logoColor=white)](https://github.com/your-org/astra#start-locally)
[![Frontend](https://img.shields.io/badge/frontend-react%2019%20%2B%20tailwind%20v4-4f46e5?logo=react&logoColor=white)](https://github.com/your-org/astra#frontend)
[![Backend](https://img.shields.io/badge/backend-fastapi%20%2B%20sqlite-0694ff?logo=fastapi&logoColor=white)](https://github.com/your-org/astra#backend)

---

## What it is

ASTRA is a demonstration decision-support platform for astronaut health monitoring. It combines personalized baselines, anomaly detection, behavioral wellness tracking, environmental context, a 3D digital twin, an AI health assistant, and a Mission Control dashboard into one intelligence console.

The project is designed for the next frontier of human spaceflight, where crews need onboard health awareness and Mission Control needs a shared operational picture. It is a demonstration and decision-support tool, not a substitute for professional medical assessment.

## Project scope

ASTRA is a NASA Space Apps Challenge project proposal turned into a working local prototype. The current codebase is a redesigned React + Tailwind v4 frontend connected to the original FastAPI + SQLite backend, with seven functional modules plus a new Overview dashboard.

| Module | Purpose |
| --- | --- |
| **Overview** | Default landing dashboard with mission snapshot cards and module launch cards |
| **Live** | Physiological telemetry and current vitals with trend visualization |
| **Predict** | Personalized anomaly detection, deviating indicators, and analysis history |
| **Twin** | Interactive 3D digital twin driven by Three.js |
| **Mind** | Crew wellness check-ins, mood/stress/fatigue tracking, and a reaction-time mini-game |
| **Shield** | Space environment context, including radiation exposure and event history |
| **Copilot** | Research-grounded AI health assistant interface |
| **Command** | Mission Control view with crew overview, alert feed, and charts |

## Tech stack

- **Frontend:** React 19, Tailwind CSS 4, Vite 8, Recharts, Three.js
- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **Intelligence:** scikit-learn, pandas, NumPy
- **Polish:** Cinematic space artwork, orbital ambient motion, staggered entrances, soft status pulses, reduced-motion support

## Artwork

Generated space artwork is stored in `astra-frontend/public/`:

- `space-hero.png` — hero panel background
- `orbit-station.png` — hero panel alternate background
- `nebula-depth.png` — page ambient background
- `astra-command-art.png` — command/empty-state banner

## Start locally

### Prerequisites

- Python 3.10+
- Node.js 20+

### Backend

```bash
cd astra-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

Backend runs on `http://localhost:8000`.

### Frontend

```bash
cd astra-frontend
npm install
npm run dev -- --host 0.0.0.0
```

Frontend runs on `http://localhost:5173`.

### One-command launcher

After dependencies are installed, run:

```bash
./start.sh
```

`start.sh` starts both services and no longer deletes or reseeds the SQLite database on every launch. Use **Load demo mission** on the Overview page when you want sample data.

## Demo data

The app is most useful once demo data is loaded. From the Overview page, choose **Load demo mission** to seed:

- A crew of astronauts
- Sample telemetry history
- Wellness check-ins
- Reaction-game results
- Radiation environment readings
- A built-in anomaly scenario for one crew member

## API

The frontend talks to `http://localhost:8000` during local development. The backend exposes endpoints for:

- astronauts
- measurements
- anomaly detection
- baselines
- forecasts
- wellness check-ins
- reaction-game results
- environment readings
- alerts
- Mission Control overview
- Copilot Q&A
- demo seeding and telemetry simulation

See `astra-backend/main.py` for the current endpoint set.

## Notes

- This is a local demo stack. The current API client points at `http://localhost:8000`.
- Data shown by the app depends on what is in the SQLite database.
- Generated artwork and motion are intended to give the interface a cinematic space feel while keeping the underlying app a functional prototype.
- Real NASA data integration is a planned next step rather than a finished feature in this codebase.

## Status

This repository contains a functional frontend and backend prototype built around an astronaut health intelligence concept. It is suitable for demoing the experience, exploring the architecture, and extending the platform further.

## Built for

NASA Space Apps Challenge — **ASTRA: Autonomous Spaceflight Tracking & Risk Assessment**.

---

*Your Health. Your Mission. Your Guardian.*
