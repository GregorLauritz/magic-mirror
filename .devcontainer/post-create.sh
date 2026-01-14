#!/bin/bash

set -e

echo "========================================="
echo "Setting up Magic Mirror Dev Environment"
echo "========================================="

# Enable corepack for Yarn
echo "Enabling Yarn via corepack..."
sudo corepack enable
corepack prepare yarn@stable --activate

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd /workspaces/magic-mirror/frontend
yarn install

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd /workspaces/magic-mirror/backend
yarn install

# Return to workspace root
cd /workspaces/magic-mirror

echo ""
echo "========================================="
echo "✓ Magic Mirror Dev Environment Ready!"
echo "========================================="
echo ""
echo "Quick Start Commands:"
echo "  Frontend: cd frontend && yarn dev"
echo "  Backend:  cd backend && yarn dev"
echo "  Docker:   cd docker-compose && docker compose -f docker-compose.dev.yml up"
echo ""
echo "For more commands, see CLAUDE.md"
echo "========================================="
