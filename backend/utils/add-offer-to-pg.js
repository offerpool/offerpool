const { getOfferSummary, getOfferValidity } = require("./get-offer-summary");
const { getTableName } = require("./get-table-name");
const { pool } = require("./query-db");
const logger = require("pino")();

/** Adds an offer to the postgres table, returns false if the offer could not be added */
const addOfferEntryToPGDB = async (offer) => {
  try {
    const offerSummary = await getOfferSummary(offer);
    if (!offerSummary || !offerSummary.success) {
      return true;
    }
    const offered_cats = [];
    for (let cat in offerSummary.summary.offered) {
      offered_cats.push(cat);
    }
    const requested_cats = [];
    for (let cat in offerSummary.summary.requested) {
      requested_cats.push(cat);
    }
    const offerStatus = await getOfferValidity(offer);
    if (!offerStatus || !offerStatus.success) {
      return true;
    }

    let status = 0;
    if (offerStatus.valid) {
      status = 1;
    }
    const result = await pool.query(
      `INSERT into "${getTableName()}"(hash, offer, status, offered_cats, requested_cats, parsed_offer) VALUES (sha256($1), $2, $3, $4, $5, $6)`,
      [
        offer,
        offer,
        status,
        offered_cats,
        requested_cats,
        JSON.stringify(offerSummary.summary),
      ]
    );
    logger.info({ offer }, "added offer successfully");
  } catch (err) {
    logger.error({ offer, err }, "error adding offer");
    return false;
  }
  return true;
};

module.exports.addOfferEntryToPGDB = addOfferEntryToPGDB;
