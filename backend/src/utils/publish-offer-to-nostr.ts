import "websocket-polyfill";
import { relayInit } from "nostr-tools";
import { Relay } from "../types/nostr-types.js";
import { logger } from "./logger.js";
import Queue from "bull";
import { getEventHash, signEvent } from "nostr-tools";

const relaysUrls = process.env.NOSTR_PUB_RELAYS?.split(",") || [];
logger.info(`connecting to relays: ${relaysUrls.join(", ")}`);

interface PubQueueData {
  offer: string;
  relayUrl: string;
}

export const pubQueue = new Queue<PubQueueData>("publish-offer-to-nostr", {
  limiter: {
    max: 5 * relaysUrls.length,
    duration: 1000,
  },
});

const relays: Relay[] = relaysUrls.map((url) => {
  const relay: Relay = relayInit(url);
  relay.on("connect", () => {
    logger.info(`connected to ${relay!.url}`);
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

const connections = relays.map((relay) => {
  return relay.connect().catch((err) => {
    logger.error(`error while connecting to relays: ${err}`);
  });
});

export async function publishOfferToNostr(offer: string) {
  // Wait until all relay connections are established or rejected
  Promise.allSettled(connections);
  pubQueue.addBulk(
    relays.map((relay) => ({
      data: { offer, relayUrl: relay.url },
      options: {
        attempts: 3,
        backoff: 1000,
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    }))
  );
}

pubQueue.process(async (job, done) => {
  try {
    const offer = job.data.offer;
    const relayIndex = relaysUrls.findIndex((url) => url === job.data.relayUrl);
    const relay = relays[relayIndex];
    if (relay.status !== 1) {
      // If the relay is not connected, skip it
      done(
        new Error("error while publishing offer to Nostr: relay not connected")
      );
    }
    const event: any = {
      kind: 8444,
      pubkey: process.env.NOSTR_PUBKEY || "",
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: offer,
    };
    event.id = getEventHash(event);
    event.sig = signEvent(event, process.env.NOSTR_PRIVKEY || "");
    relay.publish(event);
    done();
  } catch (err: any) {
    done(err);
  }
});
