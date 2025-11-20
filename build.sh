#!/bin/bash
set -e

echo "===== Axolotly Build Process ====="

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt

# Build frontend
echo "Building frontend..."
cd ../frontend
npm run build

echo "===== Build Complete ====="
