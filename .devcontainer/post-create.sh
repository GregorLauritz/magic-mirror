#!/bin/bash

# Enable strict error handling
set -e

echo "🚀 Setting up Magic Mirror development environment..."

# Enable corepack for Yarn
echo "📦 Enabling Corepack for Yarn..."
corepack enable

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd /workspace/frontend
yarn install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd /workspace/backend
yarn install

# Create environment files if they don't exist
echo "⚙️  Setting up environment files..."
cd /workspace/docker-compose

if [ ! -f "backend.env" ]; then
  echo "Creating backend.env..."
  cat > backend.env << 'EOF'
SERVER_PORT=3001
MONGO_HOSTNAME=db
MONGO_PORT=27017
MONGO_USERNAME=admin
MONGO_PASSWORD=password
TZ=UTC
EOF
fi

if [ ! -f "frontend.env" ]; then
  echo "Creating frontend.env..."
  cat > frontend.env << 'EOF'
VITE_API_BASE_URL=http://localhost:3001
EOF
fi

if [ ! -f "proxy.env" ]; then
  echo "Creating proxy.env (placeholder)..."
  cat > proxy.env << 'EOF'
# OAuth2 Proxy configuration
# You'll need to configure these with your Google OAuth credentials
OAUTH2_PROXY_CLIENT_ID=your-client-id
OAUTH2_PROXY_CLIENT_SECRET=your-client-secret
OAUTH2_PROXY_COOKIE_SECRET=your-cookie-secret
EOF
fi

echo "✅ Development environment setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Configure OAuth2 credentials in docker-compose/proxy.env"
echo "  2. Run 'cd frontend && yarn dev' to start the frontend"
echo "  3. Run 'cd backend && yarn dev' to start the backend"
echo "  4. Or use 'cd docker-compose && docker compose -f docker-compose.dev.yml up' for full stack"
echo ""
echo "🎉 Happy coding!"
