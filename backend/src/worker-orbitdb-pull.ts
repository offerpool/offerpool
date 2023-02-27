/** Process that pulls offers from orbit db */
import dotenv from "dotenv";
dotenv.config();

import { logger } from "./utils/logger.js";

import { updateLocalDB } from "./utils/update-local-db.js";
import { getOfferDB } from "./utils/get-offer-db.js";
import { attachDbReplicateEvents } from "./utils/attach-db-replicate-events.js";
import { EventEmitter } from "events";

if (process.env.MAX_EVENT_LISTENERS) {
  EventEmitter.defaultMaxListeners = parseInt(process.env.MAX_EVENT_LISTENERS);
}

let db = undefined;

const start = async () => {
  db = await getOfferDB();
  attachDbReplicateEvents(db);
  logger.info("Updating the local offer database from the orbitdb database");
  await updateLocalDB(db, true);
  logger.info("Done updating the local offer database");
};

start();
