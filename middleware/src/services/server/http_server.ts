import * as http from "http";
import { Database } from "../database/database";
import { LOGGER } from "../loggers";
import { Server } from "./server";

export class HttpServer extends Server<http.Server> {
    constructor(database: Database, port = 3001) {
        super(database, port)
    }

    public start() {
        this._server = http.createServer(this._app).listen(this._port, () => {
            LOGGER.info(`HTTP Server is running on port ${this._port}`);
        });
    }
}