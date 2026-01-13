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

### Running a Migration

#### Option 1: Using ts-node directly

```bash
cd backend
npx ts-node src/migrations/001_migrate_train_connections.ts
```

#### Option 2: Using yarn/npm script (if configured)

```bash
cd backend
yarn migrate:train-connections
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
