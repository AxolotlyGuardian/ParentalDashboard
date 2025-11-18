#!/bin/bash

# Start the FastAPI backend in the background
cd backend
uvicorn app:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start the Next.js frontend (this will run in foreground)
cd ../frontend
npm start -- -H 0.0.0.0 -p 5000

# If frontend exits, kill the backend
kill $BACKEND_PID
