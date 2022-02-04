const { getOfferValidity } = require("./get-offer-summary");
const { pool } = require("./query-db");
const crypto = require("crypto");
const { getTableName } = require("./get-table-name");
const { boolParse } = require("./bool-parse");
const logger = require("pino")();

let updating = false;
let requestToUpdate = 0;

const updateValidOffers = async () => {
  if (boolParse(process.env.SKIP_UPDATE_STATUS_JOB, false)) {
    logger.info("Skipping Offer Update Job");
    return;
  }
  if (updating) {
    requestToUpdate++;
    return;
  }
  updating = true;
  const start = new Date();
  logger.info("Starting Offer Update");
  // TODO: page through offers to limit memory usage
  const offers = await pool.query(
    `SELECT id, offer FROM "${getTableName()}"
        WHERE 
        (status = 1)`
  );
  logger.info(`Offer Update Found ${offers.rows.length} Offers`);
  // Do 10 offers at once
  const batch_size = 10;
  const batches = offers.rows.length / batch_size;
  let currentPosition = 0;
  for (let batch = 0; batch < batches; batch++) {
    offerPromises = [];
    for (
      let i = 0;
      i < 10 && currentPosition < offers.rows.length;
      i++, currentPosition++
    ) {
      const offer = offers.rows[currentPosition].offer;
      const id = offers.rows[currentPosition].id;
      offerPromises.push(updateOffer(offer, id));
    }
    await Promise.all(offerPromises);
  }

  logger.info(
    `Updating statuses for ${offers.rows.length} offers took ${
      (new Date().getTime() - start.getTime()) / 1000
    } seconds.`
  );
  updating = false;
  if (requestToUpdate) {
    requestToUpdate = 0;
    updateValidOffers();
  }
};

const updateOffer = async (offer, id) => {
  const offerStatus = await getOfferValidity(offer);
  if (!offerStatus || !offerStatus.success) {
    return;
  }
  if (!offerStatus.valid) {
    logger.info(`Updating status of offer ${id}`);
    pool.query(`UPDATE "${getTableName()}" SET status = 0 WHERE id = $1`, [id]);
  }
};

module.exports.updateValidOffers = updateValidOffers;
