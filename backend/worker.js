const logger = require("pino")();

require("dotenv").config();

const OFFER_CHECK_INTERVAL = process.env.OFFER_CHECK_INTERVAL || 120; // Update offers every 120 seconds by default

const { buildPostgresTable } = require("./utils/build-postgres-table");
const { updatePostgresTable } = require("./utils/update-postgres-table");
const { getOfferDB } = require("./utils/get-offer-db");
const { updateValidOffers } = require("./utils/update-valid-offers");
const { attachDbReplicateEvents } = require("./utils/attach-db-replicate-events");

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
  updatePostgresTable(db, true).then(() => {
    logger.info("Done updating the postgres offer database");
    setInterval(updateValidOffers, OFFER_CHECK_INTERVAL * 1000);
  });
};

start();