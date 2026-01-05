export interface IDatabaseConnectionOptions {
  name: string;
  value: string;
}

export interface IDatabaseConnection {
  hostname: string;
  port: number;
  database?: string;
  username?: string;
  password?: string;
  options?: Array<IDatabaseConnectionOptions>;
}

export abstract class Database {
  protected readonly _connectionString: string;
  protected readonly _databaseType: string;

  constructor(dbConnection: IDatabaseConnection, databaseType: string) {
    this._databaseType = databaseType;
    this._connectionString = this.buildConnectionString(dbConnection);
    this.initDatabaseConnection();
  }

  public getDatabaseType = (): string => this._databaseType;

  public getConnectionString = (): string => this._connectionString;

  protected abstract buildConnectionString(dbConnection: IDatabaseConnection): string;

  protected abstract initDatabaseConnection(): void;
}
