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

# Return to workspace root
cd /workspaces/magic-mirror

echo ""
echo "========================================="
echo "✓ Magic Mirror Dev Environment Ready!"
echo "========================================="
echo ""
echo "Quick Start Commands:"
echo "  Frontend: cd frontend && yarn dev"
echo "  Image:    docker build -f frontend/docker/Dockerfile -t magic-mirror frontend"
echo ""
echo "For more commands, see CLAUDE.md and LOCAL_DEV.md"
echo "========================================="
