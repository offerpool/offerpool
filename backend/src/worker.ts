import dotenv from "dotenv";
dotenv.config();

const OFFER_CHECK_INTERVAL = parseInt(
  process.env.OFFER_CHECK_INTERVAL || "120"
); // Update offers every 120 seconds by default
const NFT_CHECK_INTERVAL = parseInt(process.env.NFT_CHECK_INTERVAL || "187"); // Update offers every 180 seconds by default

import { updateValidOffers } from "./utils/update-valid-offers.js";
import { updateUnsuccessfulNfts } from "./utils/update-unsuccessful-nfts.js";
import { EventEmitter } from "events";

if (process.env.MAX_EVENT_LISTENERS) {
  EventEmitter.defaultMaxListeners = parseInt(process.env.MAX_EVENT_LISTENERS);
}

const start = async () => {
  updateValidOffers();
  updateUnsuccessfulNfts();
  setInterval(updateValidOffers, OFFER_CHECK_INTERVAL * 1000);
  setInterval(updateUnsuccessfulNfts, NFT_CHECK_INTERVAL * 1000);
};

start();
