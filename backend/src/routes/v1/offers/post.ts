import { addOfferEntryToDB } from "../../../utils/add-offer-to-db.js";
import { base58 } from "../../../utils/base-58.js";
import { doesOfferExistInPG } from "../../../utils/does-offer-exist-in-pg.js";
import { getOfferSummary } from "../../../utils/get-offer-summary.js";
import { logger } from "../../../utils/logger.js";
import { createHash } from "crypto";
import { publishOfferToNostr } from "../../../utils/publish-offer-to-nostr.js";

export const postOffersRoute = (db: any) => async (req: any, res: any) => {
  try {
    const offer = req.body.offer;
    if (!offer || !offer.startsWith || !offer.startsWith("offer")) {
      res.status(400).json({
        success: false,
        error_message: "invalid offer",
      });
      return;
    }
    const id = base58.encode(createHash("sha256").update(offer).digest());
    const offerAlreadyExists = (await doesOfferExistInPG([offer]))[0];
    if (offerAlreadyExists) {
      res.json({
        success: true,
        id,
        download_url: `https://offerpool.io/api/v1/offers/${id}.offer`,
        share_url: `https://offerpool.io/offers/${id}`,
      });
      return;
    }
    const offerSummary = await getOfferSummary(offer);
    if (!offerSummary || "error" in offerSummary) {
      res.status(400).json({
        success: false,
        error_message: "invalid offer",
      });
      return;
    }
    await db?.add({ offer_blob: offer });

    // Add the offer to the local database right away instead of waiting for ipfs callbacks
    await addOfferEntryToDB(offer);
    publishOfferToNostr(offer);

    res.json({
      success: true,
      id,
      download_url: `https://offerpool.io/api/v1/offers/${id}.offer`,
      share_url: `https://offerpool.io/offers/${id}`,
    });
  } catch (e) {
    logger.error(e);
    res.json({ success: false, error_message: "unknown error" });
  }
};
