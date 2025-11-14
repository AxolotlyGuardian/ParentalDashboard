#!/bin/bash
# Start backend on port 8000
cd backend && uvicorn app:app --host 0.0.0.0 --port 8000 &
# Start frontend on port 5000 (required for autoscale webview)
cd frontend && npm start -- -H 0.0.0.0 -p 5000
