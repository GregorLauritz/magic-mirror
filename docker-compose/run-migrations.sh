#!/bin/bash
#
# Database Migration Runner Script
#
# This script runs database migrations using Docker Compose.
# It ensures proper startup, execution, and cleanup of migration containers.
#
# Usage:
#   ./run-migrations.sh [--backup] [--dry-run]
#
# Options:
#   --backup     Create a database backup before running migrations
#   --dry-run    Show what would be done without actually running migrations
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default options
BACKUP=false
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --backup)
      BACKUP=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--backup] [--dry-run]"
      exit 1
      ;;
  esac
done

# Change to docker-compose directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${GREEN}=== Magic Mirror Database Migration ===${NC}"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  echo "Please create .env file with required variables:"
  echo "  - MONGO_ROOT_USER"
  echo "  - MONGO_ROOT_PW"
  echo "  - NODE_IMG_VERSION"
  exit 1
fi

# Check if backend.env file exists
if [ ! -f "backend.env" ]; then
  echo -e "${RED}Error: backend.env file not found${NC}"
  echo "Please create backend.env file with MongoDB connection settings"
  exit 1
fi

# Backup database if requested
if [ "$BACKUP" = true ]; then
  echo -e "${YELLOW}Creating database backup...${NC}"
  BACKUP_DIR="../backups/$(date +%Y%m%d_%H%M%S)"

  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$BACKUP_DIR"

    # Start MongoDB if not running
    docker compose -f docker-compose.migrate.yml up -d mongo

    # Wait for MongoDB to be ready
    echo "Waiting for MongoDB to be ready..."
    sleep 5

    # Create backup
    docker compose -f docker-compose.migrate.yml exec -T mongo mongodump \
      --out=/dump \
      --username="${MONGO_ROOT_USER}" \
      --password="${MONGO_ROOT_PW}" \
      --authenticationDatabase=admin

    # Copy backup to host
    MONGO_CONTAINER=$(docker compose -f docker-compose.migrate.yml ps -q mongo)
    docker cp "${MONGO_CONTAINER}:/dump" "$BACKUP_DIR"

    echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
  else
    echo "[DRY RUN] Would create backup at: $BACKUP_DIR"
  fi
  echo ""
fi

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "[DRY RUN] Would run: docker compose -f docker-compose.migrate.yml up --build --abort-on-container-exit"
  echo "[DRY RUN] Would run: docker compose -f docker-compose.migrate.yml down"
  echo ""
  echo -e "${GREEN}✓ Dry run complete${NC}"
  exit 0
fi

# Run migrations
if docker compose -f docker-compose.migrate.yml up --build --abort-on-container-exit; then
  echo ""
  echo -e "${GREEN}✓ Migrations completed successfully${NC}"
  MIGRATION_SUCCESS=true
else
  echo ""
  echo -e "${RED}✗ Migration failed${NC}"
  MIGRATION_SUCCESS=false
fi

# Clean up migration containers
echo ""
echo -e "${YELLOW}Cleaning up migration containers...${NC}"
docker compose -f docker-compose.migrate.yml down

if [ "$MIGRATION_SUCCESS" = true ]; then
  echo ""
  echo -e "${GREEN}=== Migration Complete ===${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review migration logs above for any warnings"
  echo "  2. Verify data integrity in the database"
  echo "  3. Start production services: docker compose up -d"
  exit 0
else
  echo ""
  echo -e "${RED}=== Migration Failed ===${NC}"
  echo ""
  echo "What to do:"
  echo "  1. Review error logs above"
  echo "  2. Fix the migration script"
  if [ "$BACKUP" = true ]; then
    echo "  3. Restore from backup: $BACKUP_DIR"
  fi
  echo "  4. Try again"
  exit 1
fi
