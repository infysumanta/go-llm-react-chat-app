#!/bin/bash
set -e

echo "==> Installing frontend dependencies..."
cd frontend
npm install

echo "==> Building frontend..."
npm run build

echo "==> Building Go binary..."
cd ..
go mod tidy
go build -o llm-chat

echo "==> Done! Run with: ./llm-chat"
