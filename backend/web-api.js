const express = require("express");
const boolParser = require("express-query-boolean");
const logger = require("pino")();
const pinoHttp = require("pino-http");

require("dotenv").config();

const { getOfferDB } = require("./utils/get-offer-db");
const { getOffersRoute } = require("./routes/v1/offers/get");
const { postOffersRoute } = require("./routes/v1/offers/post");
const { getCatsRoute } = require("./routes/v1/cats/get");
const { customLogLevel } = require("./utils/http-request-log-level");
const { liveRoute } = require("./routes/diagnostics/live");
const { readyRoute } = require("./routes/diagnostics/ready");
const { getOffersForCollectionRoute } = require("./routes/v1/offers/nft/collection/get");
const compression = require("compression");
const cors = require('cors');
const { getOfferByHash } = require("./routes/v1/offers/[id]/get");

if (process.env.MAX_EVENT_LISTENERS) {
  require("events").EventEmitter.defaultMaxListeners = parseInt(
    process.env.MAX_EVENT_LISTENERS
  );
}

let db = undefined;

const start = async () => {
  db = await getOfferDB("web-api");
  startServer();
};

startServer = () => {
  const app = express();
  const port = 3000;

  app.use(express.json({limit: "500kb"}));
  app.use(boolParser());
  app.use(pinoHttp({ customLogLevel: customLogLevel }));
  app.use(compression());

  app.get("/api/v1/offers", getOffersRoute);
  app.get("/api/v1/offers/:id", cors(), getOfferByHash);

  app.get("/api/v1/offers/nft/collection", cors(), getOffersForCollectionRoute);

  app.post("/api/v1/offers", postOffersRoute(db));

  app.get("/api/v1/cats", getCatsRoute);

  app.get("/diagnostics/live", liveRoute);

  app.get("/diagnostics/ready", readyRoute);

  app.use(express.static("../client/build"));

  app.listen(process.env.port || 3000, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
};

start();
