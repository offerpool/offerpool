import dotenv from "dotenv";
dotenv.config();

import { logger } from "./utils/logger.js";

import { buildPostgresTable } from "./utils/build-postgres-table.js";
import { updatePostgresTable } from "./utils/update-postgres-table.js";
import { getOfferDB } from "./utils/get-offer-db.js";
import { attachDbReplicateEvents } from "./utils/attach-db-replicate-events.js";
import { EventEmitter } from "events";

if (process.env.MAX_EVENT_LISTENERS) {
  EventEmitter.defaultMaxListeners = parseInt(process.env.MAX_EVENT_LISTENERS);
}

let db = undefined;

const start = async () => {
  await buildPostgresTable();
  db = await getOfferDB();
  attachDbReplicateEvents(db);
  logger.info("Updating the postgres offer database from the orbitdb database");
  await updatePostgresTable(db, true);
  logger.info("Done updating the postgres offer database");
};

start();
