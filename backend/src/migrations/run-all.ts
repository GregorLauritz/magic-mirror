/**
 * Migration Runner - Executes all migration scripts in order
 *
 * This script discovers and runs all migration files in the migrations directory
 * in numerical order (001_, 002_, etc.). It ensures migrations are executed
 * sequentially and reports any failures.
 *
 * Usage: ts-node src/migrations/run-all.ts
 */

import { readdirSync } from 'fs';
import { join, basename } from 'path';
import { LOGGER } from '../services/loggers';

interface MigrationModule {
  default?: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

async function runAllMigrations(): Promise<void> {
  const migrationsDir = __dirname;

  // Get all migration files (numbered with pattern: 001_*.ts, 002_*.ts, etc.)
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => /^\d{3}_.*\.ts$/.test(file) && file !== 'run-all.ts')
    .sort(); // Sort to ensure numerical order

  if (migrationFiles.length === 0) {
    LOGGER.info('No migration files found');
    return;
  }

  LOGGER.info(`Found ${migrationFiles.length} migration(s) to run`);

  let successCount = 0;
  let failureCount = 0;

  for (const file of migrationFiles) {
    const migrationName = basename(file, '.ts');
    const migrationPath = join(migrationsDir, file);

    LOGGER.info(`========================================`);
    LOGGER.info(`Running migration: ${migrationName}`);
    LOGGER.info(`========================================`);

    try {
      // Dynamically import the migration module
      const migrationModule: MigrationModule = await import(migrationPath);

      // Look for the exported migration function
      // Try common export patterns: default export or named export matching the migration
      const migrationFunction =
        migrationModule.default || Object.values(migrationModule).find((exp) => typeof exp === 'function');

      if (typeof migrationFunction !== 'function') {
        throw new Error(`Migration ${migrationName} does not export a function`);
      }

      // Execute the migration
      await migrationFunction();

      LOGGER.info(`✓ Migration ${migrationName} completed successfully`);
      successCount++;
    } catch (error) {
      LOGGER.error(`✗ Migration ${migrationName} failed:`, error);
      failureCount++;

      // Stop on first failure to prevent data corruption
      LOGGER.error('Stopping migration process due to failure');
      break;
    }
  }

  LOGGER.info(`========================================`);
  LOGGER.info(`Migration Summary:`);
  LOGGER.info(`  Total: ${migrationFiles.length}`);
  LOGGER.info(`  Successful: ${successCount}`);
  LOGGER.info(`  Failed: ${failureCount}`);
  LOGGER.info(`========================================`);

  if (failureCount > 0) {
    process.exit(1);
  }
}

// Run migrations if executed directly
// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      LOGGER.info('All migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      LOGGER.error('Migration process failed:', error);
      process.exit(1);
    });
}

export { runAllMigrations };
