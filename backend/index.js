const express = require("express");
const path = require("path");
const boolParser = require("express-query-boolean");

require("dotenv").config();
const OFFER_CHECK_INTERVAL = process.env.OFFER_CHECK_INTERVAL || 120; // Update offeres every 120 seconds by default

const { buildPostgresTable } = require("./utils/build-postgres-table");
const { updatePostgresTable } = require("./utils/update-postgres-table");
const { getOfferDB } = require("./utils/get-offer-db");
const { getOffersRoute } = require("./routes/v1/offers/get");
const { postOffersRoute } = require("./routes/v1/offers/post");
const { updateValidOffers } = require("./utils/update-valid-offers");
const { getCatsRoute } = require("./routes/v1/cats/get");

if (process.env.MAX_EVENT_LISTENERS) {
  require("events").EventEmitter.defaultMaxListeners =
    process.env.MAX_EVENT_LISTENERS;
}

let db = undefined;

const start = async () => {
  await buildPostgresTable();
  db = await getOfferDB();
  await updatePostgresTable(db, true);
  startServer();
};

startServer = () => {
  const app = express();
  const port = 3000;

  app.use(express.json());
  app.use(boolParser());

  app.get("/api/v1/offers", getOffersRoute);

  app.post("/api/v1/offers", postOffersRoute(db));

  app.get("/api/v1/cats", getCatsRoute);

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });

  app.listen(process.env.port || 3000, () => {
    console.log(`Listening at http://localhost:${port}`);
  });
};

start();

setInterval(updateValidOffers, OFFER_CHECK_INTERVAL * 1000);
