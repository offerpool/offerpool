import { getOfferValidity } from "./get-offer-summary.js";
import { pool } from "./query-db.js";
import { getTableName } from "./get-table-name.js";
import { logger } from "./logger.js";

let updating = false;
let requestToUpdate = 0;

export const updateValidOffers = async () => {
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
    logger.info(`Updating offer batch ${batch} of ${batches}`);
    let offerPromises = [];
    for (
      let i = 0;
      i < batch_size && currentPosition < offers.rows.length;
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

const updateOffer = async (offer: string, id: string) => {
  const offerStatus = await getOfferValidity(offer);
  if (!offerStatus) {
    return;
  }
  if (!offerStatus.valid) {
    logger.info(`Updating status of offer ${id}`);
    await pool.query(
      `UPDATE "${getTableName()}" SET status = 0 WHERE id = $1`,
      [id]
    );
  }
};
