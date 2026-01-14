# MongoDB to FerretDB Migration

This directory contains the migration tools to migrate data from MongoDB to FerretDB with SQLite backend.

## Overview

FerretDB is a MongoDB-compatible database that uses SQLite as its storage backend. It implements the MongoDB wire protocol, allowing existing MongoDB applications to work without code changes.

## Prerequisites

- Docker and Docker Compose installed
- Existing MongoDB data in `../mongo` directory
- `.env` file configured in `../docker-compose` directory with:
  - `MONGO_ROOT_USER`
  - `MONGO_ROOT_PW`
  - `MONGO_DATABASE` (default: magic-mirror)
  - `NODE_IMG_VERSION` (default: 22)

## Migration Steps

### 1. Prepare for Migration

Before migrating, ensure your current MongoDB data is backed up:

```bash
# Optional: Create a backup of your MongoDB data
cp -r ../mongo ../mongo-backup
```

### 2. Run the Migration

From the `docker-compose` directory:

```bash
cd docker-compose
docker compose -f docker-compose.migrate.yml up
```

This will:
1. Start the source MongoDB instance (connected to existing data at `../mongo`)
2. Start the target FerretDB instance (storing data at `../ferretdb/data`)
3. Run the migration script that copies all collections and indexes

### 3. Monitor the Migration

The migration script will output progress information:
- Collections being migrated
- Document counts
- Index creation
- Any errors encountered

### 4. Verify the Migration

After migration completes successfully, you can verify the data:

```bash
# Connect to FerretDB using MongoDB client
docker exec -it magic-mirror-migration-ferretdb-destination-1 sh

# Or use mongosh to connect
mongosh "mongodb://<user>:<password>@localhost:27018/?authSource=admin&authMechanism=PLAIN"
```

### 5. Switch to FerretDB

Once you've verified the migration was successful:

```bash
# Stop the migration environment
docker compose -f docker-compose.migrate.yml down

# Start your application with FerretDB
docker compose -f docker-compose.yml up
# or for development
docker compose -f docker-compose.dev.yml up
```

## Migration Script Details

The migration script (`migrate.ts`) performs the following operations:

1. **Connection**: Connects to both source MongoDB and target FerretDB
2. **Collection Discovery**: Lists all collections in the source database
3. **Data Migration**: For each collection:
   - Retrieves all documents
   - Drops the target collection (if exists)
   - Inserts documents in batches of 1000
   - Recreates all indexes (except the default `_id` index)
4. **Verification**: Prints summary of migrated documents

## Troubleshooting

### Migration fails with authentication error

Ensure your `.env` file has the correct credentials:
```bash
MONGO_ROOT_USER=your_username
MONGO_ROOT_PW=your_password
```

### FerretDB health check fails

FerretDB might take longer to start. You can:
- Increase the health check `start_period` in `docker-compose.migrate.yml`
- Manually start services one by one

### Partial migration

If migration fails partway through, the script can be re-run. It will:
- Drop existing collections in the target
- Re-migrate all data

### Data verification

To compare document counts:

```bash
# MongoDB (source)
docker exec -it magic-mirror-migration-mongo-source-1 mongosh \
  -u $MONGO_ROOT_USER -p $MONGO_ROOT_PW --authenticationDatabase admin \
  --eval "db.getSiblingDB('magic-mirror').stats()"

# FerretDB (target)
docker exec -it magic-mirror-migration-ferretdb-destination-1 mongosh \
  "mongodb://$MONGO_ROOT_USER:$MONGO_ROOT_PW@localhost:27017/?authSource=admin&authMechanism=PLAIN" \
  --eval "db.getSiblingDB('magic-mirror').stats()"
```

## FerretDB Limitations

FerretDB with SQLite backend has some limitations compared to MongoDB:

1. **Transactions**: SQLite has limited transaction support
2. **Performance**: May be slower for large datasets
3. **Aggregation Pipeline**: Some advanced operations may not be supported
4. **Change Streams**: Not supported

For this application, these limitations should not be an issue as it uses basic MongoDB operations.

## Rollback

If you need to rollback to MongoDB:

1. Stop the FerretDB-based application:
   ```bash
   docker compose -f docker-compose.yml down
   ```

2. Update `docker-compose.yml` to use MongoDB instead of FerretDB:
   - Change `ferretdb` service back to `mongo`
   - Update `depends_on` in backend service
   - Remove `DATABASE_TYPE` environment variable

3. Restart with MongoDB:
   ```bash
   docker compose -f docker-compose.yml up
   ```

## Development

To modify the migration script:

1. Edit `migrate.ts`
2. Rebuild the migration container:
   ```bash
   docker compose -f docker-compose.migrate.yml build migration
   ```
3. Run the updated migration:
   ```bash
   docker compose -f docker-compose.migrate.yml up migration
   ```

## Cleanup

After successful migration, you can remove the old MongoDB data:

```bash
# CAUTION: This will delete your MongoDB data
# Only do this after verifying FerretDB migration is successful
rm -rf ../mongo
```

Keep the migration scripts for future reference or if you need to re-migrate.
