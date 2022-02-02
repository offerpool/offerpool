const { doesOfferExistInPG } = require("../../../utils/does-offer-exist-in-pg");
const { getOfferSummary } = require("../../../utils/get-offer-summary");

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
      res.status(400).json({
        success: false,
        error_message: "offer already exists in database",
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
    res.json({ success: true });
  } catch {
    res.json({ success: false, error_message: "unknown error" });
  }
};

module.exports.postOffersRoute = postOffersRoute;
