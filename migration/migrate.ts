import { MongoClient } from 'mongodb';

interface MigrationConfig {
  sourceUri: string;
  targetUri: string;
  database: string;
}

interface CollectionStats {
  name: string;
  documentCount: number;
}

const config: MigrationConfig = {
  sourceUri: process.env.SOURCE_MONGO_URI || 'mongodb://localhost:27017',
  targetUri: process.env.TARGET_MONGO_URI || 'mongodb://localhost:27018',
  database: process.env.MONGO_DATABASE || 'magic-mirror',
};

async function migrateCollection(
  sourceClient: MongoClient,
  targetClient: MongoClient,
  dbName: string,
  collectionName: string,
): Promise<CollectionStats> {
  console.log(`\n📦 Migrating collection: ${collectionName}`);

  const sourceDb = sourceClient.db(dbName);
  const targetDb = targetClient.db(dbName);

  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);

  // Get all documents from source
  const documents = await sourceCollection.find({}).toArray();
  console.log(`   Found ${documents.length} documents`);

  if (documents.length === 0) {
    console.log(`   ⚠️  No documents to migrate`);
    return { name: collectionName, documentCount: 0 };
  }

  // Get collection indexes from source
  const indexes = await sourceCollection.indexes();
  console.log(`   Found ${indexes.length} indexes`);

  // Clear target collection if it exists
  try {
    await targetCollection.drop();
    console.log(`   🗑️  Dropped existing target collection`);
  } catch (error: any) {
    // Collection might not exist, which is fine
    if (error.code !== 26) {
      // 26 = NamespaceNotFound
      console.log(`   ℹ️  Target collection doesn't exist yet`);
    }
  }

  // Insert documents in batches
  const batchSize = 1000;
  let insertedCount = 0;

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    await targetCollection.insertMany(batch, { ordered: false });
    insertedCount += batch.length;
    console.log(`   ✓ Inserted ${insertedCount}/${documents.length} documents`);
  }

  // Create indexes (skip _id_ index as it's created automatically)
  const indexesToCreate = indexes.filter((idx) => idx.name !== '_id_');
  for (const index of indexesToCreate) {
    try {
      // Remove internal MongoDB fields
      const { v, ns, ...indexSpec } = index as any;
      const { name, key, ...options } = indexSpec;

      await targetCollection.createIndex(key, { ...options, name });
      console.log(`   ✓ Created index: ${name}`);
    } catch (error: any) {
      console.error(`   ❌ Failed to create index ${index.name}:`, error.message);
    }
  }

  console.log(`   ✅ Migration completed for ${collectionName}`);
  return { name: collectionName, documentCount: insertedCount };
}

async function migrate(): Promise<void> {
  console.log('🚀 Starting MongoDB to FerretDB migration\n');
  console.log(`Source URI: ${config.sourceUri.replace(/\/\/.*@/, '//***@')}`);
  console.log(`Target URI: ${config.targetUri.replace(/\/\/.*@/, '//***@')}`);
  console.log(`Database: ${config.database}\n`);

  const sourceClient = new MongoClient(config.sourceUri);
  const targetClient = new MongoClient(config.targetUri);

  try {
    // Connect to both databases
    console.log('🔌 Connecting to source MongoDB...');
    await sourceClient.connect();
    console.log('✅ Connected to source MongoDB');

    console.log('🔌 Connecting to target FerretDB...');
    await targetClient.connect();
    console.log('✅ Connected to target FerretDB');

    // Get list of collections from source
    const sourceDb = sourceClient.db(config.database);
    const collections = await sourceDb.listCollections().toArray();
    console.log(`\n📋 Found ${collections.length} collections to migrate:`);
    collections.forEach((col) => console.log(`   - ${col.name}`));

    // Migrate each collection
    const results: CollectionStats[] = [];
    for (const collection of collections) {
      const stats = await migrateCollection(sourceClient, targetClient, config.database, collection.name);
      results.push(stats);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total collections migrated: ${results.length}`);
    results.forEach((stat) => {
      console.log(`  ${stat.name}: ${stat.documentCount} documents`);
    });
    console.log('='.repeat(60));
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await sourceClient.close();
    await targetClient.close();
    console.log('\n🔌 Connections closed');
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
