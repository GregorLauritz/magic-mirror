import MongoStore from 'connect-mongo';
import session from 'express-session';
import { Database } from 'services/database/database';

const getStore = (database: Database): session.Store => {
  return new MongoStore({ mongoUrl: database.getConnectionString() });
};

const funcMap = new Map<string, (database: Database) => session.Store>([['ferretdb', getStore]]);

export const getSessionStore = (database: Database): session.Store | undefined => {
  const f = funcMap.get(database.getDatabaseType());
  if (f) {
    return f(database);
  }
};
