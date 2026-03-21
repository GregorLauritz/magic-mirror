import { Database, IDatabaseConnection } from 'services/database/database';
import { connect, Mongoose } from 'mongoose';
import { LOGGER } from 'services/loggers';

export class FerretDb extends Database {
  private _connection: Mongoose | null = null;

  constructor(dbConnection: IDatabaseConnection) {
    super(dbConnection, 'ferretdb');
  }

  protected buildConnectionString(dbConnection: IDatabaseConnection): string {
    const credentials =
      dbConnection.username && dbConnection.password ? `${dbConnection.username}:${dbConnection.password}` : '';
    const options = dbConnection.options
      ? '?' + dbConnection.options.map((op) => `${op.name}=${op.value}`).join('&')
      : '';
    return `mongodb://${credentials}@${dbConnection.hostname}:${dbConnection.port}/${dbConnection.database}${options}`;
  }

  protected initDatabaseConnection(): void {
    connect(this._connectionString)
      .then((con) => {
        this._connection = con;
        LOGGER.info('FerretDB connection established successfully');
      })
      .catch((error) => {
        LOGGER.error('Failed to connect to FerretDB', { error });
        throw error;
      });
  }

  public getConnection(): Mongoose | null {
    return this._connection;
  }
}
