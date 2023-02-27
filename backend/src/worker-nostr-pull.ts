/** Process that pulls offers from nostr relays */
import dotenv from "dotenv";
dotenv.config();
import { relayInit } from "nostr-tools";
import Queue from "bull";
import { Event, Filter, Relay } from "./types/nostr-types.js";
import { logger } from "./utils/logger.js";
import "websocket-polyfill";
import { addOfferEntryToDB } from "./utils/add-offer-to-db.js";
import { doesOfferExistInPG } from "./utils/does-offer-exist-in-pg.js";

const relaysUrls = process.env.NOSTR_SUB_RELAYS?.split(",") || [];
logger.info(`connecting to relays: ${relaysUrls.join(", ")}`);

// Throttle to 5 offers per second to avoid rate limiting the wallet
interface SubQueueData {
  offer: string;
}
export const subQueue = new Queue<SubQueueData>("pull-offer-from-nostr", {
  limiter: {
    max: 5,
    duration: 1000,
  },
});

const relays: Relay[] = relaysUrls.map((url) => {
  const relay = relayInit(url);
  relay.on("connect", () => {
    logger.info(`connected to ${relay!.url}`);
    subscribeToOfferEvents(relay);
  });
  relay.on("disconnect", () => {
    logger.info(`disconnected from ${relay!.url}, retry in 30 seconds`);
    setTimeout(() => {
      relay.connect();
    }, 30000);
  });
  relay.on("error", (err: any) => {
    logger.error(`error from ${relay!.url}: ${err}`);
  });
  relay.on("notice", (notice: any) => {
    logger.info(`notice from ${relay!.url}: ${notice}`);
  });
  return relay;
});

function subscribeToOfferEvents(relay: Relay) {
  const filter: Filter = {
    kinds: [8444],
  };
  const sub = relay.sub([filter]);
  sub.on("event", async (event: Event) => {
    try {
      const offer = event.content;
      if (!offer.startsWith("offer1")) {
        return;
      }
      const exists = (await doesOfferExistInPG([offer]))[0];
      if (exists) {
        return;
      }
      subQueue.add({ offer });
    } catch (err) {
      logger.error(`Error while processing event: ${err}`);
    }
  });
}

const connections = relays.map((relay) => {
  return relay.connect();
});

subQueue.process(async (job, done) => {
  try {
    const offer = job.data.offer;
    const exists = (await doesOfferExistInPG([offer]))[0];
    if (exists) {
      done();
    }
    await addOfferEntryToDB(offer);
  } catch (err: any) {
    logger.error(`Error while processing event: ${err}`);
    done(err);
  }
  done();
});

const start = async () => {
  const connectionResults = await Promise.allSettled(connections);
  connectionResults.forEach((result, index) => {
    if (result.status !== "fulfilled") {
      logger.error(`Failed to connect to ${relaysUrls[index]}`);
    }
  });
  logger.info("Updating the local offer database from the nostr relays");
};

start();
