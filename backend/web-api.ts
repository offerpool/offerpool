import dotenv from "dotenv";
dotenv.config();

import express from "express";
import boolParser from "express-query-boolean";
import { logger } from "./utils/logger.js";
import pinoHttp from "pino-http";
import { getOfferDB } from "./utils/get-offer-db.js";
import { getOffersRoute } from "./routes/v1/offers/get.js";
import { postOffersRoute } from "./routes/v1/offers/post.js";
import { getCatsRoute } from "./routes/v1/cats/get.js";
import { customLogLevel } from "./utils/http-request-log-level.js";
import { liveRoute } from "./routes/diagnostics/live.js";
import { readyRoute } from "./routes/diagnostics/ready.js";
import { nodeRoute } from "./routes/diagnostics/node.js";
import { getOffersForCollectionRoute } from "./routes/v1/offers/nft/collection/get.js";
import compression from "compression";
import cors from "cors";
import { getOfferByHash } from "./routes/v1/offers/[id]/get.js";
import { downloadOffer } from "./routes/v1/offers/[id]/download-offer.js";
import { EventEmitter } from "events";
import {join} from "path";

if (process.env.MAX_EVENT_LISTENERS) {
  EventEmitter.defaultMaxListeners = parseInt(
    process.env.MAX_EVENT_LISTENERS
  );
}

let db: any = undefined;

const startServer = () => {
  const app = express();
  const port = parseInt(process.env.PORT || "3000");

  app.use(express.json({ limit: "500kb" }));
  app.use(boolParser());
  app.use(pinoHttp.default({ customLogLevel: customLogLevel }));
  app.use(compression());

  app.get("/api/v1/offers", getOffersRoute);
  app.get("/api/v1/offers/:id.offer", cors(), downloadOffer);
  app.get("/api/v1/offers/:id", cors(), getOfferByHash);

  app.get("/api/v1/offers/nft/collection", cors(), getOffersForCollectionRoute);

  app.post("/api/v1/offers", postOffersRoute(db));

  app.get("/api/v1/cats", getCatsRoute);

  app.get("/diagnostics/live", liveRoute);

  app.get("/diagnostics/ready", readyRoute);

  app.get("/diagnostics/node", nodeRoute);

  app.use(express.static("../client/build"));

  // Handles any requests that don't match the ones above
  app.get('*', (_, res) =>{
    res.sendFile(join(__dirname+'/client/build/index.html'));
  });

  app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
};

const start = async () => {
  db = await getOfferDB("web-api");
  startServer();
};

start();
