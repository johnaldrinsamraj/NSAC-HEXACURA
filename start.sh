#!/usr/bin/env bash
# ASTRA — Start script
# Starts backend (FastAPI on :8000) and frontend (Vite dev server on :5173)
set -e

PROJ_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJ_DIR/astra-backend"
FRONTEND_DIR="$PROJ_DIR/astra-frontend"

echo "=== ASTRA — Starting Platform ==="
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""

# --- Backend ---
if lsof -i :8000 -sTCP:LISTEN -P -n 2>/dev/null | grep -q LISTEN; then
  echo "[backend] Port 8000 already in use — skipping backend start."
else
  echo "[backend] Starting FastAPI server..."
  cd "$BACKEND_DIR"
  # Preserve the existing SQLite database between launches.
  python main.py > /tmp/astra-backend.log 2>&1 &
  BACKEND_PID=$!
  echo "[backend] PID $BACKEND_PID — log: /tmp/astra-backend.log"
  # Wait for health endpoint
  for i in $(seq 1 30); do
    if curl -s --max-time 2 http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
      echo "[backend] Ready."
      break
    fi
    sleep 1
  done
  if ! curl -s --max-time 2 http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo "[backend] WARNING: server did not become ready within 30s. Check /tmp/astra-backend.log"
  fi
fi

# Demo data can be loaded from the Overview screen when desired.

# --- Frontend ---
if lsof -i :5173 -sTCP:LISTEN -P -n 2>/dev/null | grep -q LISTEN; then
  echo "[frontend] Port 5173 already in use — skipping frontend start."
else
  echo "[frontend] Starting Vite dev server..."
  cd "$FRONTEND_DIR"
  nohup npx vite --host 0.0.0.0 --port 5173 > /tmp/astra-frontend.log 2>&1 &
  FRONTEND_PID=$!
  echo "[frontend] PID $FRONTEND_PID — log: /tmp/astra-frontend.log"
  for i in $(seq 1 30); do
    if curl -s --max-time 2 http://127.0.0.1:5173 > /dev/null 2>&1; then
      echo "[frontend] Ready."
      break
    fi
    sleep 1
  done
  if ! curl -s --max-time 2 http://127.0.0.1:5173 > /dev/null 2>&1; then
    echo "[frontend] WARNING: server did not become ready within 30s. Check /tmp/astra-frontend.log"
  fi
fi

echo ""
echo "=== ASTRA is running ==="
echo "  Open http://localhost:5173 in your browser"
echo ""
