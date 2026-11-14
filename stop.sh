#!/usr/bin/env bash
# ASTRA — Stop script
# Kills the backend (main.py) and frontend (vite) processes launched by start.sh

echo "=== ASTRA — Stopping Platform ==="

# Backend
BACKEND_KILLED=0
for pid in $(pgrep -f "astra-backend/main.py" 2>/dev/null); do
  kill "$pid" 2>/dev/null && BACKEND_KILLED=1 && echo "[backend] Stopped PID $pid"
done
# Also catch any python running main.py
for pid in $(pgrep -f "python.*main.py" 2>/dev/null); do
  # Only kill if it's actually our project's main.py
  if ps -p "$pid" -o args= 2>/dev/null | grep -q "astra-backend/main.py"; then
    kill "$pid" 2>/dev/null && echo "[backend] Stopped PID $pid"
  fi
done
if [ "$BACKEND_KILLED" -eq 0 ]; then
  echo "[backend] No backend process found running."
fi

# Frontend (vite / npx)
FRONTEND_KILLED=0
for pid in $(pgrep -af "vite|npx.*vite" 2>/dev/null | awk '{print $1}'); do
  if ps -p "$pid" -o args= 2>/dev/null | grep -qE "vite|astra-frontend"; then
    kill "$pid" 2>/dev/null && FRONTEND_KILLED=1 && echo "[frontend] Stopped PID $pid"
  fi
done
if [ "$FRONTEND_KILLED" -eq 0 ]; then
  echo "[frontend] No frontend process found running."
fi

echo ""
echo "=== ASTRA stopped ==="
