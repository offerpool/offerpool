import dotenv from "dotenv";
dotenv.config();

import { logger } from "./utils/logger.js";

const OFFER_CHECK_INTERVAL = parseInt(
  process.env.OFFER_CHECK_INTERVAL || "120"
); // Update offers every 120 seconds by default
const NFT_CHECK_INTERVAL = parseInt(process.env.NFT_CHECK_INTERVAL || "187"); // Update offers every 180 seconds by default

import { buildPostgresTable } from "./utils/build-postgres-table.js";
import { updatePostgresTable } from "./utils/update-postgres-table.js";
import { getOfferDB } from "./utils/get-offer-db.js";
import { updateValidOffers } from "./utils/update-valid-offers.js";
import { attachDbReplicateEvents } from "./utils/attach-db-replicate-events.js";
import { updateUnsuccessfulNfts } from "./utils/update-unsuccessful-nfts.js";

if (process.env.MAX_EVENT_LISTENERS) {
  require("events").EventEmitter.defaultMaxListeners = parseInt(
    process.env.MAX_EVENT_LISTENERS
  );
}

let db = undefined;

const start = async () => {
  await buildPostgresTable();
  db = await getOfferDB();
  attachDbReplicateEvents(db);
  logger.info("Updating the postgres offer database from the orbitdb database");
  await updatePostgresTable(db, true);
  logger.info("Done updating the postgres offer database");
  updateValidOffers();
  updateUnsuccessfulNfts();
  setInterval(updateValidOffers, OFFER_CHECK_INTERVAL * 1000);
  setInterval(updateUnsuccessfulNfts, NFT_CHECK_INTERVAL * 1000);
};

start();
