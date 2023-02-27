import dotenv from "dotenv";
dotenv.config();

import express, { urlencoded } from "express";
import boolParser from "express-query-boolean";
import pinoHttp from "pino-http";
import compression from "compression";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { EventEmitter } from "events";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import Queue from "bull";
import {
  BullAdapter,
  createBullBoard,
  ExpressAdapter,
} from "@bull-board/express";
import { randomUUID } from "crypto";

import { logger } from "./utils/logger.js";
import { getOffersRoute } from "./routes/v1/offers/get.js";
import { postOffersRoute } from "./routes/v1/offers/post.js";
import { getCatsRoute } from "./routes/v1/cats/get.js";
import { customLogLevel } from "./utils/http-request-log-level.js";
import { liveRoute } from "./routes/diagnostics/live.js";
import { readyRoute } from "./routes/diagnostics/ready.js";
import { nodeRoute } from "./routes/diagnostics/node.js";
import { getOffersForCollectionRoute } from "./routes/v1/offers/nft/collection/get.js";
import { getOfferByHash } from "./routes/v1/offers/[id]/get.js";
import { downloadOffer } from "./routes/v1/offers/[id]/download-offer.js";
import { getOfferDB } from "./utils/get-offer-db.js";
import { pubQueue } from "./utils/publish-offer-to-nostr.js";
import { ensureLoggedIn } from "connect-ensure-login";

//#region passport
passport.use(
  new LocalStrategy(function (username, password, cb) {
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return cb(null, { user: "admin" });
    }
    return cb(null, false);
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user as any);
});
//#endregion

if (process.env.MAX_EVENT_LISTENERS) {
  EventEmitter.defaultMaxListeners = parseInt(process.env.MAX_EVENT_LISTENERS);
}

let db: any = undefined;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const startServer = () => {
  const app = express();
  const port = parseInt(process.env.PORT || "3000");

  const bullServerAdapter = new ExpressAdapter();
  bullServerAdapter.setBasePath("/admin/bull-ui");

  createBullBoard({
    queues: [
      new BullAdapter(pubQueue, { readOnlyMode: true }),
      new BullAdapter(Queue("pull-offer-from-nostr"), { readOnlyMode: true }),
    ],
    serverAdapter: bullServerAdapter,
  });

  app.use(express.json({ limit: "500kb" }));
  app.use(boolParser());
  app.use(urlencoded({ extended: false }));
  app.use(pinoHttp.default({ customLogLevel: customLogLevel }));
  app.use(compression());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || randomUUID(),
      saveUninitialized: false,
      resave: true,
    })
  );
  app.use(passport.initialize({}));
  app.use(passport.session());

  // API routes
  app.get("/api/v1/offers", getOffersRoute);
  app.get("/api/v1/offers/:id.offer", cors(), downloadOffer);
  app.get("/api/v1/offers/:id", cors(), getOfferByHash);
  app.get("/api/v1/offers/nft/collection", cors(), getOffersForCollectionRoute);
  app.post("/api/v1/offers", postOffersRoute(db));
  app.get("/api/v1/cats", getCatsRoute);

  // Diagnostics routes
  app.get("/diagnostics/live", liveRoute);
  app.get("/diagnostics/ready", readyRoute);
  app.get("/diagnostics/node", nodeRoute);

  // Admin routes
  app.post(
    "/admin/login",
    passport.authenticate("local", {
      failureRedirect: "/admin/login?invalid=true",
    }),
    (_, res) => {
      res.redirect("/admin/bull-ui");
    }
  );
  app.use(
    "/admin/bull-ui",
    ensureLoggedIn({ redirectTo: "/admin/login" }),
    bullServerAdapter.getRouter()
  );

  // Serve static files from the React app
  app.use(express.static("../client/build"));

  // Handles any requests that don't match the ones above for react router
  app.get("*", (_, res) => {
    res.sendFile(join(__dirname, "../../client/build/index.html"));
  });
  app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
};

const start = async () => {
  if (!process.env.DISABLE_ORBIT_DB_SHARING) {
    db = await getOfferDB("web-api");
  }
  startServer();
};

start();
