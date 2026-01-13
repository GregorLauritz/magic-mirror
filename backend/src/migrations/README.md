# Database Migrations

This directory contains database migration scripts for the Magic Mirror backend.

## Overview

Migrations are used to safely transform existing data when the database schema changes. Each migration is numbered sequentially and should be run in order.

## Available Migrations

### 001_migrate_train_connections.ts

**Purpose:** Convert legacy single train connection fields to the new multi-connection array format.

**What it does:**
- Finds all user settings with legacy train connection fields (`train_departure_station_id`, `train_arrival_station_id`, etc.)
- Converts them to the new `train_connections` array format
- Adds default `train_display_settings` if not present
- Removes the legacy fields after successful migration

**When to run:** Before deploying the version that removes legacy field support.

## Running Migrations

### Prerequisites

1. Ensure the backend dependencies are installed:
   ```bash
   cd backend
   yarn install
   ```

2. Ensure MongoDB is running and accessible

3. Set up environment variables (or ensure `backend.env` is configured):
   - `MONGO_HOSTNAME`
   - `MONGO_PORT`
   - `MONGO_USERNAME`
   - `MONGO_PASSWORD`

### Running Migrations

#### Option 1: Run All Migrations (Recommended for Production)

This runs all migrations in numerical order:

```bash
cd backend
yarn migrate
```

Or using Docker Compose (recommended for production deployments):

```bash
cd docker-compose
docker compose -f docker-compose.migrate.yml up --build
```

The Docker Compose approach:
- Starts MongoDB with production data volumes
- Runs all migrations in order
- Automatically shuts down after completion
- Ensures migrations run in the same environment as production

#### Option 2: Run a Specific Migration (Development/Testing)

```bash
cd backend
yarn migrate:train-connections
```

Or directly with ts-node:

```bash
cd backend
npx ts-node src/migrations/001_migrate_train_connections.ts
```

### Verifying the Migration

After running the migration, you can verify it worked by:

1. Checking the migration logs for success messages
2. Connecting to MongoDB and inspecting the `usersettings` collection:
   ```javascript
   db.usersettings.find({ train_connections: { $exists: true } })
   ```
3. Verifying that legacy fields are removed:
   ```javascript
   db.usersettings.find({ train_departure_station_id: { $exists: true } })
   ```

## Migration Best Practices

1. **Always backup your database** before running migrations
2. **Test migrations** on a development/staging environment first
3. **Run migrations in order** by their numbered prefix
4. **Never modify a migration** that has already been run in production
5. **Document the migration** clearly in the script and in this README

## Rollback

If you need to rollback a migration:

1. Restore from your database backup (preferred method)
2. Or create a new "reverse" migration that undoes the changes

## Adding New Migrations

1. Create a new file with the next sequential number: `00X_migration_name.ts`
2. Follow the existing migration structure
3. Include clear comments explaining what the migration does
4. Add error handling and logging
5. Document the migration in this README
6. Test thoroughly before deploying

## Production Deployment

### Automated Deployment with Ansible

The Ansible playbook automatically runs migrations before starting the production services:

1. The playbook copies the code to the remote server
2. It runs `docker compose -f docker-compose.migrate.yml up` to execute all migrations
3. Only after successful migration does it start the production services

This ensures database schema is always up-to-date before the application starts.

### Manual Production Deployment

If deploying manually without Ansible:

```bash
# 1. Backup database first!
mongodump --out=/backup/$(date +%Y%m%d)

# 2. Run migrations
cd docker-compose
docker compose -f docker-compose.migrate.yml up --build

# 3. Verify migrations succeeded (check logs)

# 4. Start production services
docker compose up -d
```

## How It Works

### Migration Runner (`run-all.ts`)

The migration runner:
1. Scans the migrations directory for files matching `\d{3}_*.ts`
2. Sorts them numerically (001, 002, 003, etc.)
3. Executes each migration in order
4. Stops on first failure to prevent data corruption
5. Reports summary of successful and failed migrations

### Docker Compose Migration Setup

The `docker-compose.migrate.yml` file:
- Uses the same MongoDB data volume as production (`../mongo:/data/db`)
- Starts MongoDB with a health check
- Waits for MongoDB to be healthy before running migrations
- Runs `yarn migrate` to execute all migrations
- Automatically exits when migrations complete

## Migration Checklist

Before running a migration in production:

- [ ] Backup database
- [ ] Test migration on staging environment
- [ ] Review migration code
- [ ] Verify rollback plan
- [ ] Schedule maintenance window if needed
- [ ] Monitor migration progress
- [ ] Verify data integrity after migration
- [ ] Update application code to use new schema
- [ ] Deploy updated application
