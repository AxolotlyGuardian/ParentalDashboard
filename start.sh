#!/bin/bash
set -e

echo "Starting Axolotly deployment..."

# Start the FastAPI backend in the background
echo "Starting FastAPI backend on port 8000..."
cd backend
uvicorn app:app --host 0.0.0.0 --port 8000 --log-level info &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to initialize..."
sleep 5

# Check if backend is actually running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERROR: Backend failed to start!"
    exit 1
fi

# Start the Next.js frontend (this will run in foreground)
echo "Starting Next.js frontend on port 5000..."
cd ../frontend
npm start -- -H 0.0.0.0 -p 5000

# If frontend exits, kill the backend
kill $BACKEND_PID 2>/dev/null || true
