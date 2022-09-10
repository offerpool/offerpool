const { addOfferEntryToPGDB } = require("../../../utils/add-offer-to-pg");
const { doesOfferExistInPG } = require("../../../utils/does-offer-exist-in-pg");
const { getOfferSummary } = require("../../../utils/get-offer-summary");
const logger = require("pino")();

const postOffersRoute = (db) => async (req, res) => {
  try {
    const offer = req.body.offer;
    if (!offer || !offer.startsWith || !offer.startsWith("offer")) {
      res.status(400).json({
        success: false,
        error_message: "invalid offer",
      });
      return;
    }
    const offerAlreadyExists = (await doesOfferExistInPG([offer]))[0];
    if (offerAlreadyExists) {
      res.json({
        success: true,
      });
      return;
    }
    const offerSummary = await getOfferSummary(offer);
    if (!offerSummary || !offerSummary.success) {
      res.status(400).json({
        success: false,
        error_message: "invalid offer",
      });
      return;
    }
    await db.add({ offer_blob: offer });

    // Add the offer to the postgres database right away instead of waiting for ipfs callbacks
    await addOfferEntryToPGDB(offer);

    res.json({ success: true });
  } catch(e) {
    logger.error(e);
    res.json({ success: false, error_message: "unknown error" });
  }
};

module.exports.postOffersRoute = postOffersRoute;
