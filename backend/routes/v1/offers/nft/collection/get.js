const { mapCatInfo } = require("../../../../mappers/map-cat-info");
const { mapMinNftInfo } = require("../../../../mappers/map-nft-info");
const { getTableName } = require("../../../../../utils/get-table-name");
const logger = require("pino")();
const { pool } = require("../../../../../utils/query-db");

const getOffersForCollectionRoute = async (req, res) => {
    try {
      const did = req.query["did"];
      const collectionId = req.query["collection_id"];
      const valid = req.query["valid"];

      let statusSearchParam = null;
      // default to only show valid offers
      if (valid == "all") {
        statusSearchParam = null;
      } else if (valid !== undefined) {
        statusSearchParam = valid ? 1 : 0;
      } else {
        statusSearchParam = 1;
      }

      const start = performance.now()
      const results = await pool.query(
        `SELECT offer.*,
        json_agg(json_build_object('nft_launcher_id', nft.launcher_id,
                                   'nft_info', nft.nft_info
            )) as nft_info
        FROM "${getTableName()}" offer
        left outer join "${getTableName()}_nft_info" nft
        on nft.launcher_id = ANY (offer.offered_cats) or
           nft.launcher_id = ANY (offer.requested_cats)
        WHERE 
        ($1::smallint IS NULL OR status = $1::smallint) AND
        nft.collection_id = $2 AND
        nft.minter_did_id = $3
        GROUP BY offer.id`,
        [
          statusSearchParam,
          collectionId,
          did,
        ]
      );
      const gotOffers = performance.now()
      const offers = await Promise.all(results.rows.map(mapRowToOffer));
      const mapOffers = performance.now()
      logger.info({map_offers: mapOffers - gotOffers, get_offers: gotOffers - start})
      res.send({
        offers: offers,
      })
    } catch (error) {
        logger.error({error: error.message, query: req.query}, "Error getting offers")
        res.status(500).send();
    }
}

const mapRowToOffer = async (row) => {
    return {
      offer: row.offer,
      active: row.status ? true : false,
      summary_with_cat_info: {
        offered: await mapCatInfo(row.parsed_offer.offered),
        requested: await mapCatInfo(row.parsed_offer.requested),
      },
      nft_info: mapMinNftInfo(row.nft_info)
    };
  };

  module.exports.getOffersForCollectionRoute = getOffersForCollectionRoute;