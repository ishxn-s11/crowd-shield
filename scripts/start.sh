#!/bin/bash
# CrowdShield — Local Development Startup
# Usage: bash scripts/start.sh

set -e

echo "╔══════════════════════════════════════════╗"
echo "║     CROWDSHIELD — Safety Platform        ║"
echo "║     Starting all services...             ║"
echo "╚══════════════════════════════════════════╝"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found"
    exit 1
fi

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# ── Install API dependencies ──
echo ""
echo "📦 Installing API dependencies..."
cd services/api
pip install -q -r requirements.txt
cd ../..

# ── Start API Server ──
echo ""
echo "🚀 Starting API server on port 8000..."
cd services/api
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
API_PID=$!
cd ../..
sleep 3

# Check if API is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API server running on http://localhost:8000"
else
    echo "   ❌ API server failed to start"
    kill $API_PID 2>/dev/null
    exit 1
fi

# ── Install Dashboard dependencies ──
echo ""
echo "📦 Installing dashboard dependencies..."
cd apps/dashboard
npm install --silent 2>/dev/null
cd ../..

# ── Start Dashboard ──
echo ""
echo "🖥️  Starting dashboard on port 5173..."
cd apps/dashboard
npx vite --host 0.0.0.0 --port 5173 &
DASH_PID=$!
cd ../..

sleep 2
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  CROWDSHIELD IS RUNNING!                 ║"
echo "║                                          ║"
echo "║  🖥️  Dashboard:  http://localhost:5173   ║"
echo "║  📡 API:        http://localhost:8000    ║"
echo "║  📋 API Docs:   http://localhost:8000/docs ║"
echo "║                                          ║"
echo "║  Demo: Click a scenario to start!        ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo ''; echo 'Shutting down...'; kill $API_PID $DASH_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
