#!/bin/bash
# Start backend
cd backend && uvicorn app:app --host 0.0.0.0 --port 8000 &
# Start frontend
cd frontend && npm start -- -H 0.0.0.0 -p 5000
