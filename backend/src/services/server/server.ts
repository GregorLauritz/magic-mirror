import express from 'express';
import { default as session } from 'express-session';
import bodyParser from 'body-parser';
import { ENABLE_HTTPS, FRONTEND_URL, RATE_LIMIT, SESSION_SECRET } from 'config';
import { default as cors } from 'cors';
import compression from 'compression';

import { EXPRESS_LOGGER } from 'services/loggers';
import { Database } from 'services/database/database';
import { getSessionStore } from 'services/server/session_store';
import * as http2 from 'http2';
import http2Express from 'http2-express-bridge';
import helmet from 'helmet';
import RateLimit from 'express-rate-limit';

export abstract class Server<T extends http2.Http2Server> {
  protected readonly _app: express.Application;
  protected readonly _port: number;
  private readonly _database: Database;

  get app(): express.Application {
    return this._app;
  }

  protected _server!: T;

  get server(): T {
    return this._server;
  }

  constructor(database: Database, port = 3001) {
    this._port = port;
    this._database = database;
    this._app = http2Express(express);
    this._app.set('port', port);
    this.configureExpress();
  }

  private configureExpress() {
    this.setupLogging();
    //this.setupSession();
    this.setupBodyParsers();
    this.setupCors();
    this.setupDefaultMiddlewares();
  }

  private setupLogging() {
    this._app.use(EXPRESS_LOGGER);
  }

  private setupSession() {
    this._app.use(
      session({
        secret: SESSION_SECRET,
        resave: true,
        saveUninitialized: false,
        rolling: true,
        cookie: {
          secure: ENABLE_HTTPS,
          httpOnly: true,
          sameSite: true,
          maxAge: 2.592e9, //30d
        },
        store: getSessionStore(this._database),
      }),
    );
  }

  private setupBodyParsers() {
    this._app.use(bodyParser.json());
    this._app.use(bodyParser.urlencoded({ extended: true }));
  }

  private setupCors() {
    this._app.use(cors({ origin: FRONTEND_URL, credentials: true }));
  }

  private async setupDefaultMiddlewares() {
    this._app.use(compression());
    this._app.use(helmet());
    this._app.use(RateLimit(RATE_LIMIT));
  }

  public abstract start(): void;
}
