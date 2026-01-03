import { Database, IDatabaseConenction } from 'services/database/database';
import { connect, Mongoose } from 'mongoose';

export class MongoDb extends Database {
  private _connection: Mongoose | null = null;
  constructor(dbConnection: IDatabaseConenction) {
    super(dbConnection, 'mongodb');
  }

  protected buildConnectionString(dbConnection: IDatabaseConenction): string {
    const credentials =
      dbConnection.username && dbConnection.password ? `${dbConnection.username}:${dbConnection.password}` : '';
    const options = dbConnection.options
      ? '?' + dbConnection.options?.map((op) => `${op.name}=${op.value}`).join('&')
      : '';
    return `${this._databaseType}://${credentials}@${dbConnection.hostname}:${dbConnection.port}/${dbConnection.database}${options}`;
  }

  protected initDatabaseConnection(): void {
    connect(this._connectionString)
      .then((con) => {
        this._connection = con;
        console.log('MongoDB connected successfully');
      })
      .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
      });
  }
}
