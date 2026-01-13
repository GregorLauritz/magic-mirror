# Database Migrations with Docker Compose

This guide explains how to run database migrations using Docker Compose.

## Quick Start

Run all migrations:

```bash
docker compose -f docker-compose.migrate.yml up --build
```

The migrations will:
1. Start MongoDB with production data
2. Run all migration scripts in order (001, 002, 003, etc.)
3. Automatically shut down when complete

## What Happens

### Services Started

1. **mongo** - MongoDB server with production data volume mounted
   - Uses the same data directory as production (`../mongo:/data/db`)
   - Configured with the same credentials
   - Includes health check to ensure it's ready

2. **migrate** - Migration runner container
   - Builds from `backend/docker/Dockerfile.migrate`
   - Waits for MongoDB to be healthy
   - Runs `yarn migrate` to execute all migrations
   - Exits when migrations complete

### Migration Process

The migration runner (`run-all.ts`):
- Discovers all migration files (`001_*.ts`, `002_*.ts`, etc.)
- Sorts them numerically
- Executes each migration sequentially
- Stops on first failure
- Reports success/failure summary

## Production Deployment

### With Ansible (Recommended)

The Ansible playbook automatically runs migrations:

```bash
ansible-playbook -i inventory ansible/rpi_setup.yml
```

The playbook will:
1. Deploy code to the server
2. Run migrations using `docker-compose.migrate.yml`
3. Start production services only after successful migration

### Manual Deployment

```bash
# 1. Backup your database first!
docker exec magic-mirror-mongo-1 mongodump --out=/backup/$(date +%Y%m%d)

# 2. Run migrations
cd docker-compose
docker compose -f docker-compose.migrate.yml up --build --abort-on-container-exit

# 3. Check exit code
echo $?  # Should be 0 for success

# 4. Clean up migration containers
docker compose -f docker-compose.migrate.yml down

# 5. Start or restart production services
docker compose up -d
```

## Troubleshooting

### Migration Failed

If a migration fails:

1. **Check logs:**
   ```bash
   docker compose -f docker-compose.migrate.yml logs migrate
   ```

2. **Restore from backup:**
   ```bash
   docker exec magic-mirror-mongo-1 mongorestore /backup/YYYYMMDD
   ```

3. **Fix the issue** in the migration script

4. **Try again:**
   ```bash
   docker compose -f docker-compose.migrate.yml up --build
   ```

### MongoDB Not Starting

If MongoDB fails to start:

```bash
# Check MongoDB logs
docker compose -f docker-compose.migrate.yml logs mongo

# Verify volume permissions
ls -la ../mongo

# Try starting MongoDB separately
docker compose -f docker-compose.migrate.yml up mongo
```

### Migration Container Won't Exit

If the migrate container doesn't exit automatically:

```bash
# Force stop
docker compose -f docker-compose.migrate.yml down

# Check for issues
docker compose -f docker-compose.migrate.yml logs
```

## Environment Variables

The migration setup uses these environment variables from `.env`:

- `MONGO_ROOT_USER` - MongoDB root username
- `MONGO_ROOT_PW` - MongoDB root password
- `NODE_IMG_VERSION` - Node.js version for migration container

And from `backend.env`:

- `MONGO_HOSTNAME` - MongoDB hostname (usually "mongo")
- `MONGO_PORT` - MongoDB port (usually 27017)

## Adding New Migrations

1. Create a new migration file:
   ```bash
   touch backend/src/migrations/002_my_new_migration.ts
   ```

2. Follow the template:
   ```typescript
   import mongoose from 'mongoose';
   import { mongoDbData } from '../config';
   import { LOGGER } from '../services/loggers';

   async function myNewMigration(): Promise<void> {
     // Connect to database
     // Perform migration
     // Close connection
   }

   if (require.main === module) {
     myNewMigration()
       .then(() => process.exit(0))
       .catch((error) => {
         console.error('Migration failed:', error);
         process.exit(1);
       });
   }

   export { myNewMigration };
   ```

3. Test locally:
   ```bash
   cd backend
   yarn migrate
   ```

4. The Ansible deployment will automatically run it

## Best Practices

1. **Always backup before migrations** - Migrations modify production data
2. **Test migrations on staging first** - Catch issues before production
3. **Make migrations idempotent** - Safe to run multiple times
4. **Stop on failure** - Don't continue if one migration fails
5. **Log everything** - Makes debugging easier
6. **Number sequentially** - 001, 002, 003, etc.
7. **Document what it does** - Clear comments in the migration file
