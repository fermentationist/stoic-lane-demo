import { open } from "sqlite";
import sqlite3 from "sqlite3";

const SQLITE_FILENAME = "./server/services/db/database.db";

const config = {
  filename: SQLITE_FILENAME,
  driver: sqlite3.cached.Database,
};

const db = await open(config);

const createTable = `
  CREATE TABLE IF NOT EXISTS redirects(
    id BIGINT PRIMARY KEY NOT NULL,
    url VARCHAR(2048) NOT NULL UNIQUE
  );
`;

await db.exec(createTable);

export default db;
