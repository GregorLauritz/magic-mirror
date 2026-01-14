# FerretDB Data Directory

This directory stores the FerretDB database files using SQLite as the backend.

## Structure

- `data/` - Contains the SQLite database files
  - `data.sqlite` - Main SQLite database file
  - `data.sqlite-shm` - Shared memory file (temporary)
  - `data.sqlite-wal` - Write-ahead log file (temporary)

## Volume Mounting

In Docker Compose, this directory is mounted to `/state` in the FerretDB container:

```yaml
volumes:
  - ../ferretdb/data:/state
```

FerretDB is configured to use SQLite at this path:

```yaml
environment:
  - FERRETDB_POSTGRESQL_URL=sqlite:///state/data.sqlite
```

## Backup

To backup your FerretDB database, simply copy the `data/` directory:

```bash
cp -r data data-backup-$(date +%Y%m%d)
```

## Restore

To restore from a backup:

```bash
# Stop the application
docker compose down

# Restore the data
rm -rf data
cp -r data-backup-YYYYMMDD data

# Restart the application
docker compose up
```

## Important Notes

- Do not manually edit SQLite files while FerretDB is running
- The `.sqlite-shm` and `.sqlite-wal` files are temporary and managed by SQLite
- For production deployments, consider regular automated backups
