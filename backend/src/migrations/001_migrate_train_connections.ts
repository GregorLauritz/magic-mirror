/**
 * Migration: Convert legacy train connection fields to new array format
 *
 * This migration:
 * 1. Finds all userSettings documents with legacy train connection fields
 * 2. Converts them to the new train_connections array format
 * 3. Adds default train_display_settings if not present
 * 4. Removes the legacy fields
 *
 * Run this script with: ts-node src/migrations/001_migrate_train_connections.ts
 */

import mongoose from 'mongoose';
import { mongoDbData } from '../config';
import { LOGGER } from '../services/loggers';

interface LegacyUserSettings {
  _id: mongoose.Types.ObjectId;
  sub: string;
  train_departure_station_id?: string;
  train_departure_station_name?: string;
  train_arrival_station_id?: string;
  train_arrival_station_name?: string;
  train_connections?: Array<{
    id: string;
    departureStationId: string;
    departureStationName: string;
    arrivalStationId: string;
    arrivalStationName: string;
  }>;
  train_display_settings?: {
    mode: 'carousel' | 'multiple';
    carouselInterval: number;
  };
}

async function connectToDatabase(): Promise<void> {
  const { hostname, port, username, password } = mongoDbData;
  const mongoUrl = `mongodb://${username}:${password}@${hostname}:${port}/magicmirror?authSource=admin`;

  await mongoose.connect(mongoUrl);
  LOGGER.info('Connected to MongoDB for migration');
}

async function migrateTrainConnections(): Promise<void> {
  try {
    await connectToDatabase();

    const UserSettingsModel = mongoose.connection.collection('usersettings');

    // Find all documents with legacy train connection fields
    const legacyDocs = (await UserSettingsModel.find({
      $or: [
        { train_departure_station_id: { $exists: true, $ne: null, $ne: '' } },
        { train_arrival_station_id: { $exists: true, $ne: null, $ne: '' } },
      ],
    }).toArray()) as unknown as LegacyUserSettings[];

    LOGGER.info(`Found ${legacyDocs.length} documents with legacy train connection fields`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const doc of legacyDocs) {
      // Skip if already has train_connections with data
      if (doc.train_connections && doc.train_connections.length > 0) {
        LOGGER.info(`Skipping user ${doc.sub}: already has train_connections`);
        skippedCount++;
        continue;
      }

      // Skip if legacy fields are incomplete
      if (!doc.train_departure_station_id || !doc.train_arrival_station_id) {
        LOGGER.info(`Skipping user ${doc.sub}: incomplete legacy train data`);
        skippedCount++;
        continue;
      }

      // Create new train connection from legacy fields
      const newConnection = {
        id: `migrated-${Date.now()}`,
        departureStationId: doc.train_departure_station_id,
        departureStationName: doc.train_departure_station_name || '',
        arrivalStationId: doc.train_arrival_station_id,
        arrivalStationName: doc.train_arrival_station_name || '',
      };

      // Create default train display settings if not present
      const defaultDisplaySettings = {
        mode: 'carousel' as const,
        carouselInterval: 15,
      };

      // Update the document
      const updateResult = await UserSettingsModel.updateOne(
        { _id: doc._id },
        {
          $set: {
            train_connections: [newConnection],
            train_display_settings: doc.train_display_settings || defaultDisplaySettings,
          },
          $unset: {
            train_departure_station_id: '',
            train_departure_station_name: '',
            train_arrival_station_id: '',
            train_arrival_station_name: '',
          },
        },
      );

      if (updateResult.modifiedCount > 0) {
        LOGGER.info(`Migrated user ${doc.sub}: converted legacy train connection to new format`);
        migratedCount++;
      } else {
        LOGGER.warn(`Failed to migrate user ${doc.sub}`);
      }
    }

    LOGGER.info('Migration completed');
    LOGGER.info(`Summary: ${migratedCount} migrated, ${skippedCount} skipped`);
  } catch (error) {
    LOGGER.error('Migration failed', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    LOGGER.info('Database connection closed');
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateTrainConnections()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateTrainConnections };
